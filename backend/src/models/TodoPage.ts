import { TodoItem } from "./TodoItem"

export interface TodoPage {
  items: TodoItem[]
  nextKey: string
}
