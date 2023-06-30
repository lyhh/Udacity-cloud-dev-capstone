import { TodosAccess } from '../dataLayer/todosAccess'
import { AttachmentUtils } from '../fileStorage/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import { TodoUpdate } from '../models/TodoUpdate';

// Implement businessLogic
const logger = createLogger('TodoBusinessLogic')
const todosAccess = new TodosAccess();
const attachmentUtils = new AttachmentUtils();

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info(`Get All Todos for User ${userId}`)
    return await todosAccess.getTodoItems(userId);
}

export async function createTodo(user: string, createReq: CreateTodoRequest): Promise<TodoItem> {
    logger.info(`Create Todo: ${createReq.name}`)
    const newId = uuid.v4()
    return await todosAccess.createTodoItem({
        userId: user, 
        todoId: newId,
        createdAt: new Date().toISOString(),
        name: createReq.name,
        dueDate: createReq.dueDate,
        done: false //,
        // attachmentUrl: attachmentUtils.getAttachmentURL(newId)
    });
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info(`Delete Todo: ${todoId}`)
    return await todosAccess.deleteTodoItem(userId, todoId)
}

export async function updateTodo(userId: string, todoId: string, updateReq: UpdateTodoRequest): Promise<TodoUpdate> {
    logger.info(`Update Todo: ${todoId}`)

    return await todosAccess.updateTodoItem(userId, todoId, {
        name: updateReq.name,
        dueDate: updateReq.dueDate,
        done: updateReq.done
    })
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<string> {
    const attachmentUrl = await attachmentUtils.generateAttachmentURL(todoId)
    todosAccess.saveImgUrl(userId, todoId, attachmentUtils.getAttachmentURL(todoId))
    logger.info(`createAttachmentPresignedUrl: ${attachmentUrl}`)
    return attachmentUrl
}