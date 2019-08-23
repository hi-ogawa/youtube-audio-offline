import React from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import { useActions, useStatePath, selectors } from '../stateUtils';
import { stopProp } from '../utils';
import LoaderButton from './LoaderButton';

export default function TrackList() {
  const trackListMode = useStatePath('trackListMode');
  const tracks = useStatePath('tracks');
  const currentTrack = useSelector(selectors.currentTrack);
  const { setModal, downloadAudioData, queueTrack } = useActions();

  // TODO: cache better
  let orderedTracks = _.sortBy(tracks, t => t.title);
  let groupedTracks = _.sortBy(_.toPairs(_.groupBy(orderedTracks, t => t.author)), pair => pair[0]);

  return (
    <div id='track-list-container'>
      { trackListMode === 'FLAT' &&
        <FlatList {...{
          tracks: orderedTracks,
          currentTrack,
          setModal,
          downloadAudioData,
          queueTrack,
        }}/>}
      { trackListMode === 'GROUP' &&
        <GroupedList {...{
          groupedTracks,
          currentTrack,
          setModal,
          downloadAudioData,
          queueTrack,
        }}/>}
    </div>
  );
}

function FlatList({ tracks, currentTrack, setModal, downloadAudioData, queueTrack }) {
  return (
    <div id='flat-list'>
      { tracks.map(track =>
          <div key={track.id} className='list-entry'>
            <div className='list-entry__title'
              disabled={!track.audioReady}
              onClick={() => track.audioReady && queueTrack(track.id, { play: true, clear: true })}
            >
              <div>{ track.title }</div>
              <div>{ track.author }</div>
            </div>

            { track.audioReady
              ?
              <div
                className='list-entry__action'
                onClick={stopProp(() => queueTrack(track.id, { play: !currentTrack }))}
              >
                <i className='material-icons'>add</i>
              </div>
              :
              <LoaderButton
                className='list-entry__action'
                action={stopProp(() => downloadAudioData(track.id))}
                icon='get_app' />
            }

            <div className='list-entry__action' onClick={stopProp(() => setModal('TrackActions'))}>
              <i className='material-icons'>more_vert</i>
            </div>
          </div>
      )}
    </div>
  );
}

function GroupedList({ groupedTracks, currentTrack, setModal, downloadAudioData, queueTrack }) {
  return (
    <div id='grouped-list'>
      { groupedTracks.map(([author, tracks]) =>
          <div key={author}>
            <div>{ author }</div>
            <div>
              { tracks.map(track =>
                  <div key={track.id}
                    disabled={!track.audioReady}
                    onClick={() => track.audioReady && queueTrack(track.id, { play: true, clear: true })}
                  >
                    <div>{ track.title }</div>

                    { track.audioReady
                      ?
                      <div onClick={stopProp(() => queueTrack(track.id, { play: !currentTrack }))}>
                        <i className='material-icons'>add</i>
                      </div>
                      :
                      <LoaderButton
                        action={stopProp(() => downloadAudioData(track.id))}
                        icon='get_app' />
                    }

                    <div onClick={stopProp(() => setModal('TrackActions'))}>
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
