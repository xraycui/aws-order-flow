import * as path from 'path'
import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigw from 'aws-cdk-lib/aws-apigateway'

interface IApiStackProps extends StackProps {
  healthLambda: lambdaNode.NodejsFunction
  apiOrderLambda: lambdaNode.NodejsFunction
  orderLambda: lambdaNode.NodejsFunction
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: IApiStackProps ) {
    super(scope, id, props)

    const { healthLambda, apiOrderLambda, orderLambda } = props;

    const api = new apigw.RestApi(this, "OrderRestApi", {
      restApiName: 'Order Service',
      deployOptions: { stageName: 'dev'}
    })
    
    api.root.addResource('health').addMethod('GET', new apigw.LambdaIntegration(healthLambda))
    api.root.addResource('orders').addMethod('POST', new apigw.LambdaIntegration(orderLambda))
    api.root.addResource('api-orders').addMethod('POST', new apigw.LambdaIntegration(apiOrderLambda))
  }
}