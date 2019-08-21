import React from 'react';

import Player from './components/Player';
import TrackList from './components/TrackList';
import Modal from './components/Modal';
import Header from './components/Header';

export default function Root() {
  return <>
    <Modal />
    <Header />
    <TrackList />
    <Player />
  </>
}
