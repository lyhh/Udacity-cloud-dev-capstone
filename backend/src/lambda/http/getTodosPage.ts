import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getTodosPage as getTodosPage} from '../../businessLogic/todos'
import { getUserId, parseLimitParameter, parseNextKeyParameter} from '../utils';

// Get TODOs page for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Parse query parameters
    var nextKey
    var pagelimit
    try {
      nextKey = parseNextKeyParameter(event)
      pagelimit = parseLimitParameter(event)
    } catch (e) {
      console.log('Failed to parse query parameters: ', e.message)
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid parameters'
        })
      }
    }

    // Get Todo page
    const todos = await getTodosPage(getUserId(event), {
      limit: pagelimit,
      nextPageKey: nextKey,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ items: todos.items, nextKey: todos.nextKey})
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
