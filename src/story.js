import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import CN from 'classnames';
import _ from 'lodash';

import './scss/index.scss';
import { initialState }  from './stateUtils';
import { LoaderProofOfConcept, LoaderProgressCancellable }  from './components/Loader';
import DownloadList from './components/DownloadList';
import TrackList from './components/TrackList';


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


storiesOf('TrackList', module)
.add('trackListMode: GROUP', () => {
  const state = _.extend(initialState, {
    trackListMode: 'GROUP',
    tracks: [
      {
        id: 1,
        title: 'Vlogs in Russian 24. Dacha in Russia. Дача на севере России.',
        author: 'Russian with Anastasia',
        downloadState: 'DONE'
      },
      {
        id: 2,
        title: 'Vlogs in Russian 24. Dacha in Russia. Дача на севере России.',
        author: 'Russian with Anastasia',
        downloadState: 'DONE'
      },
      {
        id: 3,
        title: 'Vlogs in Russian 24. Dacha in Russia. Дача на севере России.',
        author: 'Russian Progress',
        downloadState: 'DONE'
      },
      {
        id: 4,
        title: 'Vlogs in Russian 24. Dacha in Russia. Дача на севере России.',
        author: 'Russian Progress',
        downloadState: 'DONE'
      },
      {
        id: 5,
        title: 'Vlogs in Russian 24. Dacha in Russia. Дача на севере России.',
        author: 'English Spot',
        downloadState: 'DONE'
      },
      {
        id: 6,
        title: 'Vlogs in Russian 24. Dacha in Russia. Дача на севере России.',
        author: 'English Spot',
        downloadState: 'DONE'
      }
    ],
  });
  return (
    <Provider store={createStore(s => s, state)} >
      <TrackList />
    </Provider>
  );
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
