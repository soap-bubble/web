import React from 'react'
import axios from 'axios'
import { createSelector } from 'reselect'
import { get } from 'lodash'
import createEpic from 'app/utils/createEpic'
import UserList from './containers/UserList'

export { UserList }
export const FETCH_ALL_PENDING = 'USERS_FETCH_ALL_PENDING'
export const FETCH_ALL_SUCCESS = 'USERS_FETCH_ALL_SUCCESS'

function fetchAllUsers() {
  return {
    type: FETCH_ALL_PENDING,
  }
}

const fetchUsersFulfilled = response => ({
  type: FETCH_ALL_SUCCESS,
  payload: response.data,
})

export const actions = {
  fetchAllUsers,
}

// createEpic((action$, store$) => action$
//   .ofType(FETCH_ALL_PENDING)
//   .mergeMap(() =>
//     login.promiseLoggedIn.then(() => axios.get(`${config.authHost}/GetAllUsers`, {
//       headers: {
//         Authorization: `Bearer ${login.selectors.token(store$.value)}`,
//       },
//     })
//       .then(fetchUsersFulfilled))),
// );

export function selectorFactory(root) {
  const data = createSelector(
    root,
    users => get(users, 'data', []),
  )

  const userListComponentFactory = userData => ({
    key: userData.id,
    content: (
      <div>
        <span>{userData.displayName}</span>
        <span className="pull-right">{`(${userData.emails[0].value})`}</span>
      </div>
    ),
  })

  const delegateFactory = users => index =>
    userListComponentFactory(users[index])

  const userListDelegate = createSelector(
    data,
    delegateFactory,
  )

  return {
    data,
    delegateFactory,
    userListDelegate,
  }
}

export const selectors = selectorFactory(state => state.users)

export const defaultState = {
  data: [],
}

export function reducer(state = defaultState, { type, payload }) {
  switch (type) {
    case FETCH_ALL_PENDING: {
      return {
        ...state,
        error: null,
        requestCount: state.requestCount + 1,
      }
    }
    case FETCH_ALL_SUCCESS: {
      return {
        ...state,
        requestCount: state.requestCount - 1,
        data: payload,
      }
    }
    default:
      return state
  }
}
