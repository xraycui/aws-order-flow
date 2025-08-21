import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as path from 'path'

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps ) {
    super(scope, id, props)
    const healthFn = new lambda.Function(this, 'HealthFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/health')),
      timeout: Duration.seconds(5)
    })

    const orderFn = new lambdaNode.NodejsFunction(this, "OrderFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/order/index.ts'),
      handler: 'handler',
      timeout: Duration.seconds(5)
    })
    const api = new apigw.RestApi(this, "OrderApi", {
      restApiName: 'Order Service',
      deployOptions: { stageName: 'dev'}
    })
    
    api.root.addResource('health').addMethod('GET', new apigw.LambdaIntegration(healthFn))
    api.root.addResource('orders').addMethod('POST', new apigw.LambdaIntegration(orderFn))
  }
}