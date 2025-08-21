import * as path from 'path'
import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as sns from 'aws-cdk-lib/aws-sns'

interface IApiStackProps extends StackProps {
  orderTopic: sns.ITopic
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: IApiStackProps ) {
    super(scope, id, props)
    const { orderTopic } = props;

    const healthFn = new lambda.Function(this, 'HealthFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/health')),
      timeout: Duration.seconds(5)
    })

    const orderFn = new lambdaNode.NodejsFunction(this, "OrderFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/orders/index.ts'),
      handler: 'handler',
      timeout: Duration.seconds(5)
    })

    const apiOrderFn = new lambdaNode.NodejsFunction(this, "ApiOrderFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/api-order/index.ts'),
      handler: 'handler',
      timeout: Duration.seconds(5)
    })

    orderTopic.grantPublish(apiOrderFn)
    apiOrderFn.addEnvironment("ORDER_TOPIC_ARN", props.orderTopic.topicArn);
    apiOrderFn.addEnvironment("SNS_ENDPOINT", "http://localhost:4566");

    const api = new apigw.RestApi(this, "OrderApi", {
      restApiName: 'Order Service',
      deployOptions: { stageName: 'dev'}
    })
    
    api.root.addResource('health').addMethod('GET', new apigw.LambdaIntegration(healthFn))
    api.root.addResource('orders').addMethod('POST', new apigw.LambdaIntegration(orderFn))
    api.root.addResource('api-orders').addMethod('POST', new apigw.LambdaIntegration(apiOrderFn))
  }
}