import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

interface DashboardStackProps extends StackProps {
  ordersQueue: sqs.Queue,
  stateMachine: sfn.StateMachine
}

export class DashboardStack extends Stack {
  constructor(scope: Construct, id: string, props: DashboardStackProps) {
    super(scope, id, props)
    const { ordersQueue, stateMachine } = props
    const dashboard = new cw.Dashboard(this, 'OrderFlowDashboard', {
      dashboardName: 'OrderFlwo Dashboard'
    })

    dashboard.addWidgets(
      new cw.GraphWidget({
        title: 'OrderQueueu Message',
        left: [ordersQueue.metricApproximateNumberOfMessagesVisible()]
      }),
      new cw.GraphWidget({
        title: 'Setp Function Executions',
        left: [
          stateMachine.metricSucceeded(),
          stateMachine.metricFailed()
        ]
      })
    )
  }
}