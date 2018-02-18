import { connect } from 'react-redux';
import {
  selectors,
} from '../index';
import {
  fetchBotSettings,
  botSettingsInput,
  botSettingConfirm,
} from '../actions';
import Bot from '../components/Bot';

function mapStateToProps(state) {
  const settings = selectors.botInputSettings(state);
  return settings;
}

function mapDisptachToProps(dispatch) {
  dispatch(fetchBotSettings());
  return {
    onSettingsChange(settings) {
      dispatch(botSettingsInput(settings));
    },
    onSubmit(e) {
      e.preventDefault();
      dispatch(botSettingConfirm());
    },
  };
}
const Page = connect(mapStateToProps, mapDisptachToProps)(Bot);

export default Page;
