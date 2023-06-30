import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    // Implement creating a new TODO item
    const todo = await createTodo(getUserId(event), newTodo)

    return {
      statusCode: 200,
      body: JSON.stringify({ item: todo })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
