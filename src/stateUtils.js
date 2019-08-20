import { useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import objectPath from "object-path";
import _ from 'lodash';
import localforage from 'localforage';
import graphql from 'graphql-anywhere';
import { update, parseYoutubeUrl, getYoutubeVideoInfo, getYoutubePlaylistInfo, getAudioData } from "./utils";

// type ID = String;

// interface Player {
//   audioUrl: string,
//   currentIndex: int,
//   queuedTrackIds: Array<ID>
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
    audioUrl: null,
    currentIndex: null,
    queuedTrackIds: [],
  },
  tracks: [],
  modal: {
    className: null, // 'TrackImport'
  }
}

export const selectors = {
  statePath: (path) => (S) =>
    objectPath.get(S, path),

  getTrack: (trackId) => (S) =>
    _.find(S.tracks, { id: trackId }),

  getPlayerTrack: () => (S) => {
    const { player: { currentIndex, queuedTrackIds } } = S;
    return selectors.getTrack(queuedTrackIds[currentIndex])(S);
  },
}

export const actions = {
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
        audioUrl: null,
      }]
    } else if (type === 'playlist') {
      const data = await getYoutubePlaylistInfo(id);
      tracks = data.videos.map(v => ({
          id:      v.videoId,
          videoId: v.videoId,
          title:   v.title,
          author:  v.author,
          audioReady: false,
          audioUrl: null,
      }));
    }
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
  queueAndListenTrack: (id) => async (D, S) => {
    const blob = await localforage.getItem(id);
    const audioUrl = URL.createObjectURL(blob);
    U(D)({
      player: {
        audioUrl: { $set: audioUrl },
        currentIndex: { $set: 0 },
        queuedTrackIds: { $push: [ id ] }
      }
    });
  },
  queueTrack: (id) => async (D, S) => {
    U(D)({
      player: {
        queuedTrackIds: { $push: [ id ] }
      }
    });
  }
}

const U = (D) => (command) => D({
  type: '$U',
  command
});

const resolverQuery = {
  track: (__, { id }, { tracks }) =>
    _.find(tracks, { id }),

  queuedTracks: (__, ___, { player: { queuedTrackIds }, tracks }) =>
    queuedTrackIds.map(id => _.find(tracks, { id }))
}

export const resolverAnywhere = (fieldName, rootValue, args, state) =>
  resolverQuery[fieldName]
  ? resolverQuery[fieldName](null, args, state)
  : rootValue[fieldName];

export const useGQL = (query, variables) =>
  useSelector(state => graphql(resolverAnywhere, query, state, state, variables));

export const useActions = () =>
  bindActionCreators(actions, useDispatch());

export const useSelectors = () =>
  _.mapValues(selectors, (selector) => (args) =>
    useSelector(state => selector(args)(state)) // eslint-disable-line react-hooks/rules-of-hooks
  );

// Inspired by "useMutation" from apollo-client
export const useLoader = (origF /* promise returning function */) => {
  const [state, setState] = useState({ loading: false, error: null });
  const ref = useRef(null);
  if (!ref.current) {
    function newF() {
      setState({ loading: true, error: null });
      return origF(...arguments).then(
        (val) => {
          // NOTE: If "origF" caused the component to be unmounted,
          //       then this "setState" leads to warning.
          setState({ loading: false, error: null });
          return val;
        },
        (err) => {
          setState({ loading: false, error: err });
        }
      );
    }
    ref.current = newF;
  }
  return [ ref.current, state ];
}

export const reducer = (state, action) =>
  action.type === '$U' ? update(state, action.command) : state;
