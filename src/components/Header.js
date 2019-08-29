import React from 'react';

import { useActions, useStatePath } from '../stateUtils';

export default function Header() {
  const trackListMode =  useStatePath('trackListMode');
  const { setModal, _U } = useActions();

  return (
    <div id='header'>
      <div onClick={() => setModal('DownloadList')}>
        <i className='material-icons'>get_app</i>
      </div>
      {
        trackListMode === 'FLAT'
        ?
        <div onClick={() => _U({ trackListMode: { $set: 'GROUP' } })}>
          <i className='material-icons'>sort</i>
        </div>
        :
        <div onClick={() => _U({ trackListMode: { $set: 'FLAT' } })}>
          <i className='material-icons'>sort</i>
        </div>
      }
      <div onClick={() => setModal('TrackImport')}>
        <i className='material-icons'>playlist_add</i>
      </div>
      <div onClick={() => setModal('UserPage')}>
        <i className='material-icons'>person</i>
      </div>
    </div>
  );
}
