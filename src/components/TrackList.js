import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import CN from 'classnames';

import { useActions, useStatePath, selectors } from '../stateUtils';
import { stopProp } from '../utils';

export default function TrackList() {
  const trackListMode = useStatePath('trackListMode');
  const tracks = useStatePath('tracks');
  const currentTrack = useSelector(selectors.currentTrack);
  const { setModal, startDownloadAudio, queueTracks } = useActions();

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
          queueTracks,
        }}/>}
      { trackListMode === 'GROUP' &&
        <GroupedList {...{
          groupedTracks,
          currentTrack,
          setModal,
          startDownloadAudio,
          queueTracks,
        }}/>}
    </div>
  );
}

function FlatList({ tracks, currentTrack, setModal, startDownloadAudio, queueTracks }) {
  return (
    <div id='flat-list'>
      { tracks.map(track =>
          <div key={track.id} className='list-entry'>
            <div className='list-entry__title'
              disabled={!(track.downloadState === 'DONE')}
              onClick={() => track.downloadState === 'DONE' && queueTracks([track.id], { play: true, clear: true })}
            >
              <div>{ track.title }</div>
              <div>{ track.author }</div>
            </div>

            { track.downloadState === 'DONE'
              ?
                <div
                  className='list-entry__action'
                  onClick={stopProp(() => queueTracks([track.id], { play: !currentTrack }))}
                >
                  <i className='material-icons'>add</i>
                </div>
              :
                <div
                  onClick={stopProp(() => track.downloadState !== 'LOADING' && startDownloadAudio(track.id))}
                  className={CN('list-entry__action', { loading: track.downloadState === 'LOADING' })}
                >
                  {/* Spinner is implemented via css ".loading::after" */}
                  { track.downloadState === 'ERROR'
                    ? <i className='material-icons'>error</i>
                    : <i className='material-icons'>get_app</i> }
                </div>
            }

            <div className='list-entry__action' onClick={stopProp(() => setModal('TrackActions', track))}>
              <i className='material-icons'>more_vert</i>
            </div>
          </div>
      )}
    </div>
  );
}

function GroupedList({ groupedTracks, currentTrack, setModal, startDownloadAudio, queueTracks }) {
  return (
    <div id='grouped-list'>
      { groupedTracks.map(([author, tracks]) =>
          <GroupedRow key={author} {...{ author, tracks, currentTrack, setModal, startDownloadAudio, queueTracks }} />)}
    </div>
  );
}

function GroupedRow({ author, tracks, currentTrack, setModal, startDownloadAudio, queueTracks }) {
  const [expand, setExpand] = useState(false);
  const readyTrackIds = tracks.filter(t => t.downloadState === 'DONE').map(t => t.id);
  return (
    <div className={CN({ expand })}>
      <div onClick={() => setExpand(!expand)}>
        <div>{ author }</div>
        <div
          onClick={stopProp(() => readyTrackIds.length > 0 && queueTracks(readyTrackIds, { play: !currentTrack }))}
          className={CN({ disabled: readyTrackIds.length === 0 })}
        >
          <i className='material-icons'>add</i>
        </div>
        <div>
          <i className='material-icons'>{ expand ? 'expand_more' : 'chevron_left' }</i>
        </div>
      </div>
      <div>
        { tracks.map(track =>
            <div key={track.id}
              disabled={!(track.downloadState === 'DONE')}
              onClick={() => track.downloadState === 'DONE' && queueTracks([track.id], { play: true, clear: true })}
            >
              <div>{ track.title }</div>

              { track.downloadState === 'DONE'
                ?
                  <div onClick={stopProp(() => queueTracks([track.id], { play: !currentTrack }))}>
                    <i className='material-icons'>add</i>
                  </div>
                :
                  <div
                    onClick={stopProp(() => track.downloadState !== 'LOADING' && startDownloadAudio(track.id))}
                    className={CN({ loading: track.downloadState === 'LOADING' })}
                  >
                    {/* Spinner is implemented via css ".loading::after" */}
                    { track.downloadState === 'ERROR'
                      ? <i className='material-icons'>error</i>
                      : <i className='material-icons'>get_app</i> }
                  </div>
              }

              <div onClick={stopProp(() => setModal('TrackActions', track))}>
                <i className='material-icons'>more_vert</i>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
