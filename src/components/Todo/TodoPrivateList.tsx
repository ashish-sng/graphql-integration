import React, { Fragment, useState } from "react";
import TodoItem from "./TodoItem";
import { gql, useMutation, useQuery } from "@apollo/client";

import TodoFilters from "./TodoFilters";
import {
  GetMyTodosQuery,
  Todos,
  ClearCompletedMutation,
} from "../../generated/graphql";

export const GET_MY_TODOS = gql`
  query getMyTodos {
    todos(
      where: { is_public: { _eq: false } }
      order_by: { created_at: desc }
    ) {
      id
      title
      is_completed
    }
  }
`;

const CLEAR_COMPLETED = gql`
  mutation clearCompleted {
    delete_todos(
      where: { is_completed: { _eq: true }, is_public: { _eq: false } }
    ) {
      affected_rows
    }
  }
`;

const TodoPrivateList = () => {
  const [filter, setFilter] = useState<string>("all");
  const { loading, error, data } = useQuery<GetMyTodosQuery>(GET_MY_TODOS);
  const [clearTodos] = useMutation<ClearCompletedMutation>(CLEAR_COMPLETED, {
    update(cache, { data }) {
      const existingTodos = cache.readQuery<GetMyTodosQuery>({
        query: GET_MY_TODOS,
      });
      const newTodos = existingTodos!.todos.filter((t) => !t.is_completed);
      cache.writeQuery<GetMyTodosQuery>({
        query: GET_MY_TODOS,
        data: { todos: newTodos },
      });
    },
  });

  const filterResults = (filter: string): void => {
    setFilter(filter);
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error || !data) {
    return <div>Error...</div>;
  }

  let filteredTodos = data.todos;
  if (filter === "active") {
    filteredTodos = data.todos.filter(
      (todo: Pick<Todos, "id" | "title" | "is_completed">) =>
        todo.is_completed !== true
    );
  } else if (filter === "completed") {
    filteredTodos = data.todos.filter(
      (todo: Pick<Todos, "id" | "title" | "is_completed">) =>
        todo.is_completed === true
    );
  }

  const todoList = filteredTodos.map(
    (todo: Pick<Todos, "id" | "title" | "is_completed">, index: number) => (
      <TodoItem key={"item" + index} index={index} todo={todo} />
    )
  );

  return (
    <Fragment>
      <div className="todoListWrapper">
        <ul>{todoList}</ul>
      </div>

      <TodoFilters
        todos={filteredTodos}
        currentFilter={filter}
        filterResultsFn={filterResults}
        clearCompletedFn={clearTodos}
      />
    </Fragment>
  );
};

export default TodoPrivateList;
