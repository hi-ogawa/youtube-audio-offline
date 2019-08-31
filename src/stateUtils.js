import { bindActionCreators } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import objectPath from "object-path";
import _ from 'lodash';
import localforage from 'localforage';
import { throttleTime } from 'rxjs/operators';

import { update, cancellableProgressDownloadRangeRequestObserver, fromStore } from "./utils";
import { parseYoutubeUrl, getYoutubeVideoInfo, getYoutubePlaylistInfo, getYoutubeAudioDataUrl } from "./youtubeUtils";
import AudioManager from './AudioManager';
import apiUtils from "./apiUtils";

// TODO: Hoping to use typescript soon
// type ID = String;

// interface Player {
//   currentIndex: int,
//   queuedTrackIds: Array<ID>,
// }

// interface Track {
//   id: ID,
//   videoId: string,
//   title: string,
//   author: string,
//   downloadState: enum 'NOT_STARTED', 'LOADING', 'ERROR', 'CANCELLED', 'DONE'
// }

// interface User {
//   username: string,
//   authToken: string,
// }

export const initialState = {
  player: {
    currentIndex: null,
    queuedTrackIds: [],
  },
  tracks: [],
  trackListMode: 'GROUP', // 'FLAT'
  playlists: [], // { id: (playlist id), name: string }
  downloads: [], // { id: (track id), complete: boolean, progress: object, canceller: func, error: object }
                 // NOTE: we could've put this information in Track but this separation makes it possible to
                 //       avoid re-rendering TrackList during progress update
  modal: {
    className: null, // cf. modalPages in Modal.js
    props: {},
  },
  user: null,
  audioElement: null, // cf. initializeAudioManager
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

const actions = {
  // Dirty shortcut, not supposed to be used much
  _U: (command) => async (D, S) => U(D)(command),

  // User data apis
  register: (username, password) => async (D, S) => {
    const response = await apiUtils.register(username, password);
    U(D)({ user: { $set: _.pick(response.data, [ 'username', 'authToken' ]) }});
  },
  login: (username, password) => async (D, S) => {
    const response = await apiUtils.login(username, password);
    U(D)({ user: { $set: _.pick(response.data, [ 'username', 'authToken' ]) }});
  },
  logout: () => async (D, S) => {
    AudioManager.reset();
    U(D)({ $set: initialState });
  },
  pullData: () => async (D, S) => {
    AudioManager.reset();
    const response = await apiUtils.getData(S());
    // Need to check since initially data === null on the database
    if (response.data) {
      let { tracks, playlists, trackListMode } = response.data;
      await Promise.all(tracks.map(async t => {
        const value = await localforage.getItem(t.id);
        t.downloadState = value ? 'DONE' : 'NOT_STARTED';
      }));
      U(D)({ $merge: {
        tracks,
        playlists,
        trackListMode,
      }});
    }
  },
  pushData: () => async (D, S) => {
    await apiUtils.patchData(S());
  },

  // Saving state in client storage for development (not used now)
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

  setModal: (className, props) => async (D, S) => {
    U(D)({ modal: { $set: { className, props } } });
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
        downloadState: 'NOT_STARTED',
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
          downloadState: 'NOT_STARTED',
      }));
    }
    const oldTrackIds = S().tracks.map(track => track.id);
    tracks = tracks.filter(track => !oldTrackIds.includes(track.id));
    await Promise.all(tracks.map(async t => {
      const value = await localforage.getItem(t.id);
      t.downloadState = value ? 'DONE' : 'NOT_STARTED';
    }));
    U(D)({
      tracks: { $push: tracks }
    });
  },

  // Actually "start" or "retry after error/cancel" (thus check if entry is there already)
  startDownloadAudio: (id) => async (D, S) => {
    const downloads = statePath('downloads')(S());
    U(D)({
      tracks: {
        $find: {
          $query: { id },
          $op: { $merge: { downloadState: 'LOADING'} }
        }
      }
    });
    if (_.find(downloads, { id })) {
      U(D)({
        downloads: {
          $find: {
            $query: { id },
            $op: { $merge: { complete: false, progress: null, canceller: null, error: null } }
          }
        }
      });
    } else {
      U(D)({
        downloads: {
          $push: [{ id, complete: false, progress: null, canceller: null, error: null }]
        }
      });
    }
    const url = await getYoutubeAudioDataUrl(id);
    // Range request so that it fits current limit:
    // - 6MB response payload per request: https://docs.aws.amazon.com/lambda/latest/dg/limits.html
    // - 10 seconds per invocation: https://zeit.co/account/plan
    // - (currently not used, but if cloud run, then Google's reverse proxy has 32MB limit: https://cloud.google.com/run/quotas)
    const [observable, canceller] =
        cancellableProgressDownloadRangeRequestObserver(url, {}, Math.pow(2, 22)); // 4MiB
    observable.subscribe(
      ({ progress, response }) => {
        if (progress) {
          const total = progress.total;
          const loaded = progress.loaded;
          U(D)({
            downloads: {
              $find: {
                $query: { id },
                $op: { $merge: { progress: { total, loaded }, canceller } }
              }
            }
          });
        }
        if (response) {
          (async () => {
            await localforage.setItem(id, response.data);
            U(D)({
              tracks: {
                $find: {
                  $query: { id },
                  $op: { $merge: { downloadState: 'DONE' } }
                }
              },
              downloads: {
                $find: {
                  $query: { id },
                  $op: { $merge: { complete: true, progress: null, canceller: null, error: null } }
                }
              }
            });
          })();
        }
      },
      (error) => {
        U(D)({
          tracks: {
            $find: {
              $query: { id },
              $op: { $merge: { downloadState: error.__CANCEL__ ? 'CANCELLED' : 'ERROR' } }
            }
          },
          downloads: {
            $find: {
              $query: { id },
              $op: { $merge: { complete: false, progress: null, canceller: null, error } }
            }
          }
        });
      }
    );
  },
  cancelDownloadAudio: (id) => async (D, S) => {
    const downloads = statePath('downloads')(S());
    const { canceller } = _.find(downloads, { id });
    console.assert(!!canceller);
    canceller();
  },
  removeDownloadEntry: (id) => async (D, S) => {
    U(D)({ downloads: { $reject: { id } } });
  },

  deleteTrack: (id) => async (D, S) => {
    await localforage.removeItem(id);
    U(D)({ tracks: { $reject: { id } } });
  },
  deleteAudioData: (id) => async (D, S) => {
    await localforage.removeItem(id);
    U(D)({
      tracks: {
        $find: {
          $query: { id },
          $op: { $merge: { downloadState: 'NOT_STARTED' } }
        }
      }
    });
  },
  queueTracks: (ids, opts={ play: false, clear: false }) => async (D, S) => {
    let playIndex;
    if (opts.clear) {
      playIndex = 0;
      U(D)({
        player: {
          queuedTrackIds: { $set: ids }
        }
      });
    } else {
      playIndex = S().player.queuedTrackIds.length;
      U(D)({
        player: {
          queuedTrackIds: { $push: ids }
        }
      });
    }
    if (opts.play) {
      D(actions.setCurrentTrackFromQueueByIndex(playIndex));
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
  // TODO: If index === currentIndex, then update play track
  removeTrackFromQueueByIndex: (index) => async (D, S) => {
    U(D)({ player: { queuedTrackIds: { $splice: [[index, 1]] } } });
  },

  play: (id) => async (D, S) => {
    const blob = await localforage.getItem(id);
    console.assert(blob !== null);
    AudioManager.setBlob(blob)
    await AudioManager.play();

    const { title } = selectors.currentTrack(S());
    document.title = title;
  },
  unpause: () => async (D, S) => {
    await AudioManager.play();
  },
  pause: () => async (D, S) => {
    await AudioManager.pause();
  },
  seek: (time) => async (D, S) => {
    await AudioManager.seek(time);
    U(D)({ player: { currentTime: { $set: time } } });
  },
}

export const initializeStateUtils = async (store) => {
  initializeAudioManager(store.dispatch);

  await restoreLastState(store.dispatch);

  fromStore(store).pipe(throttleTime(1000))
  .subscribe(async (state) => {
    // Exclueds "downloads" since it includes non-plain object (e.g. ProgressEvent, Error, ...)
    const stripped = update(state, { downloads: { $set: []} });
    try {
      await localforage.setItem('state-tree', stripped);

    // TODO: Handle db size limit.
    } catch (err) {
      console.error(err);
    }
  });
}

const restoreLastState = async (D) => {
  const lastState = await localforage.getItem('state-tree');
  if (lastState) {
    // TODO: refactor this "re-initialize" state pattern (c.f. pullData, importTracks)
    const { tracks, playlists, trackListMode, user } = lastState;
    await Promise.all(tracks.map(async t => {
      const value = await localforage.getItem(t.id);
      t.downloadState = value ? 'DONE' : 'NOT_STARTED';
    }));
    U(D)({ $merge: {
      tracks,
      playlists,
      trackListMode,
      user,
    }});
  }
}

// TODO:
// Not sure yet how it affects overall "performance"
// (cf. CurrentTime (Player.js), SeekSliderWrapper (PlayQueue.js))
const THROTTLE_TIME = 800;

const initializeAudioManager = (D) => {
  AudioManager.initialize();

  U(D)({ audioElement: { $set: AudioManager.getState() } });

  AudioManager.getObservable(THROTTLE_TIME)
  .subscribe(({ type, state }) => {
    U(D)({ audioElement: { $set: state } });

    if (type === 'ended') {
      D(actions.moveCurrentTrack(+1));
    }
  });
}

const U = (D) => (command) => D({
  type: '$U',
  command
});

export const useActions = () =>
  bindActionCreators(actions, useDispatch());

export const reducer = (state, action) =>
  action.type === '$U' ? update(state, action.command) : state;
