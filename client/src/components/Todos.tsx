import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Item,
  Select,
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, getTodosPage, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'
import { GetTodosPageRequest } from '../types/GetTodoPageRequest'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  pageRequest: GetTodosPageRequest
  pageKeyList: string[]
}

const pageSizeOptions = [
  { key: '5', value: 5, text: '5 items' },
  { key: '10', value: 10, text: '10 items' },
  { key: '15', value: 15, text: '15 items' },
  { key: '20', value: 20, text: '20 items' }
]

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    pageRequest: {
      limit: 5,
      nextKey: ''
    },
    pageKeyList: []
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onNextButtonClick = () => {
    this.state.pageKeyList.push(this.state.pageRequest.nextKey)
    this.setState({
      loadingTodos: true 
    })
  }

  onPrevButtonClick = () => {
    this.state.pageKeyList.pop()
    this.setState({
      loadingTodos: true,
      pageRequest: {
        limit: this.state.pageRequest.limit,
        nextKey: this.state.pageKeyList.at(-1) || ''
      }
    })
  }

  onChangeLimit = (newValue: number) => {
    this.setState({
      loadingTodos: true,
      pageRequest: {
        limit: newValue,
        nextKey: ''
      },
      pageKeyList: []
    })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: '',
        loadingTodos: true,
        pageRequest: {
          ...this.state.pageRequest,
          nextKey: ''
        },
        pageKeyList: []
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId),
        loadingTodos: true,
        pageRequest: {
          ...this.state.pageRequest,
          nextKey: ''
        },
        pageKeyList: []
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async getTodoPage() {
    try {
      const result = await getTodosPage(this.props.auth.getIdToken(), this.state.pageRequest)
      console.log("getTodoPage nextkey", result.nextKey)
      this.setState({
        todos: result.items,
        pageRequest: {
          ...this.state.pageRequest,
          nextKey: result.nextKey ?? ''
        },
        loadingTodos: false 
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  async componentDidMount() {
    await this.getTodoPage()
  }

  async componentDidUpdate(prevProps: any, prevState: TodosState) {
    if (this.state.loadingTodos !== prevState.loadingTodos && this.state.loadingTodos) {
      await this.getTodoPage();
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Udacity TODOs</Header>

        {this.renderCreateTodoInput()}
        {this.renderPagination()}
        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
      </Grid.Row>
    )
  }
  
  renderPagination() {
    return (
      <Grid>
        <Grid.Row>
          <Grid.Column width={8} floated='right' textAlign='right'>
            <Select style={{ marginRight: '10px', marginTop: '10px' }} 
              value={this.state.pageRequest.limit} placeholder='Page size' 
              options={pageSizeOptions}
              onChange={(e, data) => this.onChangeLimit(Number(data.value))}></Select>
            <Button
              fitted icon
              color="teal"
              labelPosition='left'
              onClick={() => this.onPrevButtonClick()}>
              <Icon inverted name="arrow alternate circle left" />
              Prev
            </Button>
            <Button
              fitted icon
              color="teal"
              labelPosition='right'
              onClick={() => this.onNextButtonClick()}>
              Next
              <Icon  inverted name="arrow alternate circle right" />
            </Button> 
          </Grid.Column>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded divided='vertically'>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId} style={
              todo.done 
                ? { background: 'grey' }
                : { background: 'white' }
            }>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                <Item.Header>{todo.name}</Item.Header>
              </Grid.Column>
              <Grid.Column width={3} verticalAlign="middle"floated="left">
                <b>Due date:</b>  {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={2} floated="right" textAlign='right'>
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Grid.Column width={15} floated="right"><Image src={todo.attachmentUrl} size="small" wrapped /></Grid.Column>
                
              )}
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
