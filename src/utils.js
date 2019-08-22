import _ from 'lodash';
import { Context } from 'immutability-helper';
import { sprintf } from 'sprintf-js';


///////////////////
// Miscellaneous //
///////////////////

const CORS_PROXY_URLS = ['https://cors-anywhere.herokuapp.com', 'https://ytsub-proxy.herokuapp.com']

const lazyOr = (funcs) =>
  funcs.length === 0 ? Promise.reject : funcs[0]().catch(() => lazyOr(_.tail(funcs)));

const fetchText = (...args) => fetch(...args).then(resp => {
  if (!resp.ok) { throw new Error(); }
  return resp.text();
});

const proxyFetchText = (url, options) => {
  let funcs = CORS_PROXY_URLS.map(proxy_url => () => fetchText(`${proxy_url}/${url}`, options));
  return lazyOr(funcs);
}

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

const extractPlaylistInfo = (content) => {
  const m = content.match(/window\["ytInitialData"\] = ({.+?});\s*window\["ytInitialPlayerResponse"\]/);
  const obj = JSON.parse(m[1]);
  const name = obj.sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer.title.runs[0].text;
  const list = obj.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
  return {
    name: name,
    videos: list.map(elem => ({
      videoId: elem.playlistVideoRenderer.videoId,
      title:   elem.playlistVideoRenderer.title.simpleText,
      author:  elem.playlistVideoRenderer.shortBylineText.runs[0].text
    }))
  }
}

export const getYoutubeVideoInfo = (id) =>
  proxyFetchText(`https://www.youtube.com/watch?v=${id}`, {
    headers: {
      'Accept-Language': 'en-US,en',
      // For node based testing to work (i.e. jest and jsdom)
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
    } })
  .then(extractVideoInfo);

export const getYoutubePlaylistInfo = (id) =>
  proxyFetchText(`https://www.youtube.com/playlist?list=${id}`, {
    headers: {
      'Accept-Language': 'en-US,en',
      // For node based testing (i.e. jest and jsdom)
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
    } })
  .then(extractPlaylistInfo);

export const getAudioData = (videoId) =>
  fetch(`http://localhost:3001/download?video=${videoId}`)
  // fetch(`https://youtube-dl-service/download?video=${videoId}`)
  .then(resp => resp.blob());


///////////////////////////////////
// Customize immutability-helper //
///////////////////////////////////

export const update = (new Context()).update;

// Operate on element chosen by "query" from array
update.extend('$find', ({ query, op }, originalArray) => {
  const index = _.findIndex(originalArray, query);
  return update(originalArray, { [index]: op });
});
