import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { TodoPage } from '../models/TodoPage';
import { GetTodosPageRequest } from '../requests/GetTodosPageRequest';

var AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly todoIdIndex = process.env.TODOS_CREATED_AT_INDEX
    ) {}

    async getTodoItems(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all Todo Items')

        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.todoIdIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        const items = result.Items
        logger.info('Todo Items', items)
        return items as TodoItem[]
    }

    async getTodoPage(userId: string, getReq: GetTodosPageRequest): Promise<TodoPage> {
        logger.info('Getting Todo Items by page', getReq)

        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.todoIdIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            Limit: getReq.limit,
            // ScanIndexForward: false,
            ExclusiveStartKey: getReq.nextPageKey
        }).promise()

        const items = result.Items
        logger.info('Todo Items', items)
        return {
            items: (result.Items as TodoItem[]),
            nextKey: encodeNextKey(result.LastEvaluatedKey)
        } as TodoPage
    }

    async createTodoItem(item: TodoItem): Promise<TodoItem> {
        logger.info(`Create an item with name ${item.name}`)

        const result = await this.docClient.put({
            TableName: this.todoTable,
            Item: item
        }).promise()

        logger.info(`Todo created`, result)

        return item
    }

    async updateTodoItem(userId: string, todoId: string, item: TodoUpdate): Promise<TodoUpdate> {
        logger.info(`Update an item with name ${item.name}`)

        const result = await this.docClient.update({
            TableName: this.todoTable,
            Key: {userId, todoId},
            ConditionExpression: 'attribute_exists(todoId)',
            UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: {
              ':name': item.name,
              ':dueDate': item.dueDate,
              ':done': item.done
            },
            ReturnValues: 'ALL_NEW'
        }).promise()

        const updatedTodo = result.Attributes as TodoUpdate
        logger.info('Updated Todo', updatedTodo)
        return updatedTodo
    }

    async deleteTodoItem(userId: string, todoId: string): Promise<void> {
        logger.info(`Delete an item with id ${todoId}`)

        await this.docClient.delete({
            TableName: this.todoTable,
            Key: {userId, todoId}
        }).promise()
    }

    async saveImgUrl(userId: string, todoId: string, url: string): Promise<void> {
        logger.info(`Save attachment URL: id ${todoId} - url=${url}`)

        await this.docClient
          .update({
            TableName: this.todoTable,
            Key: { userId, todoId },
            ConditionExpression: 'attribute_exists(todoId)',
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
              ':attachmentUrl': url
            }
          })
          .promise();
      }
}

  
  /**
   * Encode last evaluated key using
   *
   * @param {Object} lastEvaluatedKey a JS object that represents last evaluated key
   *
   * @return {string} URI encoded last evaluated key
   */
  function encodeNextKey(lastEvaluatedKey) {
    if (!lastEvaluatedKey) {
      return null
    }
    logger.info(`encodeNextKey:`, lastEvaluatedKey)

    return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
  }