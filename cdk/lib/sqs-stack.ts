import { Stack, StackProps, Duration} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export class SqsStack extends Stack {
  readonly ordersQueue: sqs.Queue
  readonly ordersDLQ: sqs.Queue
  readonly apiOrdersQueue: sqs.Queue
  readonly apiOrdersDLQ: sqs.Queue

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // OrdersQueue + DLQ
    this.ordersDLQ = new sqs.Queue(this, 'OrdersDLQ', { retentionPeriod: Duration.days(14) });
    this.ordersQueue = new sqs.Queue(this, 'OrdersQueue', {
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: { queue: this.ordersDLQ, maxReceiveCount: 3 },
    });
    
    // Threshod alarm
    const alarmTopic = new sns.Topic(this, 'AlarmTopic')
    alarmTopic.addSubscription(new subs.EmailSubscription('support@abc.com'))
    const orderDlqAlarm = new cw.Alarm(this, 'OrderDlqAlarm', {
      metric: this.ordersDLQ.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD 
    })

    orderDlqAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic))

    // ApiOrdersQueue + DLQ
    this.apiOrdersDLQ = new sqs.Queue(this, 'ApiOrdersDLQ', { retentionPeriod: Duration.days(14) });
    this.apiOrdersQueue = new sqs.Queue(this, 'ApiOrdersQueue', {
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: { queue: this.apiOrdersDLQ, maxReceiveCount: 3 },
    });
  }
}
