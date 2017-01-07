import React from 'react';
import {
  connect,
} from 'react-redux';
import {
  isUndefined,
} from 'lodash';
const ExampleCell = ({
  data,
}) => {
  const { url, label, img } = data;
  return (
    <div className="cell example-cell">
      <a href={url}>
        <img src={img} />
        <div className='centered'>{label}</div>
      </a>
    </div>
  );
};

const columnsToClassNameMap = {
  [1]: 12,
  [2]: 6,
  [3]: 4,
  [4]: 3,
  [6]: 2,
  [12]: 1,
};

const Grid = ({
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
  const columnClassName = `col-md-${columnsToClassNameMap[columns]}`;
  let r = 0;
  while(!isUndefined(data[r * columns])) {
    const row = [];
    for (let c = 0; c < columns; c++) {
      const d = data[r * columns + c];
      if (!isUndefined(d)) {
        row.push(
          <div className={columnClassName}>
            <Cell
              key={`cell:${r}:${c}`}
              data={d}
            />
          </div>
        );
      } else break;
    }
    elements.push((
      <div key={`row:${r}`} className="row">
        {row}
      </div>
    ));
    r++;
  }
  return (
    <div className="container">
      {elements}
    </div>
  )
}

const Examples = ({
  data,
}) => {
  return (
    <div>
      <Grid columns={3} Cell={ExampleCell} data={data}/>
      <div className="container">
        <div className="centered">
          <br />This is just a small taste of what the current web app can do.  These examples are "view only" because enabling user interaction with hotspots has too many bugs.  Once the game is running better you will be able to play it!
        </div>
      </div>
    </div>
  );
};

function mapStateToProps({ examples }) {
  const { data } = examples;
  return {
    data,
  };
}

export default connect(
  mapStateToProps,
)(Examples);
