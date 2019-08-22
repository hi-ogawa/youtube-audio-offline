import React, { useRef } from 'react';

import { useActions, useStatePath } from '../stateUtils';
import TrackImport from './TrackImport';
import TrackSort from './TrackSort';
import TrackActions from './TrackActions';
import PlayQueue from './PlayQueue';
import Saver from './Saver';

const modalPages = {
  TrackImport, TrackSort, TrackActions, PlayQueue, Saver
}

export default function Modal() {
  const className =  useStatePath('modal.className');
  const Klass = modalPages[className];
  const { setModal } = useActions();
  const nodeRef = useRef(null);

  return (
    <div
      id='modal'
      disabled={!Klass}
      ref={nodeRef}
      onClick={e => e.target === nodeRef.current && setModal(null)}
    >
      <div id='modal-inner'>
        <div id='close-modal' onClick={() => setModal(null)}>
          <i className='material-icons'>close</i>
        </div>
        { Klass && <Klass /> }
      </div>
    </div>
  );
}
