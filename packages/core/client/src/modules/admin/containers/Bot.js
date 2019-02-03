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
    onTwitchAuth(e) {
      e.preventDefault();
      document.location = `https://id.twitch.tv/oauth2/authorize?client_id=${config.twitch.clientID}&redirect_uri=${config.twitch.callbackURL}&response_type=code&scope=${encodeURIComponent(config.twitch.scope)}`;
    }
  };
}
const Page = connect(mapStateToProps, mapDisptachToProps)(Bot);

export default Page;
