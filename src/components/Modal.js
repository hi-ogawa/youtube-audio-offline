import React, { useRef } from 'react';
import gql from 'graphql-tag';
import { useGQL, useActions } from '../stateUtils';
import TrackImport from './TrackImport';

const Q1 = gql`{
  modal {
    className
  }
}`;

const modalPages = {
  TrackImport
}

export default function Modal() {
  const { modal: { className } } = useGQL(Q1);
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
        { Klass && <Klass /> }
      </div>
    </div>
  );
}
