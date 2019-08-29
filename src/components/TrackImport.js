import React, { useState } from 'react';
import CN from 'classnames';

import { useActions, useStatePath } from '../stateUtils';
import { useLoader, alertError } from '../utils';

export default function TrackImport() {
  const playlists = useStatePath('playlists');
  const [ text, setText ] = useState('');
  const { importTracks, setModal } = useActions();
  const [ _importTracks, { loading, error } ] =
    useLoader(() => importTracks(text).then(() => setModal(null)));
  alertError(error);

  return (
    <div id='track-import-container'>
      <section>
        <h1>Import Tracks</h1>
        <div>
          <div className='input-button-grp'>
            <input type="text" value={text}
              onChange={e => setText(e.target.value)}
              placeholder='Video or Playlist URL'
            />
            <button
              onClick={_importTracks}
              disabled={text.length === 0 || loading}
              className={CN({ loading })}
            >
              {/* Spinner is implemented via css ".loading::after" */}
              { error
                ? <i className='material-icons'>error</i>
                : <i className='material-icons'>add</i>
              }
            </button>
          </div>
        </div>
      </section>

      <section>
        <h1>Re-import from Playlist</h1>
        <div className='playlists'>
          { playlists.map(playlist => <PlaylistRow key={playlist.id} {...{ playlist }}/>) }
        </div>
      </section>
    </div>
  );
}

function PlaylistRow({ playlist }) {
  const { importTracks } = useActions();
  const [ _importTracks, { loading, error } ] =
    useLoader(() => importTracks(`https://www.youtube.com/playlist?list=${playlist.id}`));
  alertError(error)

  return (
    <div key={playlist.id}>
      <div>{ playlist.name }</div>
      <div
        onClick={() => !loading && _importTracks()}
        className={CN({ loading })}
      >
        {/* Spinner is implemented via css ".loading::after" */}
        { error
          ? <i className='material-icons'>error</i>
          : <i className='material-icons'>sync</i> }
      </div>
    </div>
  );
}
