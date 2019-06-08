import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Nav, NavItem } from 'react-bootstrap';

const SelectionList = ({
  startKey,
  delegate,
  rowData,
  onSelect,
}) => {
  const [selectedKey, setSelected] = useState(null);
  return (
    <Nav
      bsStyle="pills"
      stacked
      activeKey={startKey}
      onSelect={(key) => {
        setSelected(key);
        onSelect(key);
      }}
    >
      {rowData.map((data, index) => {
        const {
          key,
          content,
        } = delegate(data, index, key === selectedKey);
        return (
          <NavItem eventKey={key}>{content}</NavItem>
        );
      })}
    </Nav>
  )
}

SelectionList.propTypes = {
  startKey: PropTypes.string,
  delegate: PropTypes.func.isRequired,
  rowData: PropTypes.arrayOf(PropTypes.any),
  onSelect: PropTypes.func,
};

SelectionList.defaultProps = {
  startKey: '',
  rowData: [],
  onSelect: () => {},
};

export default SelectionList;
