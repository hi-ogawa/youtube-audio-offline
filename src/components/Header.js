import React from 'react';
import gql from 'graphql-tag';

import { useActions, useGQL } from '../stateUtils';

const Q = gql`
{
  trackListMode
}
`;

export default function Header() {
  const { trackListMode } = useGQL(Q);
  const { setModal, _U } = useActions();

  return (
    <div id='header'>
      <div onClick={() => setModal('Saver')}>
        <i className='material-icons'>save</i>
      </div>
      {
        trackListMode === 'FLAT'
        ?
        <div onClick={() => _U({ trackListMode: { $set: 'GROUP' } })}>
          <i className='material-icons'>sort_by_alpha</i>
        </div>
        :
        <div onClick={() => _U({ trackListMode: { $set: 'FLAT' } })}>
          <i className='material-icons'>group</i>
        </div>
      }
      <div onClick={() => setModal('TrackImport')}>
        <i className='material-icons'>playlist_add</i>
      </div>
    </div>
  );
}
