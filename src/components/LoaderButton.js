import React from 'react';
import { useLoader } from '../stateUtils';

export default function LoaderButton(props) {
  const { action, icon, children, ...rest } = props;
  const [ _action, { loading, error } ] = useLoader(action);

  return (
    <div onClick={_action} {...rest}>
      { error
        ? <i className='material-icons'>error</i>
        : loading
        ? <div className='spinner' />
        : <i className='material-icons'>{icon}</i>
      }
    </div>
  );
}
