import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as subsriptions from 'aws-cdk-lib/aws-sns-subscriptions'


interface SnsStackProps extends StackProps {
  apiOrderQueue: sqs.Queue
}

export class SnsStack extends Stack {
  readonly apiOrderTopic: sns.Topic
  readonly orderTopic: sns.Topic

  constructor(scope: Construct, id: string, props: SnsStackProps) {
    super(scope, id, props)
    
    const { apiOrderQueue } = props

    this.apiOrderTopic = new sns.Topic(this, 'ApiOrdersTopic', {
      displayName: 'API Order Events'
    })

    const sub = new subsriptions.SqsSubscription(apiOrderQueue)
    this.apiOrderTopic.addSubscription(sub)

    this.orderTopic = new sns.Topic(this, 'OrderTopic', {
      displayName: 'Order Events'
    })
  }
}