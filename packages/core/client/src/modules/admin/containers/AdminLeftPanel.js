import React from 'react';
import cn from 'classnames';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { SelectionList } from '@soapbubble/components';
import styles from './AdminLeftPanel.css';

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
}) => selected => ({
  route,
  key,
  content: (<div className={cn({
    [styles.left]: true,
    [styles.select]: selected === key,
  })}>
    {title}
    <span className="pull-right">
      {'>'}
    </span>
  </div>),
}));

function delegate(index, selected) {
  return rows[index](selected);
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
      dispatch(push(rows.find(row => row().key === selectedSection)().route));
    },
  };
}

const SettingsLeftPanel = connect(
  mapStateToProps,
  mapDisptachToProps,
)(SelectionList);

export default SettingsLeftPanel;
