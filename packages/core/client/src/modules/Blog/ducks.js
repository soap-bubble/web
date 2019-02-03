import { get } from 'lodash';
import { createSelector } from 'reselect';
import { createClient } from 'contentful';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import createEpic from '../../utils/createEpic';

export const actionTypes = {
  FETCH: 'BLOG_FETCH',
  FETCH_SUCCESS: 'BLOG_FETCH_SUCCESS',
  FETCH_FAILURE: 'BLOG_FETCH_FAILURE',
}

export const actionCreators = {
  fetch() {
    return {
      type: actionTypes.FETCH,
    };
  },
  fetchSuccess(payload) {
    return {
      type: actionTypes.FETCH_SUCCESS,
      payload,
    };
  },
  fetchFailure(error) {
    return {
      type: actionTypes.FETCH_FAILURE,
      payload: error,
    };
  },
};

createEpic((action$, { getState }) => action$.ofType(actionTypes.FETCH)
  .filter(() => !selectors.blogEntries(getState()).length)
  .switchMap(() => Promise.resolve(createClient({
    space: config.contentfulSpace,
    accessToken: config.contentfulAccess,
    environment: config.contentfulEnv,
  }).getEntries({
    'content_type': 'blogPost',
  })))
  .map(actionCreators.fetchSuccess)
  .catch(actionCreators.fetchFailure),
);

const initialState = {
  entries: [],
};

export function reducer(state = initialState, { type, payload }) {
  switch(type) {
    case actionTypes.FETCH_SUCCESS: {
      return {
        ...state,
        entries: payload,
      };
    }
    case actionTypes.FETCH_FAILURE: {
      return {
        ...state,
        error: payload,
      };
    }
    default:
      return state;
  }
}

const selectRoot = state => state.blog;
const selectBlogEntries = createSelector(
  selectRoot,
  blog => get(blog, 'entries.items', []),
);
const selectBlogAssets = createSelector(
  selectRoot,
  blog => get(blog, 'entries.includes.Asset', []),
);
export const selectors = {
  blogEntries: selectBlogEntries,
  blogAssets: selectBlogAssets,
};
