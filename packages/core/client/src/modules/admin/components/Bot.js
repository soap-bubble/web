import React from 'react';

const Bot = ({
  letsPlayEnabled,
  token,
  letsPlayUserId,
  letsPlayChannel,
  onSettingsChange,
  onSubmit,
  onTwitchAuth,
}) => {
  function onInput(key, event) {
    onSettingsChange({
      [key]: event.target.value,
    });
  }
  return (
    <form>
      <div className="form-group">
        <label htmlFor="botToken">Bot Login Token</label>
        <input
          type="text"
          className="form-control"
          id="botToken"
          placeholder="token"
          onChange={e => onInput('token', e)}
          value={token}
        />
      </div>
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            aria-label="Bot enabled"
            checked={!!letsPlayEnabled}
            onChange={(e) => {
              onSettingsChange({
                letsPlayEnabled: e.target.checked,
              });
            }}
          />
        Lets Play Enabled
        </label>
      </div>
      <div className="form-group">
        <label htmlFor="botChannel">Lets Play Channel</label>
        <input
          type="text"
          className="form-control"
          id="botChannel"
          placeholder="channel"
          disabled={!letsPlayEnabled}
          onChange={e => onInput('letsPlayChannel', e)}
          value={letsPlayChannel}
        />
      </div>
      <div className="form-group">
        <label htmlFor="botUserId">User ID</label>
        <input
          type="text"
          className="form-control"
          id="botUserId"
          placeholder="id"
          disabled={!letsPlayEnabled}
          onChange={e => onInput('letsPlayUserId', e)}
          value={letsPlayUserId}
        />
      </div>
      <button
        type="button"
        className="btn btn-default"
        onClick={onTwitchAuth}
      >
        Authorize Twitch
      </button>
      <button
        type="submit"
        className="btn btn-default"
        onClick={onSubmit}
      >
        Submit
      </button>
    </form>
  );
};

export default Bot;
