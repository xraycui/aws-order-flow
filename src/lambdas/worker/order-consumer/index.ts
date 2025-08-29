

export const handler = async (event: any) => {
  console.log('Consumer received event:', JSON.stringify(event, null, 2));

  for (const record of event.Records || []) {
    try {
      const body = JSON.parse(record.body || '{}');
      console.log(`Processing message from queue:`, body);


      // TODO: Add business logic here
      // e.g., store order in DB, call other services, etc.

    } catch (err) {
      console.error('Error processing record:', err);
      throw err; // Lambda + SQS will retry according to maxReceiveCount
    }
  }

  return { status: 'OK' };
};
