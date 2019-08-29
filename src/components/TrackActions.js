import React from 'react';

import { useActions } from '../stateUtils';

export default function TrackActions(props) {
  const { deleteTrack, deleteAudioData, setModal } = useActions();
  const { id, downloadState } = props;

  return (
    <div id='track-actions-container'>
      <div>Track Info</div>
      <div>
        <div onClick={() => deleteTrack(id).then(() => setModal(null)) }>
          Delete Track
        </div>
        <div
          onClick={() => downloadState === 'DONE' && deleteAudioData(id).then(() => setModal(null)) }
          disabled={downloadState !== 'DONE'}
        >
          Delete audio data only
        </div>
      </div>
    </div>
  );
}
