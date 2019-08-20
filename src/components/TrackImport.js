import React, { useRef } from 'react';
import { useActions, useLoader } from '../stateUtils';
// import LoaderButton from './LoaderButton';

export default function TrackImport() {
  const { setModal, importTracks } = useActions();
  const [ _importTracks, { loading, error } ] = useLoader(importTracks);
  const inputRef = useRef(null);

  return (
    <div id='track-import-container'>
      <div className='close-modal' onClick={() => setModal(null)}>
        <i className='material-icons'>close</i>
      </div>

      <section>
        <h1>Import Tracks</h1>
        <div>
          <div className='input-button-grp'>
            <input type="text" ref={inputRef} placeholder='Video or Playlist URL' />
            <button
              onClick={() =>
                _importTracks(inputRef.current.value)
                .then(() => inputRef.current.value = '')}
              disabled={loading}
            >
              { error
                ? <i className='material-icons'>error</i>
                : loading
                ? <div className='spinner' />
                : <i className='material-icons'>add</i>
              }
            </button>
          </div>
        </div>
      </section>

      <section>
        <h1>Re-import from Playlist</h1>
        <div>TODO</div>
      </section>
    </div>
  );
}
