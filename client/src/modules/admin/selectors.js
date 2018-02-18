import React from 'react';
import { createSelector } from 'reselect';
import { get, values } from 'lodash';

export default function (root) {
  const botSelector = createSelector(
    root,
    state => state.bot,
  );

  const botInputSettings = createSelector(
    botSelector,
    bot => bot.input,
  );

  const botCurrentSettings = createSelector(
    botSelector,
    bot => bot.current,
  );

  return {
    bot: botSelector,
    botInputSettings,
    botCurrentSettings,
  };
}
