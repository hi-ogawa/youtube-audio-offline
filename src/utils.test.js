import { update, parseYoutubeUrl, getYoutubeVideoInfo, getYoutubePlaylistInfo, getAudioData } from './utils';

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

it('getYoutubeVideoInfo', () => {
  const id = 'GkNSbmv6QMQ';
  return getYoutubeVideoInfo(id).then(data => {
    expect(data).toEqual({
      videoId: 'GkNSbmv6QMQ',
      title: 'Ты чувствуешь это?',
      author: 'o.sychewa'
    });
  })
});

it('getYoutubePlaylistInfo', () => {
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

it('getAudioData', () => {
  // return getAudioData('GkNSbmv6QMQ').then(data => {
  // });
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
        query: { id: 1 },
        op: {
          innerArr: {
            $find: {
              query: { id: 4 },
              op: { $merge: { value: 'UPDATED' } }
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
  expect(update(before, op)).toEqual(after);
});
