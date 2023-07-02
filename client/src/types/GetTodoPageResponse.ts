import { Todo } from "./Todo"

export interface GetTodosPageResponse {
  items: Todo[]
  nextKey?: string
}
