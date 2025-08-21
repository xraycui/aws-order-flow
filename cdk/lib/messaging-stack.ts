import path from 'path'
import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';

export class MessagingStack extends Stack {
  public readonly orderQueue: sqs.Queue;
  public readonly orderTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.orderQueue = new sqs.Queue(this, 'OrderQueue', {
      queueName: 'order-queue',
      visibilityTimeout: Duration.seconds(30)
    })

    const orderConsumerFn = new lambdaNode.NodejsFunction(this, 'OredreConsumerFn', {
      entry: path.join(__dirname, '../../lambdas/orders/index.ts'),
      handler: 'handler'
    })

    this.orderQueue.grantConsumeMessages(orderConsumerFn)
    new lambda.EventSourceMapping(this, 'orderQueueMapping', {
      target: orderConsumerFn,
      eventSourceArn: this.orderQueue.queueArn,
      batchSize: 5
    })
   

    this.orderTopic = new sns.Topic(this, 'OrderTopic', {
      topicName: 'order-topic'
    })

    this.orderTopic.addSubscription(new subs.SqsSubscription(this.orderQueue))

    new CfnOutput(this, 'OrderQueueUrl', { value: this.orderQueue.queueUrl})
    new CfnOutput(this, 'OrderTopicArn', { value: this.orderTopic.topicArn})
  }
}