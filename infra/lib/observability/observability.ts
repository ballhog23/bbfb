import * as cdk from 'aws-cdk-lib/core';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface ObservabilityProps {
    syncStateMachine: sfn.IStateMachine;
    natInstanceId: string;
    reverseProxyInstanceId: string;
}

const ONE_GB = 1_000_000_000;

// send an email when usage that costs money goes far above normal.
// these alarms watch usage metrics, so they fire within minutes, not hours like billing alerts.
export class Observability extends Construct {
    constructor(scope: Construct, id: string, props: ObservabilityProps) {
        super(scope, id);

        // subscribe email addresses to this topic in the SNS console, so no address is in the repo
        const topic = new sns.Topic(this, 'AlertTopic', {
            displayName: 'bbfb usage alerts',
            enforceSSL: true,
        });
        new cdk.CfnOutput(this, 'AlertTopicArn', { value: topic.topicArn });
        const action = new cwActions.SnsAction(topic);

        const addAlarm = (alarmId: string, alarmProps: Omit<cloudwatch.AlarmProps, 'evaluationPeriods'>) => {
            const alarm = new cloudwatch.Alarm(this, alarmId, {
                ...alarmProps,
                evaluationPeriods: 1,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            alarm.addAlarmAction(action);
        };

        // the sync chain started more than 2 times in 1 hour. normal is 1 time a week
        addAlarm('SyncChainStartedTooOften', {
            alarmName: 'bbfb-sync-chain-started-too-often',
            metric: props.syncStateMachine.metricStarted({ period: cdk.Duration.hours(1), statistic: 'Sum' }),
            threshold: 2,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        // the sync chain failed or hit its 5 minute limit
        addAlarm('SyncChainFailed', {
            alarmName: 'bbfb-sync-chain-failed',
            metric: new cloudwatch.MathExpression({
                expression: 'failed + timedOut',
                usingMetrics: {
                    failed: props.syncStateMachine.metricFailed({ statistic: 'Sum' }),
                    timedOut: props.syncStateMachine.metricTimedOut({ statistic: 'Sum' }),
                },
                period: cdk.Duration.minutes(5),
            }),
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        });

        // all lambdas in the account ran more than 50 times in 1 hour. normal is about 6 to 18 for one sync run
        addAlarm('LambdaInvokedTooOften', {
            alarmName: 'bbfb-lambda-invoked-too-often',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Invocations',
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
            }),
            threshold: 50,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        // the nat instance sent more than 1 GB in 1 hour. normal is about 0.5 GB a month
        addAlarm('NatTrafficSpike', {
            alarmName: 'bbfb-nat-traffic-spike',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'NetworkOut',
                dimensionsMap: { InstanceId: props.natInstanceId },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
            }),
            threshold: ONE_GB,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        // the reverse proxy sent more than 1 GB in 1 hour. normal is about 0.3 GB a month
        addAlarm('ReverseProxyTrafficSpike', {
            alarmName: 'bbfb-reverse-proxy-traffic-spike',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'NetworkOut',
                dimensionsMap: { InstanceId: props.reverseProxyInstanceId },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
            }),
            threshold: ONE_GB,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });
    }
}
