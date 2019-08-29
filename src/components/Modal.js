import React, { useRef, useState, useEffect } from 'react';
import CN from 'classnames';

import { useActions, useStatePath } from '../stateUtils';
import TrackImport from './TrackImport';
import TrackSort from './TrackSort';
import TrackActions from './TrackActions';
import PlayQueue from './PlayQueue';
import Saver from './Saver';
import DownloadList from './DownloadList';
import UserPage from './UserPage';

const modalPages = {
  TrackImport, TrackSort, TrackActions, PlayQueue, Saver, DownloadList, UserPage
}

export default function Modal() {
  const { className, props } =  useStatePath('modal');
  const Klass = modalPages[className];
  const { setModal } = useActions();
  const nodeRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const fadeIn = Klass;
  const fadeOut = !Klass;

  useEffect(() => {
    if (Klass) {
      setVisible(true);
    } else {
      window.setTimeout(() => setVisible(false), 300);
    }
  }, [ Klass ]);

  return (
    <div
      id='modal'
      className={CN({ visible, fadeIn, fadeOut })}
      ref={nodeRef}
      onClick={e => e.target === nodeRef.current && setModal(null)}
    >
      <div id='modal-inner'>
        <div id='close-modal' onClick={() => setModal(null)}>
          <i className='material-icons'>close</i>
        </div>
        { Klass && <Klass {...props} /> }
      </div>
    </div>
  );
}
