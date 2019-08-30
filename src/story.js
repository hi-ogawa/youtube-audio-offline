import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import CN from 'classnames';

import './scss/index.scss';
import { LoaderProofOfConcept, LoaderProgressCancellable }  from './components/Loader';
import DownloadList from './components/DownloadList';


storiesOf('@spinner-container mixin', module)
.add('default', () => {
  function C() {
    const [loading, setLoading] = useState(false);
    return (
      <div className='spinner-container-mixin-test'>
        <button className={CN({ loading })} onClick={() => setLoading(!loading)}>
          <span>Submit!</span>
        </button>
      </div>
    );
  }
  return <C />;
});

storiesOf('DownloadList', module)
.add('Default', () => {
  const state = {
    tracks: [
      {
        id: 1,
        title: 'Vlogs in Russian 24. Dacha in Russia. Дача на севере России.',
        author: 'Russian with Anastasia',
        downloadState: 'LOADING'
      }
    ],
    downloads: [
      {
        id: 1,
        progress: {
          loaded: 8.36 * Math.pow(10, 6),
          total: 15.34 * Math.pow(10, 6),
        }
      }
    ],
  };
  return (
    <Provider store={createStore(s => s, state)} >
      <DownloadList />
    </Provider>
  );
});


storiesOf('LoaderProofOfConcept', module)
.add('Progress', () => {
  const props = {
    url: 'https://youtube-dl-service.herokuapp.com/download?video=GkNSbmv6QMQ',
    axiosConfig: {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    },
    onResolve: console.log
  };
  return <LoaderProofOfConcept {...props} />;
}, { notes: 'Should test with slower network (e.g. via Chrome devtool)' })
.add('Error', () => {
  const url = 'https://youtube-dl-service.herokuapp.com/asdfjkl;';
  return <LoaderProofOfConcept url={url} onResolve={console.log} />;
});


storiesOf('LoaderProgressCancellable', module)
.add('Default', () => {
  const props = {
    url: 'https://youtube-dl-service.herokuapp.com/download?video=GkNSbmv6QMQ',
    axiosConfig: {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    },
    onResolve: console.log
  };
  return <LoaderProgressCancellable {...props} />;
});
