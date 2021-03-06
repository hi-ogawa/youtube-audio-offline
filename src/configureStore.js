import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import DevTools from './DevTools.js';
import { reducer, initialState, initializeStateUtils } from './stateUtils.js';

const enhancer =
  process.env.NODE_ENV === 'production'
  ? applyMiddleware(thunk)
  : compose(applyMiddleware(thunk), DevTools.instrument());

export default async () => {
  const store = createStore(reducer, initialState, enhancer);
  await initializeStateUtils(store);
  return store;
}
