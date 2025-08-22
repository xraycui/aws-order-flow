import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SqsStack extends cdk.Stack {
  public readonly ordersQueue: sqs.Queue;
  public readonly ordersDLQ: sqs.Queue;
  public readonly apiOrdersQueue: sqs.Queue;
  public readonly apiOrdersDLQ: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // OrdersQueue + DLQ
    this.ordersDLQ = new sqs.Queue(this, 'OrdersDLQ', { retentionPeriod: cdk.Duration.days(14) });
    this.ordersQueue = new sqs.Queue(this, 'OrdersQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: { queue: this.ordersDLQ, maxReceiveCount: 3 },
    });

    // ApiOrdersQueue + DLQ
    this.apiOrdersDLQ = new sqs.Queue(this, 'ApiOrdersDLQ', { retentionPeriod: cdk.Duration.days(14) });
    this.apiOrdersQueue = new sqs.Queue(this, 'ApiOrdersQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: { queue: this.apiOrdersDLQ, maxReceiveCount: 3 },
    });
  }
}
