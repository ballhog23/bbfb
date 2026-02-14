import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as path from 'node:path';

import { FckNatInstanceProvider } from 'cdk-fck-nat';
import { Construct } from 'constructs';
import { GithubActionsOidc } from './cicd/cicd';

// should look into splitting code into separate stacks for testing?
export class BBFBInfraStack extends cdk.Stack {
    private DB_PORT: number = 5432;
    private APP_PORT: number = 3000;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // nat instance
        const natGatewayProvider = new FckNatInstanceProvider({
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
            enableSsm: true,
        });

        const vpc = new ec2.Vpc(this, 'bbfb-vpc', {
            vpcName: 'bbfb-vpc',
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/24'),
            maxAzs: 1,
            natGatewayProvider: natGatewayProvider,
            natGateways: 1,
            createInternetGateway: true,
            subnetConfiguration: [
                {
                    cidrMask: 26,
                    name: 'PublicSubnet',
                    subnetType: ec2.SubnetType.PUBLIC
                },
                {
                    cidrMask: 26,
                    name: 'PrivateSubnetApp',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 26,
                    name: 'PrivateSubnetDb',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
        });

        // rename the NAT instance via ASG tags
        natGatewayProvider.autoScalingGroups.forEach(asg => {
            cdk.Tags.of(asg).add('Name', `${this.stackName}/NatInstance`);
        });

        // restricts nat instance to accept only traffic from private subnets
        // further restricts comms to port 443-HTTPs only
        vpc.privateSubnets.forEach(subnet => {
            natGatewayProvider.securityGroup.addIngressRule(
                ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.HTTPS
            );
        });

        // define security groups for instances
        const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
            vpc,
            description: 'App instance security group',
        });
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSg', {
            vpc,
            description: 'Db instance security group',
            allowAllOutbound: false,
        });
        const reverseProxySecurityGroup = new ec2.SecurityGroup(this, 'ReverseProxySg', {
            vpc,
            description: 'Reverse Proxy instance security group',
        });

        // reverse proxy instance, we should also build a load balancer to try
        const reverseProxy = new ec2.Instance(this, 'ReverseProxyInstance', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
            machineImage: ec2.MachineImage.latestAmazonLinux2023({
                cpuType: ec2.AmazonLinuxCpuType.ARM_64
            }),
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            securityGroup: reverseProxySecurityGroup,
        });

        // allow http/s traffic incoming from internet on reverse proxy instance
        const httpPorts = [80, 443];
        httpPorts.forEach(
            port => reverseProxy.connections.allowFrom(
                ec2.Peer.anyIpv4(), ec2.Port.tcp(port), 'Allow reverse proxy http communication from internet'
            )
        );

        const appInstance = new ec2.Instance(this, 'AppInstance', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
            machineImage: ec2.MachineImage.latestAmazonLinux2023({
                cpuType: ec2.AmazonLinuxCpuType.ARM_64
            }),
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroup: appSecurityGroup,
        });

        // SSM agent needs this policy to communicate with AWS Systems Manager
        appInstance.role.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
        );

        appInstance.connections.allowFrom(
            reverseProxy, ec2.Port.tcp(this.APP_PORT), 'Allow Reverse Proxy and App communcation'
        );

        const dbInstance = new ec2.Instance(this, 'DbInstance', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
            machineImage: ec2.MachineImage.latestAmazonLinux2023({
                cpuType: ec2.AmazonLinuxCpuType.ARM_64
            }),
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroup: dbSecurityGroup,
        });

        dbInstance.connections.allowFrom(
            appInstance, ec2.Port.tcp(this.DB_PORT), 'Allow Db and App communication'
        );

        // define security group for ec2 instance connect endpoint
        const eicSecurityGroup = new ec2.SecurityGroup(this, 'EicEndpointSg', {
            vpc,
            description: 'EC2 Instance Connect Endpoint security group',
            allowAllOutbound: false,
        });

        // EC2 Instance Connect Endpoint for SSH into private instances
        const eicEndpoint = new ec2.CfnInstanceConnectEndpoint(this, 'EicEndpoint', {
            subnetId: vpc.privateSubnets[0].subnetId,
            securityGroupIds: [eicSecurityGroup.securityGroupId],
        });

        const instancesArray = [reverseProxy, appInstance, dbInstance];
        // Allow the EIC endpoint to reach instances on SSH
        instancesArray.forEach(instance => {
            instance.connections.allowFrom(
                eicSecurityGroup, ec2.Port.SSH, 'Allow SSH from EIC Endpoint'
            );
        });

        // shared lambda config
        const lambdaDefaults = {
            runtime: lambda.Runtime.NODEJS_LATEST,
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            environment: {
                APP_URL: `http://${appInstance.instancePrivateIp}:${this.APP_PORT}`,
            },
            bundling: { minify: true },
        };

        const makeLambda = (id: string, file: string, description: string) =>
            new nodejs.NodejsFunction(this, id, {
                ...lambdaDefaults,
                entry: path.join(__dirname, `./lambda-handlers/${file}.ts`),
                handler: 'handler',
                description,
                retryAttempts: 0, // step function handles retries
            });

        // step function chain: leagues → users → rosters → matchups
        const syncLeagueLambda = makeLambda('syncLeagueLambda', 'syncLeagueHandler', 'sync leagues from sleeper api');
        const syncUsersLambda = makeLambda('syncUsersLambda', 'syncUsersHandler', 'sync users from sleeper api');
        const syncRostersLambda = makeLambda('syncRostersLambda', 'syncRostersHandler', 'sync rosters from sleeper api');
        const syncMatchupsLambda = makeLambda('syncMatchupsLambda', 'syncMatchupsHandler', 'sync matchups from sleeper api based on league state');

        // independent lambdas: players and league state (daily schedule, not in step function)
        const syncPlayersLambda = makeLambda('syncPlayersLambda', 'syncPlayersHandler', 'sync players from sleeper api');
        const syncLeagueStateLambda = makeLambda('syncLeagueStateLambda', 'syncLeagueStateHandler', 'sync league state from sleeper api');

        // schedule gate lambda (no VPC needed, just checks date/time)
        const scheduleGateLambda = new nodejs.NodejsFunction(this, 'scheduleGateLambda', {
            runtime: lambda.Runtime.NODEJS_LATEST,
            entry: path.join(__dirname, './lambda-handlers/scheduleGateHandler.ts'),
            handler: 'handler',
            description: 'checks if sync should run based on day/time/season',
            retryAttempts: 0,
            bundling: { minify: true },
        });

        // allow app instance to accept traffic from all lambdas
        const allLambdas = [
            syncLeagueLambda, syncUsersLambda,
            syncRostersLambda, syncMatchupsLambda,
            syncPlayersLambda, syncLeagueStateLambda
        ];
        allLambdas.forEach(fn => {
            appInstance.connections.allowFrom(fn, ec2.Port.tcp(this.APP_PORT));
        });

        // retry config for step function tasks: 3 attempts with backoff, catch all error types
        const retryPolicy: sfn.RetryProps = {
            errors: ['States.ALL'],
            maxAttempts: 3,
            interval: cdk.Duration.seconds(10),
            backoffRate: 2,
        };

        // step function definition
        // gate needs resultPath to feed the Choice state, all others discard output
        const gateStep = new tasks.LambdaInvoke(this, 'ScheduleGate', {
            lambdaFunction: scheduleGateLambda,
            resultPath: '$.gate',
        });

        const syncLeagueStep = new tasks.LambdaInvoke(this, 'SyncLeagues', {
            lambdaFunction: syncLeagueLambda,
            resultPath: sfn.JsonPath.DISCARD,
        }).addRetry(retryPolicy);

        const syncUsersStep = new tasks.LambdaInvoke(this, 'SyncUsers', {
            lambdaFunction: syncUsersLambda,
            resultPath: sfn.JsonPath.DISCARD,
        }).addRetry(retryPolicy);

        const syncRostersStep = new tasks.LambdaInvoke(this, 'SyncRosters', {
            lambdaFunction: syncRostersLambda,
            resultPath: sfn.JsonPath.DISCARD,
        }).addRetry(retryPolicy);

        const syncMatchupsStep = new tasks.LambdaInvoke(this, 'SyncMatchups', {
            lambdaFunction: syncMatchupsLambda,
            resultPath: sfn.JsonPath.DISCARD,
        }).addRetry(retryPolicy);

        const skipExecution = new sfn.Succeed(this, 'SkipExecution');

        // gate → choice: if shouldRun, chain the syncs; otherwise skip
        const shouldRunChoice = new sfn.Choice(this, 'ShouldRun')
            .when(
                sfn.Condition.booleanEquals('$.gate.Payload.shouldRun', false),
                skipExecution
            )
            .otherwise(syncLeagueStep);

        // chain: leagues → users → rosters → matchups
        syncLeagueStep
            .next(syncUsersStep)
            .next(syncRostersStep)
            .next(syncMatchupsStep);

        const definition = gateStep.next(shouldRunChoice);

        const syncStateMachine = new sfn.StateMachine(this, 'SyncStateMachine', {
            definitionBody: sfn.DefinitionBody.fromChainable(definition),
            timeout: cdk.Duration.minutes(5),
            stateMachineName: 'bbfb-sync-chain',
        });

        // EventBridge: trigger step function every 15 minutes (gate handles day/time/season logic)
        const syncChainRule = new events.Rule(this, 'SyncChainRule', {
            schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
        });
        syncChainRule.addTarget(new targets.SfnStateMachine(syncStateMachine));

        // EventBridge: players + league state run once daily during the season
        const dailySyncRule = new events.Rule(this, 'DailySyncRule', {
            schedule: events.Schedule.cron({ minute: '0', hour: '14', month: '9-1' }),
        });
        dailySyncRule.addTarget(new targets.LambdaFunction(syncPlayersLambda));
        dailySyncRule.addTarget(new targets.LambdaFunction(syncLeagueStateLambda));

        // GitHub Actions OIDC: allows deploy workflow to run commands on the app instance via SSM
        new GithubActionsOidc(this, 'GithubActionsOidc', appInstance.instanceId);
    }
}
