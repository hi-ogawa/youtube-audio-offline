import React from 'react';
import { useSelector } from 'react-redux';
import CN from 'classnames';

import { useActions, useStatePath, selectors } from '../stateUtils';

export default function PlayQueue() {
  const status = useStatePath('player.status');
  const currentIndex = useStatePath('player.currentIndex');
  const queuedTracks = useSelector(selectors.queuedTracks);
  const currentTrack = useSelector(selectors.currentTrack);

  const { unpause, pause, setCurrentTrackFromQueueByIndex,
          removeTrackFromQueueByIndex, moveCurrentTrack } = useActions();

  return (
    <div id='play-queue-container'>
      <div>Playback Queue</div>
      <div>
        { queuedTracks.map((track, index) =>
            <div
              key={`${index}-${track.id}`}
              className={CN({ current: index === currentIndex})}
              onClick={() => setCurrentTrackFromQueueByIndex(index)}
            >
              <div>
                <div>{ track.title }</div>
                <div>{ track.author }</div>
              </div>
              <div onClick={e => { e.stopPropagation(); removeTrackFromQueueByIndex(index); }}>
                <i className='material-icons'>close</i>
              </div>
            </div>
        )}
      </div>

      <div>
        <div disabled>
          {/* repeat_one */}
          <i className='material-icons'>repeat</i>
        </div>
        <div
          onClick={() => moveCurrentTrack(-1)}
          disabled={queuedTracks.length <= 1}
        >
          <i className='material-icons'>skip_previous</i>
        </div>
        <div
          onClick={() => status === 'PLAYING' ? pause() : unpause()}
          disabled={!currentTrack}
        >
          <i className='material-icons'>
            { status === 'PLAYING' ? 'pause' : 'play_arrow' }
          </i>
        </div>
        <div
          onClick={() => moveCurrentTrack(+1)}
          disabled={queuedTracks.length <= 1}
        >
          <i className='material-icons'>skip_next</i>
        </div>
        <div disabled>
          <i className='material-icons'>shuffle</i>
        </div>
      </div>
    </div>
  );
}
