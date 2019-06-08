import React, { useReducer, useEffect } from 'react';
import axios from 'axios';

const EMPTY_ROLE = 'null';

const initialState = {
  roles: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'fetch roles': {
      return {
        ...state,
        roles: action.payload,
      };
    }
    case 'add role': {
      return {
        ...state,
        role: [...state.role, EMPTY_ROLE],
      };
    }
    case 'set role': {
      const { index, role } = action.payload;
      return {
        ...state,
        role: state.role.map((r, i) => {
          if (i === index) {
            return role;
          }
          return r;
        }),
      };
    }
    case 'delete role': {
      const { index, role } = action.payload;
      return {
        ...state,
        role: state.role.filter((r, i) => {
          if (i === index) {
            return true;
          }
          return false;
        }),
    }
  }
}

const Profile = ({
  id,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    axios.get(`${config.authHost}/user/${id}/roles`).then(({ data }) => {
      dispatch({
        type: 'fetch roles',
        payload: data,
      });
    });
  });

  const {
    roles,
  } = state;

  
};
