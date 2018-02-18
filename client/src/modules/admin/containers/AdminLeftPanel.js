import React from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { SelectionList } from '@soapbubble/components';

const rows = [{
  key: 'users',
  title: 'Users',
  route: '/admin/users',
}, {
  key: 'bot',
  title: 'Bot',
  route: '/admin/bot',
}].map(({
  key,
  title,
  route,
}) => ({
  route,
  key,
  content: (<div>
    {title}
    <span className="pull-right">
      {'>'}
    </span>
  </div>),
}));

function delegate(index) {
  return rows[index];
}

function mapStateToProps() {
  return {
    rows: rows.length,
    delegate,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    onSelect(selectedSection) {
      dispatch(push(rows.find(row => row.key === selectedSection).route));
    },
  };
}

const SettingsLeftPanel = connect(
  mapStateToProps,
  mapDisptachToProps,
)(SelectionList);

export default SettingsLeftPanel;
