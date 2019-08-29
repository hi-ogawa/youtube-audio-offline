import _ from 'lodash';
import qs from 'qs';

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

export const extractFormats = (content) => {
  const mobj = content.match(/;ytplayer\.config\s*=\s*({.+?});ytplayer/);
  const config = JSON.parse(mobj[1]);
  const player_response = JSON.parse(config.args.player_response);
  const formats1 = player_response.streamingData.formats;
  const formats2 = player_response.streamingData.adaptiveFormats;
  const fields = ['itag', 'url', 'contentLength', 'mimeType',
                  'quality', 'qualityLabel', 'audioQuality', 'bitrate', 'audioSampleRate'];
  return _.map(_.concat(formats1, formats2), f => _.pick(f, fields));
}

// Not sure which one is the "best", so just something worked so far.
export const chooseFormat = (formats) =>
  formats.find(f => f.mimeType.match('audio/webm') && f.audioQuality !== 'AUDIO_QUALITY_LOW') ||
  formats.find(f => f.mimeType.match('audio/webm')) ||
  formats.find(f => f.mimeType.match('audio'));

// For a user agent "Mozilla/5.0 (compatible; Google-Apps-Script)"
const extractPlaylistInfo = (content) => {
  const document = (new DOMParser()).parseFromString(content, 'text/html');
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

const createUrl = (url, searchParams) => {
  const urlObj = new URL(url);
  urlObj.search = qs.stringify(searchParams);
  return urlObj;
};

// NOTE: Directly use production (https://github.com/hi-ogawa/toy-proxy)
const PROXY_URL = 'https://toy-proxy-autcwh26da-an.a.run.app';
// const PROXY_URL = 'http://localhost:3030';

const headers1 = {
  'Accept-Language': 'en-US,en',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
}
const headers2 = {
  'Accept-Language': 'en-US,en',
  'User-Agent': 'Mozilla/5.0 (compatible; Google-Apps-Script)'
};

export const getYoutubeVideoInfo = (id) =>
  fetch(createUrl(PROXY_URL, { url: `https://www.youtube.com/watch?v=${id}`, requestHeadersOverride: headers1,  }))
  .then(resp => resp.text())
  .then(extractVideoInfo);

export const getYoutubePlaylistInfo = (id) =>
  fetch(createUrl(PROXY_URL, { url: `https://www.youtube.com/playlist?list=${id}`, requestHeadersOverride: headers2 }))
  .then(resp => resp.text())
  .then(extractPlaylistInfo);

export const getYoutubeFormats = (id) =>
  fetch(createUrl(PROXY_URL, { url: `https://www.youtube.com/watch?v=${id}`, requestHeadersOverride: headers1 }))
  .then(resp => resp.text())
  .then(extractFormats);

export const getYoutubeAudioDataUrl = (id) =>
  getYoutubeFormats(id)
  .then(chooseFormat)
  .then(({ url }) =>
    createUrl(PROXY_URL, { url, resolveRedirection: true, requestHeaderBlacklist: ['host'] }));
