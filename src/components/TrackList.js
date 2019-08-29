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
  const { setModal, startDownloadAudio, queueTrack } = useActions();

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
          startDownloadAudio,
          queueTrack,
        }}/>}
      { trackListMode === 'GROUP' &&
        <GroupedList {...{
          groupedTracks,
          currentTrack,
          setModal,
          startDownloadAudio,
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
              disabled={!(track.downloadState === 'DONE')}
              onClick={() => track.downloadState === 'DONE' && queueTrack(track.id, { play: true, clear: true })}
            >
              <div>{ track.title }</div>
              <div>{ track.author }</div>
            </div>

            { track.downloadState === 'DONE'
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

            <div className='list-entry__action' onClick={stopProp(() => setModal('TrackActions', track))}>
              <i className='material-icons'>more_vert</i>
            </div>
          </div>
      )}
    </div>
  );
}

function GroupedList({ groupedTracks, currentTrack, setModal, startDownloadAudio, queueTrack }) {
  return (
    <div id='grouped-list'>
      { groupedTracks.map(([author, tracks]) =>
          <div key={author}>
            <div>{ author }</div>
            <div>
              { tracks.map(track =>
                  <div key={track.id}
                    disabled={!(track.downloadState === 'DONE')}
                    onClick={() => track.downloadState === 'DONE' && queueTrack(track.id, { play: true, clear: true })}
                  >
                    <div>{ track.title }</div>

                    { track.downloadState === 'DONE'
                      ?
                      <div onClick={stopProp(() => queueTrack(track.id, { play: !currentTrack }))}>
                        <i className='material-icons'>add</i>
                      </div>
                      :
                      <div onClick={stopProp(() => track.downloadState === 'LOADING' || startDownloadAudio(track.id))}>
                        { track.downloadState === 'LOADING'
                          ? <div className='spinner' />
                          : track.downloadState === 'ERROR'
                            ? <i className='material-icons'>error</i>
                            : <i className='material-icons'>get_app</i>
                        }
                      </div>
                    }

                    <div onClick={stopProp(() => setModal('TrackActions', track))}>
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
