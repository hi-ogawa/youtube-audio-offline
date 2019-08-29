import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './scss/index.scss';
import configureStore from './configureStore';
import Root from './Root';
import DevTools from './DevTools';
import { update } from './utils';

const Main = async () => {
  update.defineCustomQuery();
  const store = await configureStore();

  ReactDOM.render(
    <Provider store={store}>
      { process.env.NODE_ENV === 'production' || <DevTools /> }
      <Root />
    </Provider>,
    document.getElementById('root'),
  );
}

Main();
