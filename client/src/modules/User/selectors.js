import React from 'react';
import { createSelector } from 'reselect';
import { get, values } from 'lodash';

export default function (root) {
  const isLoading = createSelector(
    root,
    user => get(user, 'requestCount', 0) > 1,
  );

  const settings = createSelector(
    root,
    user => get(user, 'settings', {}),
  );

  const categories = createSelector(
    settings,
    s => Object.keys(s),
  );

  const titles = createSelector(
    settings,
    categories,
    (s, c) => c.map(key => s[key].title),
  );

  const rows = createSelector(
    settings,
    s => values(s),
  );

  const rowData = createSelector(
    rows,
    _rows => _rows.map(row => row.data),
  );

  const delegate = createSelector(
    categories,
    titles,
    (_categories, _titles) => (row, index) => {
      const title = _titles[index];
      const key = _categories[index];
      const content = (
        <div>
          {title}
          <span className="pull-right">
            {'>'}
          </span>
        </div>
      );
      return {
        key,
        content,
      };
    },
  );

  return {
    isLoading,
    settings,
    categories,
    titles,
    rows,
    rowData,
    delegate,
  };
}
