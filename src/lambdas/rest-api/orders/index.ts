import { APIGatewayProxyHandler} from 'aws-lambda'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const client = new SQSClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event: any) => {
  console.log('Received /orders request:', JSON.stringify(event));

  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  const queueUrl = process.env.ORDERS_QUEUE_URL;
  if (!queueUrl) throw new Error('ORDERS_QUEUE_URL not defined');

  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body),
      MessageAttributes: {
        source: { DataType: 'String', StringValue: 'orders-lambda' },
      },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Order sent to SQS' }),
  };
};
