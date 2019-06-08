import React, { useState } from 'react';
import {
  range,
} from 'lodash';
import PropTypes from 'prop-types';
import { ListGroup } from 'react-bootstrap';

require('react-dom');
window.React2 = require('react');
console.log('same react', window.React1 === window.React2);

const SelectionList = ({
  startKey,
  delegate,
  rows,
  onSelect,
}) => {
  const [selectedKey, setSelected] = useState(startKey);
  return (
    <ListGroup
      activeKey={startKey}
      onSelect={(key) => {
        setSelected(key);
        onSelect(key);
      }}
    >
      {range(0, rows).map((index) => {
        const {
          key,
          content,
        } = delegate(index, selectedKey);
        return (
          <ListGroup.Item eventKey={key}>{content}</ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}

SelectionList.propTypes = {
  startKey: PropTypes.string,
  delegate: PropTypes.func.isRequired,
  rows: PropTypes.number,
  onSelect: PropTypes.func,
};

SelectionList.defaultProps = {
  startKey: '',
  rows: 0,
  onSelect: () => {},
};

export default SelectionList;
