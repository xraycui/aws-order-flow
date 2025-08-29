import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  const dlqUrl = process.env.DLQ_URL;
  if (!dlqUrl) {
    throw new Error('DLQ_URL environment variable is not defined');
  }

  try {
    const message = {
      errorInfo: event, 
      originalInput: event?.input ?? event?.detail ?? null,
      retryCount: (event?.retryCount || 0) + 1,
      timestamp: new Date().toISOString(),
    };

    await sqsClient.send(new SendMessageCommand({
      QueueUrl: dlqUrl,
      MessageBody: JSON.stringify(message),
    }));

    console.log('Message sent to DLQ:', message);
    return { success: true };
  } catch (err) {
    console.error('Failed to send message to DLQ:', err);
    throw err;
  }
};
