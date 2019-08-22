import React from 'react';
import _ from 'lodash';

import { useActions, useStatePath } from '../stateUtils';
import LoaderButton from './LoaderButton';

export default function TrackList() {
  const trackListMode = useStatePath('trackListMode');
  const tracks = useStatePath('tracks');
  const { setModal, downloadAudioData, queueTrack } = useActions();

  let orderedTracks = _.sortBy(tracks, t => t.title);
  let groupedTracks = _.sortBy(_.toPairs(_.groupBy(orderedTracks, t => t.author)), pair => pair[0]);

  return (
    <div id='track-list-container'>
      { trackListMode === 'FLAT' &&
        <FlatList {...{
          tracks: orderedTracks,
          setModal,
          downloadAudioData,
          queueTrack
        }}/>}
      { trackListMode === 'GROUP' &&
        <GroupedList {...{
          groupedTracks,
          setModal,
          downloadAudioData,
          queueTrack
        }}/>}
    </div>
  );
}

function FlatList({ tracks, setModal, downloadAudioData, queueTrack }) {
  return (
    <div id='flat-list'>
      { tracks.map(track =>
          <div key={track.id} className='list-entry'>
            <div className='list-entry__title' disabled={!track.audioReady}>
              <div>{ track.title }</div>
              <div>{ track.author }</div>
            </div>

            { track.audioReady
              ?
              <div className='list-entry__action' onClick={() => queueTrack(track.id, true)}>
                <i className='material-icons'>play_arrow</i>
              </div>
              :
              <LoaderButton
                className='list-entry__action'
                action={() => downloadAudioData(track.id)}
                icon='get_app' />
            }

            <div className='list-entry__action' onClick={() => setModal('TrackActions')}>
              <i className='material-icons'>more_vert</i>
            </div>
          </div>
      )}
    </div>
  );
}

function GroupedList({ groupedTracks, setModal, downloadAudioData, queueTrack }) {
  return (
    <div id='grouped-list'>
      { groupedTracks.map(([author, tracks]) =>
          <div key={author}>
            <div>{ author }</div>
            <div>
              { tracks.map(track =>
                  <div key={track.id}>
                    <div>{ track.title }</div>

                    { track.audioReady
                      ?
                      <div onClick={() => queueTrack(track.id, true)}>
                        <i className='material-icons'>play_arrow</i>
                      </div>
                      :
                      <LoaderButton
                        action={() => downloadAudioData(track.id)}
                        icon='get_app' />
                    }

                    <div onClick={() => setModal('TrackActions')}>
                      <i className='material-icons'>more_vert</i>
                    </div>
                  </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
