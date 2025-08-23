import path from 'path'
import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sqs from 'aws-cdk-lib/aws-sqs'

interface StepFunctionStackProps extends StackProps {
  orderTopic: sns.Topic
}

export class StepFunctionStack extends Stack {
  readonly stateMachine: sfn.StateMachine
  readonly stepFnDql: sqs.Queue
  constructor(scope: Construct, id: string, props: StepFunctionStackProps) {
    super(scope, id, props)

    const { env, orderTopic } = props

    this.stepFnDql = new sqs.Queue(this, 'OrderWorkflowDLQ', {
      queueName: 'stepfn-dlq',
      retentionPeriod: Duration.days(14)
    })

    const dlqSenderFn = new lambdaNode.NodejsFunction(this, 'DlqSenderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/workflow/dlq-sender/index.ts'),
      handler: 'handler',
      environment: {
        DLQ_URL: this.stepFnDql.queueUrl
      }
    })

    this.stepFnDql.grantSendMessages(dlqSenderFn)

    const validateOrderFn = new lambdaNode.NodejsFunction(this, 'ValidateOrderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/workflow/validate-order/index.ts'),
      handler: 'handler'
    })

    const processOrderFn = new lambdaNode.NodejsFunction(this, 'ProcessOrderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/workflow/process-order/index.ts'),
      handler: 'handler'
    })

    const confirmOrderFn = new lambdaNode.NodejsFunction(this, 'ConfirmOrderFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../lambdas/workflow/confirm-order/index.ts'),
      handler: 'handler',
      environment: {
        ORDER_TOPIC_ARN: orderTopic.topicArn
      }
    })

    orderTopic.grantPublish(confirmOrderFn)

    const sendToDlq = new tasks.LambdaInvoke(this, 'SendToDlq', {
      lambdaFunction: dlqSenderFn,
      payloadResponseOnly: true
    })
    const validateStep = new tasks.LambdaInvoke(this, 'Validate Order', {
      lambdaFunction: validateOrderFn,
      outputPath: '$.payload'
    }).addCatch(sendToDlq, { resultPath: '$.errorInfo'})

    const processStep = new tasks.LambdaInvoke(this, 'Pay Order', {
      lambdaFunction: processOrderFn,
      outputPath: '$.payload'
    }).addCatch(sendToDlq, { resultPath: '$.errorInfo'})

    const confirmStep = new tasks.LambdaInvoke(this, 'Confirm Order', {
      lambdaFunction: confirmOrderFn,
      outputPath: '$.payload'
    }).addCatch(sendToDlq, { resultPath: '$.errorInfo'})

    const definition = validateStep
      .next(processStep)
      .next(confirmStep)
    
    this.stateMachine = new sfn.StateMachine(this, 'OrderWorkFlow', {
      stateMachineType: sfn.StateMachineType.STANDARD,
      definition: definition
    })
  }
}