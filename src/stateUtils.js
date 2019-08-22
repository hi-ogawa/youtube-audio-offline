import { useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import objectPath from "object-path";
import _ from 'lodash';
import localforage from 'localforage';
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

import { update, parseYoutubeUrl, getYoutubeVideoInfo, getYoutubePlaylistInfo, getAudioData } from "./utils";
import AudioManager from './AudioManager';

// type ID = String;

// interface Player {
//   currentIndex: int,
//   queuedTrackIds: Array<ID>,
//   status enum 'PLAYING', 'STOPPED'
//   currentTime: int
//   duration: int
//   audio: Audio
// }

// interface Track {
//   id: ID,
//   videoId: string,
//   title: string,
//   author: string,
//   audioReady: boolean,
// }

export const initialState = {
  player: {
    currentIndex: null,
    queuedTrackIds: [],
    status: 'STOPPED', // 'PLAYING'
    currentTime: null,
    duration: null
  },
  tracks: [],
  trackListMode: 'GROUP', // 'FLAT'
  playlists: [], // { name: string, id: string }
  modal: {
    className: null, // cf modalPages in Modal.js
  },
};

const statePath = _.memoize((path) => (S) => objectPath.get(S, path));

export const useStatePath = (path) => useSelector(statePath(path));

export const selectors = {
  currentTrackId: ({ player: { currentIndex, queuedTrackIds } }) =>
    queuedTrackIds[currentIndex],

  currentTrack: createSelector(
    statePath('player.currentIndex'),
    statePath('player.queuedTrackIds'),
    statePath('tracks'),
    (index, ids, tracks) => tracks.find(t => t.id === ids[index])
  ),

  queuedTracks: createSelector(
    statePath('player.queuedTrackIds'),
    statePath('tracks'),
    (ids, tracks) => ids.map(id => tracks.find(t => t.id === id))
  )
}

export const actions = {
  // Dirty shortcut, not supposed to be used much
  _U: (command) => async (D, S) => U(D)(command),

  getSessionKeys: () => async (D, S) => {
    const keys = await localforage.getItem('session-keys');
    return keys || [];
  },
  createSession: () => async (D, S) => {
    const key = (new Date()).toLocaleString();
    const keys = await D(actions.getSessionKeys())
    keys.push(key);
    await localforage.setItem(`session-keys`, keys);
    await localforage.setItem(`session-state-${key}`, S());
  },
  loadSession: (key) => async (D, S) => {
    const { tracks, playlists, trackListMode } = await localforage.getItem(`session-state-${key}`);
    U(D)({ $merge: {
      ...initialState,
      tracks,
      playlists,
      trackListMode,
    }});
  },
  updateSession: (key) => async (D, S) => {
    await localforage.setItem(`session-state-${key}`, S());
  },
  destroySession: (key) => async (D, S) => {
    const keys = await D(actions.getSessionKeys());
    await localforage.removeItem(`session-state-${key}`);
    await localforage.setItem(`session-keys`, keys.filter(_key => _key !== key));
  },
  loadLatestSession: () => async (D, S) => {
    const keys = await D(actions.getSessionKeys());
    const key = _.last(keys);
    if (key) {
      await D(actions.loadSession(key));
    }
  },

  setModal: (className) => async (D, S) => {
    U(D)({ modal: { className: { $set: className } } });
  },

  importTracks: (url) => async (D, S) => {
    const { type, id } = parseYoutubeUrl(url);
    let tracks;
    if (type === 'video') {
      const data = await getYoutubeVideoInfo(id);
      tracks = [{
        id:      data.videoId,
        videoId: data.videoId,
        title:   data.title,
        author:  data.author,
        audioReady: false,
      }]
    } else if (type === 'playlist') {
      const { name, videos } = await getYoutubePlaylistInfo(id);
      if (!S().playlists.find(p => p.id === id)) {
        U(D)({
          playlists: { $push: [{ id, name }] }
        });
      }
      tracks = videos.map(v => ({
          id:      v.videoId,
          videoId: v.videoId,
          title:   v.title,
          author:  v.author,
          audioReady: false,
      }));
    }
    const oldTrackIds = S().tracks.map(track => track.id);
    tracks = tracks.filter(track => !oldTrackIds.includes(track.id));
    await Promise.all(tracks.map(async t => {
      const value = await localforage.getItem(t.id);
      t.audioReady = !!value;
    }));
    U(D)({
      tracks: { $push: tracks }
    });
  },
  downloadAudioData: (id) => async (D, S) => {
    await localforage.removeItem(id);
    const blob = await getAudioData(id);
    await localforage.setItem(id, blob);
    U(D)({
      tracks: {
        $find: {
          query: { id },
          op: {
            $merge: {
              audioReady: true,
            }
          }
        }
      }
    });
  },
  clearAudioData: (id) => async (D, S) => {
    await localforage.removeItem(id);
    U(D)({
      tracks: {
        $find: {
          query: { id },
          op: {
            $merge: {
              audioReady: false,
            }
          }
        }
      }
    });
  },
  queueTrack: (id, andPlay) => async (D, S) => {
    const index = S().player.queuedTrackIds.length;
    U(D)({
      player: {
        queuedTrackIds: { $push: [ id ] }
      }
    });
    if (andPlay) {
      D(actions.setCurrentTrackFromQueueByIndex(index));
    }
  },
  setCurrentTrackFromQueueByIndex: (index) => async (D, S) => {
    const id = S().player.queuedTrackIds[index];
    U(D)({
      player: {
        currentIndex: { $set: index },
      }
    });
    D(actions.play(id));
  },
  moveCurrentTrack: (diff) => async (D, S) => {
    const { currentIndex, queuedTrackIds } = S().player;
    let index = (currentIndex + diff) % queuedTrackIds.length;
    if (index < 0) { index = index + queuedTrackIds.length; }
    D(actions.setCurrentTrackFromQueueByIndex(index));
  },
  removeTrackFromQueueByIndex: (index) => async (D, S) => {
    U(D)({ player: { queuedTrackIds: { $splice: [[index, 1]] } } });
  },

  play: (id) => async (D, S) => {
    const blob = await localforage.getItem(id);
    console.assert(blob !== null);
    AudioManager.setBlob(blob)
    await AudioManager.play();
    U(D)({ player: { status: { $set: 'PLAYING' } } });

    const { title } = selectors.currentTrack(S());
    document.title = title;
  },
  unpause: () => async (D, S) => {
    await AudioManager.play();
    U(D)({ player: { status: { $set: 'PLAYING' } } });
  },
  pause: () => async (D, S) => {
    await AudioManager.pause();
    U(D)({ player: { status: { $set: 'STOPPED' } } });
  },
  seek: (time) => async (D, S) => {
    await AudioManager.seek(time);
  },
}

export const setupWithStore = async (store) => {
  initializeAudioManager(store);
  await store.dispatch(actions.loadLatestSession());
}

const initializeAudioManager = (store) => {
  AudioManager.initialize();

  fromEvent(AudioManager.el, 'timeupdate').pipe(throttleTime(800))
  .subscribe(e => {
    const time = e.target.currentTime;
    store.dispatch(actions._U({
      player: { currentTime: { $set: time } }
    }));
  });

  fromEvent(AudioManager.el, 'durationchange')
  .subscribe(e => {
    store.dispatch(actions._U({
      player: { duration: { $set: e.target.duration } }
    }));
  });

  fromEvent(AudioManager.el, 'ended')
  .subscribe(e => {
    store.dispatch(actions.moveCurrentTrack(+1));
  });
}

const U = (D) => (command) => D({
  type: '$U',
  command
});

export const useActions = () =>
  bindActionCreators(actions, useDispatch());

// Inspired by "useMutation" from apollo-client
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
    refF.current = newF;
  }
  return [ refF.current, state ];
}

export const reducer = (state, action) =>
  action.type === '$U' ? update(state, action.command) : state;
