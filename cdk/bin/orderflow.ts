#!/usr/bin/env ts-node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { SqsStack } from '../lib/sqs-stack';
import { LambdaStack } from '../lib/lambda-stack'
import { SnsStack } from '../lib/sns-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Create SQS stack first
const sqsStack = new SqsStack(app, 'SqsStack', { env })

// Create SNS stack
const snsStack = new SnsStack(app, 'SnsStack', { 
  env, 
  apiOrderQueue: sqsStack.apiOrdersQueue 
})

// Create lambdas stack
const lambdaStack = new LambdaStack(app, 'LambdaStack', { 
  env,
  ordersQueue: sqsStack.ordersQueue,
  apiOrdersQueue: sqsStack.apiOrdersQueue,
  apiOrderTopic: snsStack.apiOrderTopic
})

// Create API stack
const apiStack = new ApiStack(app, 'ApiStack', { 
  env, 
  healthLambda: lambdaStack.healthFn,
  apiOrderLambda: lambdaStack.apiOrdersFn,
  orderLambda: lambdaStack.orderFn
})

// Add dependencies
snsStack.addDependency(sqsStack)
lambdaStack.addDependency(sqsStack)
lambdaStack.addDependency(snsStack)
apiStack.addDependency(lambdaStack)
apiStack.addDependency(snsStack)

