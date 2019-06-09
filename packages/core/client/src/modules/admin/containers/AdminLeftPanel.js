import React from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';
import { SelectionList } from '@soapbubble/components';
import styles from './AdminLeftPanel.css';

const rows = [{
  key: 'users',
  title: 'Users',
  path: '/admin/users',
  route: 'route/ADMIN_USERS',
}, {
  key: 'bot',
  title: 'Bot',
  path: '/admin/bot',
  route: 'route/ADMIN_BOT',
}].map(({
  key,
  title,
  path,
  route,
}) => selected => ({
  path,
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

function mapDispatchToProps(dispatch) {
  return {
    onSelect(selectedSection) {
      dispatch({ type: rows.find(row => row().key === selectedSection)().route });
    },
  };
}

const SettingsLeftPanel = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SelectionList);

export default SettingsLeftPanel;
