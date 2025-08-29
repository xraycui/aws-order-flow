import path from 'path'
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as iam from 'aws-cdk-lib/aws-iam'

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
  public readonly sqlSenderFn: lambdaNode.NodejsFunction;

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
    const managedPolicies =  [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')]

    const apiLamddaRole = new iam.Role(this, 'ApiLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies
    })
    apiLamddaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish', 'sqs:SendMessage'],
      resources: ['*']
    }))

    this.healthFn = new lambdaNode.NodejsFunction(this, 'HealthFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../src/lambdas/rest-api/health/index.ts'),
      handler: 'handler',
      logRetention,
    })

    this.apiOrdersFn = new lambdaNode.NodejsFunction(this, 'ApiOrdersFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../src/lambdas/rest-api/api-orders/index.ts'),
      handler: 'handler',
      logRetention,
      role: apiLamddaRole,
      environment: {
        API_ORDERS_TOPIC_ARN: apiOrderTopic.topicArn
      }
    });
    apiOrderTopic.grantPublish(this.apiOrdersFn)

    this.orderFn = new lambdaNode.NodejsFunction(this, 'OrderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../src/lambdas/rest-api/orders/index.ts'),
      handler: 'handler',
      logRetention,
      role: apiLamddaRole,
       environment: {
        ORDERS_QUEUE_URL: ordersQueue.queueUrl
      }
    });
    ordersQueue.grantSendMessages(this.orderFn)

    const workerLamdaRole = new iam.Role(this, 'WorkerLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies
    })
    workerLamdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
      resources: ['*']
    }))

    this.orderConsumerFn = new lambdaNode.NodejsFunction(this, 'OrderConsumerFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../src/lambdas/worker/order-consumer/index.ts'),
      handler: 'handler',
      logRetention,
      role: workerLamdaRole,
      environment: {
        ORDER_WORKFLOW_ARN: orderStateMachineArn
      }
    });

    const sqlSenderRole = new iam.Role(this, `SqlSenderRole`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies,
    });
    sqlSenderRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
      resources: ['*'],
    }));
    this.sqlSenderFn = new lambdaNode.NodejsFunction(this, 'SqlSenderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../src/lambdas/worker/sql-sender/index.ts'),     
      role: sqlSenderRole,
      logRetention,
    })

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