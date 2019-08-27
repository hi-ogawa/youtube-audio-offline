import fs from 'fs';
import _ from 'lodash';

import { update, parseYoutubeUrl, extractFormats, chooseFormat,
         getYoutubeVideoInfo, getYoutubePlaylistInfo, getYoutubeAudioData } from './utils';

const readFile = (path) => new Promise(resolve => {
  fs.readFile(path, (__, data) => resolve(data.toString()));
});

const mockFetch = (text) => {
  fetch = jest.fn().mockReturnValue(Promise.resolve({ ok: true, text: () => Promise.resolve(text) }));
}

it('parseYoutubeUrl', () => {
  let url = 'https://www.youtube.com/watch?v=GkNSbmv6QMQ';
  expect(parseYoutubeUrl(url)).toEqual({
    type: 'video',
    id: 'GkNSbmv6QMQ'
  });

  url = 'https://www.youtube.com/playlist?list=PL7sA_SkHX5ye2Q1BxeMA5SHZOtYJzBxkX';
  expect(parseYoutubeUrl(url)).toEqual({
    type: 'playlist',
    id: 'PL7sA_SkHX5ye2Q1BxeMA5SHZOtYJzBxkX'
  });
});

it('extractFormats', async () => {
  const text = await readFile('src/fixtures/video.html');
  const formats = extractFormats(text);
  expect(formats[0]).toEqual({
    "audioQuality": "AUDIO_QUALITY_LOW",
    "audioSampleRate": "44100",
    "bitrate": 738960,
    "contentLength": "5676880",
    "itag": 18,
    "mimeType": "video/mp4; codecs=\"avc1.42001E, mp4a.40.2\"",
    "quality": "medium",
    "qualityLabel": "360p",
    "url": "https://r3---sn-qxo7rn7l.googlevideo.com/videoplayback?expire=1566498769&ei=cYteXb7QL4mUwQHH9YaQAg&ip=35.187.132.150&id=o-ALn-WHid0mIV26zsZ8QQVNfG2Kq6qbfEJlgYH--Uhy_A&itag=18&source=youtube&requiressl=yes&mm=31%2C26&mn=sn-qxo7rn7l%2Csn-vgqsrnek&ms=au%2Conr&mv=m&mvi=2&pl=28&mime=video%2Fmp4&gir=yes&clen=5676880&ratebypass=yes&dur=61.509&lmt=1559771084114474&mt=1566477055&fvip=3&c=WEB&txp=5531432&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cmime%2Cgir%2Cclen%2Cratebypass%2Cdur%2Clmt&sig=ALgxI2wwRgIhAMzTeegiLotwiB9hC381RIVPpP3MKnH1TEfINVHM1N_gAiEA1BOYcYbVxZko8o7duVGgMCg7t1LNC0kW13CwhedVihA%3D&lsparams=mm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl&lsig=AHylml4wRQIhAP58TVpoX9BTVLz-gXu3-yqh25nalg70swkHL3lJLNfrAiACM_YW8EtRx1oZw9s9ezYQeW9mYNXHYSiX70aMg6LXhA%3D%3D",
  });
});

it('chooseFormat', async () => {
  const text = await readFile('src/fixtures/video.html');
  const format = chooseFormat(extractFormats(text));
  expect(_.pick(format, ['audioQuality', 'mimeType', 'quality'])).toEqual({
    "audioQuality": "AUDIO_QUALITY_MEDIUM",
    "mimeType": "audio/webm; codecs=\"opus\"",
    "quality": "tiny",
  });
});

it('getYoutubeVideoInfo', async () => {
  const text = await readFile('src/fixtures/video.html');
  mockFetch(text);

  const id = 'GkNSbmv6QMQ';
  return getYoutubeVideoInfo(id).then(data => {
    expect(data).toEqual({
      videoId: 'GkNSbmv6QMQ',
      title: 'Ты чувствуешь это?',
      author: 'o.sychewa'
    });
  })
});

it('getYoutubePlaylistInfo', async () => {
  const text = await readFile('src/fixtures/playlist.html');
  mockFetch(text);

  const id = 'PL7sA_SkHX5ye2Q1BxeMA5SHZOtYJzBxkX';
  return getYoutubePlaylistInfo(id).then(data => {
    expect(data).toEqual({
      name: 'Test',
      videos: [
        {
          videoId: 'uMtg4i5KEzw',
          title: 'А вы встречали на рассвете свою заветную мечту?',
          author: 'o.sychewa'
        }
      ]
    });
  })
});

it('getYoutubeAudioData', async () => {
  const id = 'GkNSbmv6QMQ';
  return getYoutubeAudioData(id).then(blob => {
    expect(blob.size).toEqual(947392);
    expect(blob).toBeInstanceOf(Blob);
  })
});

it('update', () => {
  const before = {
    arr: [
      {
        id: 0,
        innerArr: [{ id: 3, value: 'a'}]
      },
      {
        id: 1,
        innerArr: [{ id: 4, value: 'b' }, { id: 5, value: 'c' }]
      }
    ]
  };
  const op = {
    arr: {
      $find: {
        $query: { id: 1 },
        $op: {
          innerArr: {
            $find: {
              $query: { id: 4 },
              $op: { $merge: { value: 'UPDATED' } }
            }
          }
        }
      }
    }
  };
  const after = {
    arr: [
      {
        id: 0,
        innerArr: [{ id: 3, value: 'a' }]
      },
      {
        id: 1,
        innerArr: [{ id: 4, value: 'UPDATED' }, { id: 5, value: 'c' }]
      }
    ]
  }
  update.defineCustomQuery();
  expect(update(before, op)).toEqual(after);
});
