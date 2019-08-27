import React, { useState, useRef } from 'react';
import CN from 'classnames';

import { useActions, useStatePath } from '../stateUtils';
import { useLoader_V2 } from '../utils';

export default function UserPage() {
  const user = useStatePath('user');
  return user ? <UserAccount {...{ user }}/> : <LoginOrRegister />
}

function LoginOrRegister() {
  const [state, setState] = useState('LOGIN'); // enum 'LOGIN', 'REGISTRATION'
  return state === 'LOGIN' ? <Login {...{ setState }} /> : <Register {...{ setState }} />
}

function Login({ setState }) {
  const { login } = useActions();
  const [ _login,  { loading, error } ] = useLoader_V2(login);

  const refNode1 = useRef(null);
  const refNode2 = useRef(null);

  return (
    <div id='login-container'>
      <div>Login</div>
      <div>
        <div>
          <div>Username</div>
          <input type='text' ref={refNode1} />
        </div>
        <div>
          <div>Password</div>
          <input type='password' ref={refNode2} />
        </div>
        <div>
          <div
            className={CN({ loading })}
            onClick={() => _login(refNode1.current.value, refNode2.current.value)}
          >
            <div className='spinner'/>
            <span>Login</span>
          </div>
        </div>
        <div onClick={() => setState('REGISTRATION')}>
          Create account instead
        </div>
        <div>{ error && error.message }</div>
      </div>
    </div>
  );
}

function Register({ setState }) {
  const { register } = useActions();
  const [ _register,  { loading, error } ] = useLoader_V2(register);
  const refNode1 = useRef(null);
  const refNode2 = useRef(null);

  return (
    <div id='register-container'>
      <div>Create account</div>
      <div>
        <div>
          <div>Username</div>
          <input type='text' ref={refNode1} />
        </div>
        <div>
          <div>Password</div>
          <input type='password' ref={refNode2} />
        </div>
        <div>
          <div
            className={CN({ loading })}
            onClick={() => _register(refNode1.current.value, refNode2.current.value)}
          >
            <div className='spinner'/>
            <span>Register</span>
          </div>
        </div>
        <div onClick={() => setState('LOGIN')}>
          Login instead
        </div>
        <div>{ error && error.message }</div>
      </div>
    </div>
  );
}

function UserAccount(props) {
  const { user: { username } } = props;
  const { logout, pushData, pullData } = useActions();
  const [ _pushData,  state1 ] = useLoader_V2(pushData);
  const [ _pullData,  state2 ] = useLoader_V2(pullData);

  return (
    <div id='user-account-container'>
      <div>User Account</div>
      <div>
        <div>
          <div>Profile</div>
          <div>
            <div>Username</div>
            <div>{ username }</div>
          </div>
        </div>
        <div>
          <div>Synchronize Data</div>
          <div>
            <div className={CN({ loading: state1.loading })} onClick={_pushData}>
              <div className='spinner'/>
              <span>Upload</span>
            </div>
            <div className={CN({ loading: state2.loading })} onClick={_pullData}>
              <div className='spinner'/>
              <span>Download</span>
            </div>
          </div>
          <div>{ state1.error && `UPLOAD: ${state1.error.message}` }</div>
          <div>{ state2.error && `DOWNLOAD: ${state2.error.message}` }</div>
        </div>
        <div onClick={logout}>Logout</div>
      </div>
    </div>
  );
}
