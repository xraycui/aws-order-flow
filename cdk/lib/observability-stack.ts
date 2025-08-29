import { Duration, Stack, StackProps, Fn } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubs from 'aws-cdk-lib/aws-sns-subscriptions';

export class ObservabilityStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const alertTopic = new sns.Topic(this, 'AlertTopic')
    alertTopic.addSubscription(new snsSubs.EmailSubscription('alert@gmail.com'))

    const stepFunctionArn = Fn.importValue('OrderStateMachineArn')
    const failedExecutions = new cloudwatch.Metric({
      namespace: 'AWS/States',
      metricName: 'ExecutionsFailed',
      dimensionsMap: { StateMachineArn: stepFunctionArn},
      statistic: 'Sum',
      period: Duration.minutes(1)
    })

    new cloudwatch.Alarm(this, 'StepFunctionFailuresAlarm', {
      metric: failedExecutions,
      threshold: 1,
      evaluationPeriods: 1
    }).addAlarmAction({
      bind: (() => ({alarmActionArn: alertTopic.topicArn}))
    })
  }
}