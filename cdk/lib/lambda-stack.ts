import path from 'path'
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as logs from 'aws-cdk-lib/aws-logs'

interface LambdaStackProps extends StackProps{
  ordersQueue: sqs.Queue
  orderStateMachineArn: string
  apiOrdersQueue: sqs.Queue
  apiOrderTopic: sns.Topic
}

export class LambdaStack extends Stack {
  public readonly healthFn: lambdaNode.NodejsFunction
  public readonly apiOrdersFn: lambdaNode.NodejsFunction;
  public readonly orderFn: lambdaNode.NodejsFunction;
  public readonly orderConsumerFn: lambdaNode.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props)

    const { 
      env, 
      ordersQueue, 
      orderStateMachineArn, 
      apiOrdersQueue, 
      apiOrderTopic 
    } = props
    
    const logRetention = logs.RetentionDays.ONE_WEEK
    this.healthFn = new lambdaNode.NodejsFunction(this, 'HealthFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/health/index.ts'),
      handler: 'handler',
      logRetention
    })

    this.apiOrdersFn = new lambdaNode.NodejsFunction(this, 'ApiOrdersFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/api-orders/index.ts'),
      handler: 'handler',
      logRetention,
      environment: {
        API_ORDERS_TOPIC_ARN: apiOrderTopic.topicArn
      }
    });
    apiOrderTopic.grantPublish(this.apiOrdersFn)

    this.orderFn = new lambdaNode.NodejsFunction(this, 'OrderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/orders/index.ts'),
      handler: 'handler',
      logRetention,
       environment: {
        ORDERS_QUEUE_URL: ordersQueue.queueUrl
      }
    });
    ordersQueue.grantSendMessages(this.orderFn)

    this.orderConsumerFn = new lambdaNode.NodejsFunction(this, 'OrderConsumerFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/order-consumer/index.ts'),
      handler: 'handler',
      logRetention,
      environment: {
        ORDER_WORKFLOW_ARN: orderStateMachineArn
      }
    });

    // Event source mappings
    new lambda.EventSourceMapping(this, 'orderQueueMapping', {
      target: this.orderConsumerFn,
      eventSourceArn: ordersQueue.queueArn
    })

    new lambda.EventSourceMapping(this, 'apiOrderQueueMapping', {
      target: this.orderConsumerFn,
      eventSourceArn: apiOrdersQueue.queueArn
    })

    ordersQueue.grantConsumeMessages(this.orderConsumerFn)
    apiOrdersQueue.grantConsumeMessages(this.orderConsumerFn)
  }
}