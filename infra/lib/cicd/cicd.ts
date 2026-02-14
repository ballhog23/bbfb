import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

// github actions OIDC integration
// allows the deploy workflow to authenticate to AWS without stored credentials.
// flow: GitHub signs a JWT → AWS verifies it via the OIDC provider → runner assumes the role → calls ssm:SendCommand
export class GithubActionsOidc extends Construct {
    public readonly role: iam.Role;

    constructor(scope: Construct, id: string, appInstanceId: string) {
        super(scope, id);

        const githubOrg = 'ballhog23';
        const githubRepo = 'bbfb';

        // register GitHub as a trusted identity provider in this AWS account.
        // the thumbprint is GitHub's OIDC server certificate fingerprint —
        // AWS requires it but doesn't actually validate it for GitHub (they use a trusted CA).
        const oidcProvider = new iam.OpenIdConnectProvider(this, 'GithubOidcProvider', {
            url: 'https://token.actions.githubusercontent.com',
            clientIds: ['sts.amazonaws.com'],
            thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
        });

        // the role GitHub Actions will assume.
        // trust policy: only tokens from this specific repo + master branch can assume it.
        this.role = new iam.Role(this, 'GithubActionsDeployRole', {
            roleName: 'bbfb-github-actions-deploy',
            assumedBy: new iam.FederatedPrincipal(
                oidcProvider.openIdConnectProviderArn,
                {
                    StringEquals: {
                        'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                    },
                    StringLike: {
                        'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:ref:refs/heads/master`,
                    },
                },
                'sts:AssumeRoleWithWebIdentity',
            ),
            maxSessionDuration: cdk.Duration.hours(1),
        });

        // allow the role to send commands to the app instance only
        this.role.addToPolicy(new iam.PolicyStatement({
            actions: ['ssm:SendCommand'],
            resources: [
                // the instance this role can target
                cdk.Arn.format({
                    service: 'ec2',
                    resource: 'instance',
                    resourceName: appInstanceId,
                }, cdk.Stack.of(this)),
                // AWS-managed document — no account ID in the ARN
                `arn:aws:ssm:${cdk.Stack.of(this).region}::document/AWS-RunShellScript`,
            ],
        }));

        // allow checking the status/output of commands it sent
        this.role.addToPolicy(new iam.PolicyStatement({
            actions: [
                'ssm:GetCommandInvocation',
            ],
            resources: ['*'],
        }));
    }
}