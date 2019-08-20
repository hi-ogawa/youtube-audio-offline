import React from 'react';
import Player from './components/Player';
import TrackList from './components/TrackList';
import Modal from './components/Modal';
import { useActions } from './stateUtils';

function Header() {
  const { setModal } = useActions();

  return (
    <div id='header'>
      <div className='sort'>
        <i className='material-icons'>sort_by_alpha</i>
      </div>
      <div className='import' onClick={() => setModal('TrackImport')} >
        <i className='material-icons'>playlist_add</i>
      </div>
    </div>
  );
}

export default function Root() {
  return <>
    <Modal />
    <Header />
    <TrackList />
    <Player />
  </>
}
