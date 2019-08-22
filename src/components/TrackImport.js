import React, { useState } from 'react';

import { useActions, useLoader, useStatePath } from '../stateUtils';
import LoaderButton from './LoaderButton';

export default function TrackImport() {
  const playlists = useStatePath('playlists');
  const { importTracks } = useActions();
  const [ _importTracks, { loading, error } ] = useLoader(importTracks);
  const [ text, setText ] = useState('');

  return (
    <div id='track-import-container'>
      <section>
        <h1>Import Tracks</h1>
        <div>
          <div className='input-button-grp'>
            <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder='Video or Playlist URL' />
            <button
              onClick={() =>
                _importTracks(text)
                .then(() => setText(''))}
              disabled={text.length === 0 || loading}
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
        <div className='playlists'>
          { playlists.map(playlist =>
              <div key={playlist.id}>
                <div>{ playlist.name }</div>
                <LoaderButton
                  action={() => importTracks(`https://www.youtube.com/playlist?list=${playlist.id}`)}
                  icon='sync' />
              </div>
          )}
        </div>
      </section>
    </div>
  );
}
