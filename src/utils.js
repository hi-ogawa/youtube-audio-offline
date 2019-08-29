import _ from 'lodash';
import { Context } from 'immutability-helper';
import { sprintf } from 'sprintf-js';
import { useRef, useState } from 'react';
import { Observable } from 'rxjs';
import axios from 'axios';


///////////////////
// Miscellaneous //
///////////////////

export const formatTime = (_sec) => {
  const sec = _sec || 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return sprintf('%d:%02d', m, s);
}

export const stopProp = (f) => (e) => {
  e.stopPropagation();
  return f(e);
}

// cf. https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i];
}

export const fromStore = (store) => {
  const observable = new Observable(subscriber => {
    store.subscribe(() => {
      subscriber.next(store.getState());
    });
  });
  return observable;
}

// [pf1, pf2, ...] --> Promise.resolve().then(pf1).then(pf2).then...
// @params  Array<() => Promise<()>>
// @returns Promise<()>
const sequentialAll = pfs =>
  _.reduce(pfs, (p, pf) => p.then(pf), Promise.resolve());

// Name is too long but it's true.
// @returns [Observable<{ progress, response }>, Canceller]
export const cancellableProgressDownloadRangeRequestObserver = (url, headers, chunkSize) => {
  const chunks = [];
  let chunkedBytes = 0;
  const { token, cancel } = axios.CancelToken.source();

  const observable = new Observable(subscriber => {
    // 1. Check the whole range
    axios.get(url, { headers: { range: 'bytes=0-0', ...headers } })
    .then((checkResp) => {

      // 2. Compute ranges dividing total size
      const total = Number(checkResp.headers['content-range'].match(/bytes 0-0\/(.*)/)[1]);
      const div = Math.floor(total / chunkSize);
      const mod = total % chunkSize;
      const chunkRanges = _.range(div).map(i =>
        `bytes=${ i * chunkSize }-${ ((i + 1) * chunkSize) - 1}`);
      if (mod > 0) {
        chunkRanges.push(`bytes=${ div * chunkSize }-${ div * chunkSize + mod - 1 }`);
      }
      subscriber.next({ progress: { loaded: 0, total } })

      // 3. Define requests which will be executed sequentially
      const requestFuncions = chunkRanges.map(range => () => {
        const promise = axios.get(url, {
          headers: { range, ...headers },
          responseType: 'arraybuffer', // NOTE: 'blob' causes internal xhr exception (undebuggable)
          onDownloadProgress: (progress) => {
            const loaded = chunkedBytes + progress.loaded;
            subscriber.next({ progress: { loaded, total } });
          },
          cancelToken: token,
        });

        // We don't "catch" this promise here
        // so that single error (including cancel) kills all later requests thanks to 4's sequentialAll
        return promise.then(response => {
          chunks.push(response.data);
          chunkedBytes = chunkedBytes + response.data.byteLength;
          subscriber.next({ progress: { loaded: chunkedBytes, total } });
        });
      });

      // 4. Execute them
      sequentialAll(requestFuncions)
      .then(() => {
        // Return as Blob (anyway that's my use case)
        subscriber.next({ response: { data: new Blob(chunks) } });
        subscriber.complete();
      })
      .catch(err => subscriber.error(err));
    })
    .catch(err => subscriber.error(err));
  });
  return [observable, cancel];
}


//////////////////
// Custom Hooks //
//////////////////

// Inspired by "useMutation" from apollo-client
// TODO:
// - For my use case "origF" changes every call, so "useRef" does nothing really.
//   Maybe should try "stateUtils.statePath"-like memoization.
export const useLoader = (origF /* promise returning function */) => {
  const [state, setState] = useState({ loading: false, error: null });
  const refOrigF = useRef(null);
  const refF = useRef(null);
  if (refOrigF.current !== origF) {
    function newF() {
      setState({ loading: true, error: null });
      return origF(...arguments).then(
        (val) => {
          // NOTE: If "origF" caused the component to be unmounted,
          //       then this "setState" leads to warning.
          setState({ loading: false, error: null });
          return { value: val, error: null };
        },
        (err) => {
          setState({ loading: false, error: err });
          return { value: null, error: err };
        }
      );
    }
    refOrigF.current = origF;
    refF.current = newF;
  }
  return [ refF.current, state ];
}

export const useLoader_V2 = (origF /* promise returning function */) => {
  const [state, setState] = useState({ loading: false, error: null });
  function newF() {
    setState({ loading: true, error: null });
    return origF(...arguments).then(
      (val) => {
        // NOTE: If "origF" caused the component to be unmounted,
        //       then this "setState" leads to warning.
        setState({ loading: false, error: null });
        return { value: val, state };
      },
      (err) => {
        setState({ loading: false, error: err });
        return { value: null, state };
      }
    );
  }
  return [ newF, state ];
}


// NOTE:
// - Probably generalizable to "progressable" and "cancellable" promise or something...
// - Looks similar to "useObservable" but not quite...
// - error.__CANCELL__ indicates "cancellar" was called
// - cf. story.js LoaderTester
export const useAxiosGet = () => {
  const [state, setState] = useState({ loading: false, progress: null, error: null });
  const refCanceller = useRef(() => {
    throw Error('"canceller" has to be called after "hookedGet".');
  });
  const hookedGet = (url, axiosConfig) => {
    setState({ loading: true, progress: null, error: null });
    return new Promise(resolve => {
      const [observable, canceller] = fromAxiosGet(url, axiosConfig);
      refCanceller.current = canceller;
      observable.subscribe(
        ({ progress, response }) => {
          if (progress) {
            const nextState = { loading: true, progress: progress, error: null };
            setState(nextState);
          }
          if (response) {
            const nextState = { loading: false, progress: null, error: null };
            setState(nextState);
            resolve({ response, state: nextState });
          }
        },
        (error) => {
          const nextState = { loading: false, progress: null, error: error };
          setState(nextState);
          resolve({ state: nextState });
        }
      )
    })
  };
  return [ hookedGet, refCanceller.current, state ];
}

// NOTE: Probably such a dirty way of using Observable
// - to get response, subscribe to "observable.pipe(last, map(obj => obj.response))"
// - to get progress, subscribe to "observable.pipe(map(obj => obj.progress), takeWhile(x => x))"
// - error.__CANCEL__ indicates that cancel() is called
export const fromAxiosGet = (url, config = {}) => {
  const { token, cancel } = axios.CancelToken.source();
  const observable = new Observable(subscriber => {
    const promise = axios.get(url, _.extend(config, {
      onDownloadProgress: progress => subscriber.next({ progress }),
      cancelToken: token,
    }));
    promise.then(
      (response) => {
        subscriber.next({ response });
        subscriber.complete();
      },
      (error) => subscriber.error(error)
    )
  });
  return [observable, cancel];
};

// NOTE: Couldn't help making it but not used...
export const useObservable = (origF) => { // any => Observable<any>
  const [state, setState] = useState({ value: null, error: null, complete: false });
  const hookedF = (...args) => { // any => Promise<any> (promise is pending until error or complete)
    return new Promise(resolve => {
      const observable = origF(...args);
      observable.subscribe(
        (value) => {
          const nextState = { value: value, error: null, complete: false };
          setState(nextState);
        },
        (error) => {
          const nextState = { value: null, error: error, complete: false };
          setState(nextState);
          resolve(nextState);
        },
        () => {
          const nextState = { value: null, error: null, complete: true };
          setState(nextState);
          resolve(nextState);
        },
      )
    });
  }
  return [ hookedF, state ];
}


///////////////////////////////////
// Customize immutability-helper //
///////////////////////////////////

export const update = (new Context()).update;
update.defineCustomQuery = () => {
  // TODO: Generalizable to all the lodash method using "_.matches iteratee shorthand." ??
  // Operate on element chosen by "query" from array
  update.extend('$find', ({ $query, $op }, originalArray) => {
    const index = _.findIndex(originalArray, $query);
    return update(originalArray, { [index]: $op });
  });

  update.extend('$filter', (query, originalArray) => {
    return _.filter(originalArray, query);
  });

  update.extend('$reject', (query, originalArray) => {
    return _.reject(originalArray, query);
  });
}
