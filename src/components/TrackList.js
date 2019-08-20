import React from 'react';
import gql from 'graphql-tag';
import { useActions, useGQL } from '../stateUtils';
import LoaderButton from './LoaderButton';

const Q = gql`
{
  tracks {
    id, title, author, audioReady
  }
}
`;

export default function TrackList() {
  const { tracks } = useGQL(Q);
  const { downloadAudioData, clearAudioData, queueAndListenTrack } = useActions();

  return (
    <div id='track-list' className='track-list'>
      { tracks.map(track =>
          <div key={track.id} className='track-list__entry'>
            <div className='track-list__entry__title' disabled={!track.audioReady}>
              <div>{ track.title }</div>
              <div>{ track.author }</div>
            </div>

            { track.audioReady
              ?
              <div className='track-list__entry__ctl' onClick={() => queueAndListenTrack(track.id)}>
                <i className='material-icons'>play_arrow</i>
              </div>
              :
              <LoaderButton
                className='track-list__entry__ctl'
                action={() => downloadAudioData(track.id)}
                icon='get_app' />
            }

            {/* TODO: Menu should have 1) Delete track, 2) Clear audio data */}
            <div className='track-list__entry__ctl'>
              <i className='material-icons'>more_vert</i>
            </div>
          </div>
      )}
    </div>
  );
}
