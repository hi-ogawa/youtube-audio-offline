import React, { useState, useEffect } from 'react';

import { useActions } from '../stateUtils';

export default function Saver() {
  const { getSessionKeys, createSession, loadSession, updateSession, destroySession } = useActions();
  const [ keys, setKeys ] = useState([]);
  const loadKeys = () => { getSessionKeys().then(setKeys) }
  useEffect(loadKeys, []);

  return (
    <div id='saver-container'>
      <div>Sessions</div>
      <div>
        { keys.map(key =>
            <div key={key}>
              <div>{key}</div>
              <div onClick={() => loadSession(key)}>
                <i className='material-icons'>restore</i>
              </div>
              <div onClick={() => window.confirm('Are you sure to overwrite this session?') && updateSession(key)}>
                <i className='material-icons'>save</i>
              </div>
              <div onClick={() => window.confirm('Are you sure to destory this session?') && destroySession(key).then(loadKeys)}>
                <i className='material-icons'>delete</i>
              </div>
            </div>
        )}
      </div>
      <div>
        <div onClick={() => createSession().then(loadKeys)}>Create New Session</div>
      </div>
    </div>
  );
}
