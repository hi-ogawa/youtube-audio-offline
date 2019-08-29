import React from 'react';
import { useSelector } from 'react-redux';

import { useActions, useStatePath, selectors } from '../stateUtils';
import { formatTime, stopProp } from '../utils';

export default function Player() {
  const status = useStatePath('player.status');
  const currentTrack = useSelector(selectors.currentTrack);
  const { setModal, unpause, pause } = useActions();

  return (
    <div id='player' onClick={() => setModal('PlayQueue')} >
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
        <CurrentTime />
      </div>
      <div
        onClick={stopProp(() =>
          currentTrack && (
            status === 'PLAYING'
            ? pause()
            : unpause()
          ))
        }
        disabled={!currentTrack}
      >
        <i className='material-icons'>
          { status === 'PLAYING' ? 'pause' : 'play_arrow' }
        </i>
      </div>
      <div onClick={() => setModal('PlayQueue')}>
        <i className='material-icons'>list</i>
      </div>
    </div>
  );
}

// Make frequent re-rendering PureComponent as small as possible
function CurrentTime() {
  const currentTime =  useStatePath('player.currentTime');
  return formatTime(currentTime);
}
