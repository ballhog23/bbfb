import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { FckNatInstanceProvider } from 'cdk-fck-nat';
import { Construct } from 'constructs';

// should look into splitting code into separate stacks for testing?
export class BBFBInfraStack extends cdk.Stack {
    private DB_PORT: number = 5432;
    private APP_PORT: number = 3000;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // nat instance
        const natGatewayProvider = new FckNatInstanceProvider({
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
        });

        // rename the NAT instance via ASG tags
        natGatewayProvider.autoScalingGroups.forEach(asg => {
            cdk.Tags.of(asg).add('Name', `${this.stackName}/NatInstance`);
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
                    name: 'IsolatedSubnetDb',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
                // we are only using 256-(64*3) available ips
                // aws also reserves 5ips per subnet "network, broadcast, vpc router, dns server, reserved"
                // VPC Total = 256
                // subnet total = 64*3, account -5 ips per subnet 59*3
            ],
        });

        const appSubnet = vpc.privateSubnets[0];

        // restricts nat instance to accept only traffic from the App Subnet
        // further restricts comms to port 443-HTTPs only
        natGatewayProvider.securityGroup.addIngressRule(
            ec2.Peer.ipv4(appSubnet.ipv4CidrBlock), ec2.Port.HTTPS
        );

        // explicitly define security groups
        const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
            vpc,
            description: 'App instance security group',
        });
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSg', {
            vpc,
            description: 'Db instance security group',
            allowAllOutbound: false
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
            securityGroup: reverseProxySecurityGroup
        });

        // allow http/s traffic incoming from internet
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
            securityGroup: appSecurityGroup
        });

        appInstance.connections.allowFrom(
            reverseProxy, ec2.Port.tcp(this.APP_PORT), 'Allow Reverse Proxy and App communcation'
        );

        const dbInstance = new ec2.Instance(this, 'DbInstance', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
            machineImage: ec2.MachineImage.latestAmazonLinux2023({
                cpuType: ec2.AmazonLinuxCpuType.ARM_64
            }),
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            securityGroup: dbSecurityGroup
        });

        dbInstance.connections.allowFrom(
            appInstance, ec2.Port.tcp(this.DB_PORT), 'Allow Db and App communication'
        );
    }
}
