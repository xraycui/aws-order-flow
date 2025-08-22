import { Stack, StackProps, Duration} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SqsStack extends Stack {
  readonly ordersQueue: sqs.Queue
  readonly ordersDLQ: sqs.Queue
  readonly apiOrdersQueue: sqs.Queue
  readonly apiOrdersDLQ: sqs.Queue
  readonly permanentFailQueue: sqs.Queue

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // OrdersQueue + DLQ
    this.ordersDLQ = new sqs.Queue(this, 'OrdersDLQ', { retentionPeriod: Duration.days(14) });
    this.ordersQueue = new sqs.Queue(this, 'OrdersQueue', {
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: { queue: this.ordersDLQ, maxReceiveCount: 3 },
    });

    // ApiOrdersQueue + DLQ
    this.apiOrdersDLQ = new sqs.Queue(this, 'ApiOrdersDLQ', { retentionPeriod: Duration.days(14) });
    this.apiOrdersQueue = new sqs.Queue(this, 'ApiOrdersQueue', {
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: { queue: this.apiOrdersDLQ, maxReceiveCount: 3 },
    });

    // Permanent Fail Queue (messages that exceeded MAX_RETRIES in DLQ consumer)
    this.permanentFailQueue = new sqs.Queue(this, 'PermanentFailQueue', {
      retentionPeriod: Duration.days(30)
    })
  }
}
