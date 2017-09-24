import React from 'react';
import { redirect } from 'react-isomorphic-render'
import { createSelector } from 'redux';
import { connect } from 'react-redux';
import * as User from '../../User';
import SelectionList from '../../../components/SelectionList';

function mapStateToProps(state, {
  activeKey: startKey,
}) {
  const delegate = User.selectors.delegate(state);
  const rowData = User.selectors.rowData(state);
  return {
    delegate,
    startKey,
    rowData,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    onSelect(selectedSection) {
      dispatch(redirect(`/user/${selectedSection}`));
    },
  };
}

const SettingsLeftPanel = connect(
  mapStateToProps,
  mapDisptachToProps,
)(SelectionList);

export default SettingsLeftPanel;
