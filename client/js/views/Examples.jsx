import React from 'react';

const columnsToClassNameMap = {
  [1]: 12,
  [2]: 6.
  [3]: 4,
  [4]: 3
  [6]: 2,
  [12]: 1,
};

const Grid = ({
  rows,
  columns,
  data,
  Cell,
}) => {
  if (
    columns !== 1
    && columns !== 2
    && columns !== 3
    && columns !== 4
    && columns !== 6
    && columns !== 12
  ) {
    throw new Error(`Columns must be either 1, 2, 3, 4, 6 or 12 but was instead ${columns}`);
  }

  const elements = [];
  const columnClassName = `col-${columnsToClassNameMap(columns)}`;
  for (const r = 0; r < rows.length; r++) {
    const row = [];
    for (const c = 0; c < columns.length; c++) {
      const d = data[r * columns.length + c];
      row.push(
        <Cell
          key={`cell:${r}:${c}`}
          className=columnClassName
          {{...data}}
        />
      );
    }
    elements.push((
      <div key={`row:${r}`} className="row">
        {{row}}
      </div>
    ))
  }
  return (
    <div className="container">
      {{elements}}
    </div>
  )
}

const Examples = () => {
  return (
    <div>
      It worked!
    </div>
  );
};

export default Examples;
