#!/usr/bin/env ts-node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { SqsStack } from '../lib/sqs-stack';
import { LambdaStack } from '../lib/lambda-stack'
import { SnsStack } from '../lib/sns-stack';
import { ApiStack } from '../lib/api-stack';
import { StepFunctionStack } from '../lib/stepfunction-stack';
import { DashboardStack } from '../lib/dashboard-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Queue
const sqsStack = new SqsStack(app, 'SqsStack', { env })

// Topic 1: SNS->SQS subscription for api-orders
// Topic 2: 
const snsStack = new SnsStack(app, 'SnsStack', { 
  env, 
  apiOrderQueue: sqsStack.apiOrdersQueue 
})

// Workflow (with DLQ +mDLA consumer
const sfnStack = new StepFunctionStack(app, 'SfnStack', {
  env, 
  orderTopic: snsStack.orderTopic
})

// Create lambdas
// orders -> SQS, api-orders -> SNS, consumer -> SFN
const lambdaStack = new LambdaStack(app, 'LambdaStack', { 
  env,
  ordersQueue: sqsStack.ordersQueue,
  orderStateMachineArn: sfnStack.stateMachine.stateMachineArn,
  apiOrdersQueue: sqsStack.apiOrdersQueue,
  apiOrderTopic: snsStack.apiOrderTopic
})

// API gateway
const apiStack = new ApiStack(app, 'ApiStack', { 
  env, 
  healthLambda: lambdaStack.healthFn,
  apiOrderLambda: lambdaStack.apiOrdersFn,
  orderLambda: lambdaStack.orderFn
})

// Cloud Watch
const dashboardStack = new DashboardStack(app, 'DashboardStack', {
  env,
  ordersQueue: sqsStack.ordersQueue,
  stateMachine: sfnStack.stateMachine
})

// Add dependencies
snsStack.addDependency(sqsStack)
sfnStack.addDependency(snsStack)
lambdaStack.addDependency(sqsStack)
lambdaStack.addDependency(snsStack)
apiStack.addDependency(lambdaStack)
apiStack.addDependency(snsStack)
dashboardStack.addDependency(sqsStack)
dashboardStack.addDependency(sfnStack)

