import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import DevTools from './DevTools.js';
import { reducer, initialState, setupWithStore } from './stateUtils.js';

const enhancer = compose(
  applyMiddleware(thunk),
  DevTools.instrument()
);

export default async () => {
  const store = createStore(reducer, initialState, enhancer);
  await setupWithStore(store);
  return store;
}
