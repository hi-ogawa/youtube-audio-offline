import React from 'react';
import gql from 'graphql-tag';
import { useGQL } from '../stateUtils';

const Q1 = gql`{
  player {
    audioUrl
    currentIndex
  }
  queuedTracks {
    title, author
  }
}`;

export default function Player() {
  const { player: { audioUrl, currentIndex }, queuedTracks } = useGQL(Q1);
  const currentTrack = queuedTracks[currentIndex];
  // pause, repeat_one, repeat, shuffle, skip_next, skip_previous,

  return (
    <div id='player'>
      {/* <audio src={currentTrack ? audioUrl : ''} controls></audio> */}
    </div>
  );
}
