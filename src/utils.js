import _ from 'lodash';
import { Context } from 'immutability-helper';
import { sprintf } from 'sprintf-js';
import { useRef, useState } from 'react';
import { Observable } from 'rxjs';
import axios from 'axios';


///////////////////
// Miscellaneous //
///////////////////

const PROXY_PREFIX =
  'https://script.google.com/macros/s/AKfycbwlRhtH1THiHcTY0hbZtcMd1K_ucndHfa-8iugHJMgaKjDY2HqoJbMAACMIITNeMNpZ/exec?url=';

const fetchText = (...args) => fetch(...args).then(resp => {
  if (!resp.ok) { throw new Error(); }
  return resp.text();
});

const proxyFetchText = (url, ...args) => fetchText(`${PROXY_PREFIX}${url}`, ...args);

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

///////////////////////////
// Youtube site scraping //
///////////////////////////

export const parseYoutubeUrl = (url) => {
  const obj = new URL(url);
  const videoId = obj.searchParams.get('v');
  const playlistId = obj.searchParams.get('list');
  if (videoId) {
    return {
      type: 'video',
      id: videoId,
    }
  } else if (playlistId) {
    return {
      type: 'playlist',
      id: playlistId
    }
  }
}

const extractVideoInfo = (content) => {
  const mobj = content.match(/;ytplayer\.config\s*=\s*({.+?});ytplayer/);
  const config = JSON.parse(mobj[1]);
  const player_response = JSON.parse(config.args.player_response);
  return _.pick(player_response.videoDetails, ['videoId', 'author', 'title']);
}

// For a user agent "Mozilla/5.0 (compatible; Google-Apps-Script)"
const extractPlaylistInfo = (content) => {
  const document = (new DOMParser()).parseFromString(content, 'text/html')
  const name = document.querySelector('.pl-header-title').textContent.trim();
  const nodes = Array.from(document.querySelectorAll('.pl-video'));
  return {
    name,
    videos: nodes.map(node => ({
      videoId: node.getAttribute('data-video-id'),
      title:   node.getAttribute('data-title'),
      author:  node.querySelector('.pl-video-owner a').textContent.trim()
    }))
  };
}

export const getYoutubeVideoInfo = (id) =>
  proxyFetchText(`https://www.youtube.com/watch?v=${id}`)
  .then(extractVideoInfo);

export const getYoutubePlaylistInfo = (id) =>
  proxyFetchText(`https://www.youtube.com/playlist?list=${id}`)
  .then(extractPlaylistInfo);

const youtubeDlUrl =
  process.env.NODE_ENV === 'production'
  ? 'https://youtube-dl-service.herokuapp.com'
  : 'http://localhost:3001';

export const getAudioData = (videoId) =>
  fetch(`${youtubeDlUrl}/download?video=${videoId}`)
  .then(resp => resp.blob());

export const getAudioDataObservable = (videoId) =>
  fromAxiosGet(`${youtubeDlUrl}/download?video=${videoId}`, { responseType: 'blob' });


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
const fromAxiosGet = (url, config = {}) => {
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
