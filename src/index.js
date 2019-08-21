import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './scss/index.scss';
import configureStore from './configureStore';
import Root from './Root';
import DevTools from './DevTools';

const Main = async () => {
  const store = await configureStore();

  ReactDOM.render(
    <Provider store={store}>
      <DevTools />
      <Root />
    </Provider>,
    document.getElementById('root'),
  );
}

Main();
