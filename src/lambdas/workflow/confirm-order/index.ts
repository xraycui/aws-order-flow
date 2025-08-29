import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const snsClient = new SNSClient({region: process.env.AWS_REGION})
export const hander = async (event: any) => {
  const command = new PublishCommand({
    TopicArn: process.env.ORDER_TOPIC_ARN,
    Message: JSON.stringify({ ...event, status: 'confirmed'})
  })

  await snsClient.send(command)
}