import { APIGatewayProxyHandler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
})

interface IOrder {
  orderId: string
  item: string
  quantity: number
}
const QUEUE_URL = "http://localhost:4566/000000000000/OrderQueue";
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if(!event.body) throw new Error('Missing body')
    
    const order: IOrder = JSON.parse(event.body)
    if (!order.orderId || !order.item || !order.quantity) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid order" }) };
    }
    
    sqsClient.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(order)
    }))
    return { statusCode: 200, body: JSON.stringify({ messeage: 'Order Received'})} 
  } catch (err: any) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message})}
  }
}