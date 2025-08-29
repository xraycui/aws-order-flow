import { Client } from 'pg'
import { SSMClient, GetParametersCommand} from '@aws-sdk/client-ssm'

const ssm = new SSMClient({region: process.env.AWS_REGION})
const getDbConfig = async () => {
  const res = await ssm.send(new GetParametersCommand({
    Names: [
      process.env.DB_NAME_PARAM!,
      process.env.DB_USER_PARAM!,
      process.env.DB_PASS_PARAM!,
      process.env.DB_HOST_PARAM!,
      process.env.DB_PORT_PARAM!,
    ],
    WithDecryption: true
  }))
  const map = new Map((res.Parameters || []).map(p => [p.Name!, p?.Value!]))
  return {
    database: map.get(process.env.DB_NAME_PARAM!)!,
    user: map.get(process.env.DB_USER_PARAM!)!,
    password: map.get(process.env.DB_PASS_PARAM!),
    host: map.get(process.env.DB_HOST_PARAM!)!,
    port: parseInt(map.get(process.env.DB_PORT_PARAM!)!, 10),
  } 
}

export const handler = async (event: any) => {
  const client = new Client(await getDbConfig())
  client.connect()
  
  try {
    const { orderId, amount } = ((typeof event) === 'string') ? JSON.parse(event) : event
    await client.query(`INSERT INTO orders (id, amout) VALUES ($1, $2) ON CONCLICT (id) DO NOTHING `)
    return { success: true}
  } catch (err: any) {
    throw err
  } finally {
    await client.end()
  }
} 