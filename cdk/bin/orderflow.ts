#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();
const env = { account: '000000000000', region: 'us-east-1' }; // LocalStack placeholder
new ApiStack(app, 'ApiStack', { env });
