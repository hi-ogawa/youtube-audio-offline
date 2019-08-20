import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './scss/index.scss';
import configureStore from './configureStore.js';
import Root from './Root';
import DevTools from './DevTools';

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <DevTools />
    <Root />
  </Provider>,
  document.getElementById('root'),
);
