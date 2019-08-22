import React, { useEffect } from 'react';
import { useLoader } from '../stateUtils';

export default function LoaderButton(props) {
  const { action, icon, container, ...rest } = props;
  const [ _action, { loading, error } ] = useLoader(action);

  useEffect(() => {
    if (error) {
      window.alert(error);
    }
  }, [ error ]);

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
