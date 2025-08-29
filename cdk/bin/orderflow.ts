#!/usr/bin/env ts-node
import dotenv from 'dotenv'
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import { SqsStack } from '../lib/sqs-stack';
import { LambdaStack } from '../lib/lambda-stack'
import { SnsStack } from '../lib/sns-stack';
import { ApiStack } from '../lib/api-stack';
import { StepFunctionStack } from '../lib/stepfunction-stack';
import { DashboardStack } from '../lib/dashboard-stack';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ObservabilityStack } from '../lib/observability-stack';
import { AuthStack } from '../lib/auth-stack';

dotenv.config()
const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',

};
const useLocal = process.env.LOCALSTACK === 'true';

// VPC
const vpcStack = new VpcStack(app, 'VpcStack', { env, useLocal })

// Database
const dbStack = new DatabaseStack(app, 'DatabaseStack', { env, vpc: vpcStack.vpc , useLocal })

// Queue
const sqsStack = new SqsStack(app, 'SqsStack', { env })

// Topic
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

const authStack = new AuthStack(app, 'AuthStack', { env });

// Dashboard
const dashboardStack = new DashboardStack(app, 'DashboardStack', {
  env,
  ordersQueue: sqsStack.ordersQueue,
  stateMachine: sfnStack.stateMachine
})

// Cloudwatch
const observabilityStack = new ObservabilityStack(app, 'ObservabilityStack', { env })

observabilityStack.addDependency(sfnStack)


