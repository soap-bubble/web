import React from 'react';
import {
  range,
} from 'lodash';
import PropTypes from 'prop-types';
import { ListGroup } from 'react-bootstrap';

const SelectionList = ({
  startKey,
  delegate,
  rows,
  onSelect,
}) => (
  <ListGroup
    activeKey={startKey}
    onSelect={onSelect}
  >
    {range(0, rows).map((index) => {
      const {
        key,
        content,
      } = delegate(index);
      return (
        <ListGroup.Item eventKey={key}>{content}</ListGroup.Item>
      );
    })}
  </ListGroup>
);

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
