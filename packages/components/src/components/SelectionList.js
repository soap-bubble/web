import React from 'react';
import {
  range,
} from 'lodash';
import PropTypes from 'prop-types';
import { Nav, NavItem } from 'react-bootstrap';

const SelectionList = ({
  startKey,
  delegate,
  rows,
  onSelect,
}) => (
  <Nav
    bsStyle="pills flex-column"
    stacked
    activeKey={startKey}
    onSelect={onSelect}
  >
    {range(0, rows).map((index) => {
      const {
        key,
        content,
      } = delegate(index);
      return (
        <NavItem eventKey={key}>{content}</NavItem>
      );
    })}
  </Nav>
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
