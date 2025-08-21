import { APIGatewayProxyHandler } from "aws-lambda"
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

const snsClient = new SNSClient({
  region: "us-east-1",
  endpoint: process.env.SNS_ENDPOINT || "http://localhost:4566", // LocalStack
})

export const handler: APIGatewayProxyHandler = async (event: any) => {
  try {
    const body = JSON.parse(event?.body || {})
    const command = new PublishCommand({
      TopicArn: process.env.ORDER_TOPIC_ARN,
      Message: JSON.stringify({
        orderID: Date.now(),
        ...body
      })
    })
    snsClient.send(command)
    return { statusCode: 200, body: JSON.stringify({messaage: 'Order published to SNS'})}
  } catch (err: any) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message})}
  }
} 