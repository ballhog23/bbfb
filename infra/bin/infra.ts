#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { BBFBInfraStack } from '../lib/infra-stack';

const app = new cdk.App();
new BBFBInfraStack(app, 'BBFBInfraStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
