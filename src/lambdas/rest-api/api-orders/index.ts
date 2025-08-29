import { APIGatewayProxyHandler} from 'aws-lambda'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const client = new SNSClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event: any) => {
  console.log('Received /api-orders request:', JSON.stringify(event));

  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  const topicArn = process.env.API_ORDERS_TOPIC_ARN;
  if (!topicArn) throw new Error('API_ORDERS_TOPIC_ARN not defined');

  await client.send(
    new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(body),
      MessageAttributes: {
        source: { DataType: 'String', StringValue: 'api-orders-lambda' },
      },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Order published to SNS' }),
  };
};
