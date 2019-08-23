import _ from 'lodash';
import { Context } from 'immutability-helper';
import { sprintf } from 'sprintf-js';


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

export const fetchWithProgress = () => {
}

///////////////////////////////////
// Customize immutability-helper //
///////////////////////////////////

export const update = (new Context()).update;

// Operate on element chosen by "query" from array
update.extend('$find', ({ query, op }, originalArray) => {
  const index = _.findIndex(originalArray, query);
  return update(originalArray, { [index]: op });
});
