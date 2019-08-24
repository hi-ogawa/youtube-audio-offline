import React, { useState } from 'react';
import _ from 'lodash';

import { useAxiosGet, stopProp, formatBytes } from '../utils';

// NOTE: Trying to implement pregress/cancel logic without redux but gave up.
export function LoaderProgressCancellable(props) {
  const { url, axiosConfig, onResolve=(() => {}), Container='div', ...rest } = props;
  const [ hookedGet, canceller, { loading, progress, error } ] = useAxiosGet();

  const realError = (error && !error.__CANCEL__) && error;

  return (
    <Container
      onClick={() =>
        !loading && !progress && !realError &&
        hookedGet(url, axiosConfig).then(onResolve)}
      {...rest}
    >
      { !loading && !progress && !realError &&
        <i className='material-icons'>get_app</i> }

      { loading &&
        <div className='spinner' /> }

      { realError &&
        <i className='material-icons'>error</i> }

      <div className='loader-tooltip'>
        { progress &&
          <div>Progress: {`${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}`}</div> }

        { (loading || progress) &&
          <div onClick={stopProp(canceller)}>Cancel</div> }

        { realError &&
          <div onClick={stopProp(() => hookedGet(url, axiosConfig).then(onResolve))}>Retry</div> }
      </div>
    </Container>
  );
}

// cf. utils.useAxiosGet, src/story.js
export function LoaderProofOfConcept(props) {
  const { url, axiosConfig, onResolve } = props;
  const [ hookedGet, canceller, { loading, progress, error } ] = useAxiosGet();
  const [ resolvedValue, setResolvedValue ] = useState(null);

  return (
    <div>
      <button onClick={() => hookedGet(url, axiosConfig).then(v => { setResolvedValue(v); onResolve(v); })}>
        GET
      </button>
      <button onClick={canceller}>
        CANCEL
      </button>
      <div>url: { url }</div>
      <div>loading: { loading.toString() }</div>
      <div>error.__CANCEL__: { (!!error && !!error.__CANCEL__).toString() }</div>
      <div>error.toString(): {error && error.toString()}</div>
      <div>progress: <code>{JSON.stringify(_.pick(progress, ['lengthComputable', 'total', 'loaded']))}</code></div>
      <div>resolvedResolved keys: <code>{JSON.stringify(_.keys(resolvedValue))}</code></div>
    </div>
  );
}
