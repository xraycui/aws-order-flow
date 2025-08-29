import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as iam from 'aws-cdk-lib/aws-iam'


export class IamStack extends Stack {
  readonly roles: {
    apiLamddaRole: iam.Role,
    workerLamdaRole: iam.Role,
    sqlSenderRole: iam.Role,
    stepFnRole: iam.Role
  }
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const commonManaged = [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    ]

    const apiLamddaRole = new iam.Role(this, 'ApiLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: commonManaged
    })
    apiLamddaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish', 'sqs:SendMessage'],
      resources: ['*'],
    }))    

    const workerLamdaRole = new iam.Role(this, 'WorkerlamdaRole', {
      assumedBy: new iam.ServicePrincipal('sns.amazonaws.com'),
      managedPolicies: commonManaged
    })
    workerLamdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
      resources: ['*'],
    }))

    const sqlSenderRole = new iam.Role(this, 'SqlSenderRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: commonManaged,
    })
    sqlSenderRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
      resources: ['*'],
    }))
    
    const stepFnRole = new iam.Role(this, 'StepFnRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    })
    stepFnRole.addToPolicy(new iam.PolicyStatement({ actions: ['lambda:InvokeFunction'], resources: ['*'] }))
    this.roles = { apiLamddaRole, workerLamdaRole, sqlSenderRole, stepFnRole}
  }
}