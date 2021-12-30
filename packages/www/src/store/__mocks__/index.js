import configureMockStore from 'redux-mock-store';
import { createEpicMiddleware } from 'redux-observable';
import { epics } from 'utils/createEpic';

const epicMiddleware = createEpicMiddleware(epics());

module.exports = configureMockStore([epicMiddleware]);

exports.prime = function prime(moreEpics) {
  epicMiddleware.replaceEpic([...epics(), ...moreEpics]);
};

exports.reset = function reset() {
  // epicMiddleware.replaceEpic(epics());
};
