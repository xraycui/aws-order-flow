#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { MessagingStack } from '../lib/messaging-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();
const env = { account: '000000000000', region: 'us-east-1' }; // LocalStack placeholder

const messagingStack = new MessagingStack(app, 'MessagingStack')
new ApiStack(app, 'ApiStack', { 
  env,
  orderTopic: messagingStack.orderTopic
});
