import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { persistState } from 'redux-devtools';
import DevTools from './DevTools.js';
import { reducer, initialState } from './stateUtils.js';

const enhancer = compose(
  applyMiddleware(thunk),
  DevTools.instrument(),
  persistState((new URL(window.location.href)).searchParams.get('dev_state_key'))
);

export default () => createStore(reducer, initialState, enhancer);
