import React, { useEffect } from 'react';
import { useLoader, alertError } from '../utils';

// NOTE: turns out not flexible enough to use...
export default function LoaderButton(props) {
  const { action, icon, container, ...rest } = props;
  const [ _action, { loading, error } ] = useLoader(action);
  alertError(error);

  const Klass = container || 'div';

  return (
    <Klass onClick={_action} {...rest} >
      { error
        ? <i className='material-icons'>error</i>
        : loading
          ? <div className='spinner' />
          : <i className='material-icons'>{icon}</i>
      }
    </Klass>
  );
}
