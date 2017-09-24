import React from 'react';
import { redirect } from 'react-isomorphic-render'
import { createSelector } from 'redux';
import { connect } from 'react-redux';
import * as User from '../../User';
import SelectionList from '../../../components/SelectionList';

function mapStateToProps(state) {
  const delegate = User.selectors.delegate(state);
  const startKey = User.selectors.categories(state) ? User.selectors.categories(state)[0] : '';
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
      redirect(`/user/${selectedSection}`);
    },
  };
}

const SettingsLeftPanel = connect(
  mapStateToProps,
  mapDisptachToProps,
)(SelectionList);

export default SettingsLeftPanel;
