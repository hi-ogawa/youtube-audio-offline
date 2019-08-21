import React from 'react';
import gql from 'graphql-tag';
import { sprintf } from 'sprintf-js';

import { useGQL, useActions } from '../stateUtils';

const Q1 = gql`{
  player {
    currentIndex, status, currentTime
  }
  queuedTracks {
    id, title, author
  }
}`;

const formatTime = (_sec) => {
  const sec = _sec || 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return sprintf('%d:%02d', m, s);
}

export default function Player() {
  const { player: { status, currentTime, currentIndex }, queuedTracks } = useGQL(Q1);
  const { setModal, unpause, pause } = useActions();
  const currentTrack = queuedTracks[currentIndex];

  return (
    <div id='player'>
      <div>
        {
          currentTrack &&
          <>
            <div>{ currentTrack.title }</div>
            <div>{ currentTrack.author }</div>
          </>
        }
      </div>
      <div>
        { formatTime(currentTime) }
      </div>
      <div
        onClick={() =>
          currentTrack && (
            status === 'PLAYING'
            ? pause()
            : unpause()
          )
        }
        disabled={!currentTrack}
      >
        <i className='material-icons'>
          { status === 'PLAYING' && 'pause' }
          { status === 'STOPPED' && 'play_arrow' }
        </i>
      </div>
      <div onClick={() => setModal('PlayQueue')}>
        <i className='material-icons'>list</i>
      </div>
    </div>
  );
}
