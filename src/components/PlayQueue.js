import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import CN from 'classnames';

import { useActions, useStatePath, selectors } from '../stateUtils';
import { formatTime, stopProp } from '../utils';

export default function PlayQueue() {
  const status = useStatePath('player.status');
  const currentIndex = useStatePath('player.currentIndex');
  const queuedTracks = useSelector(selectors.queuedTracks);
  const currentTrack = useSelector(selectors.currentTrack);

  const { unpause, pause, setCurrentTrackFromQueueByIndex,
          removeTrackFromQueueByIndex, moveCurrentTrack } = useActions();

  return (
    <div id='play-queue-container'>
      <div className='header'>Playback Queue</div>
      <div className='list'>
        { queuedTracks.map((track, index) =>
            <div
              key={`${index}-${track.id}`}
              className={CN({ current: index === currentIndex})}
              onClick={() => setCurrentTrackFromQueueByIndex(index)}
            >
              <div>
                <div>{ track.title }</div>
                <div>{ track.author }</div>
              </div>
              <div onClick={stopProp(() => removeTrackFromQueueByIndex(index))}>
                <i className='material-icons'>close</i>
              </div>
            </div>
        )}
      </div>

      <div className='player-control'>
        <div className='buttons'>
          <div disabled>
            {/* repeat_one */}
            <i className='material-icons'>repeat</i>
          </div>
          <div
            onClick={() => moveCurrentTrack(-1)}
            disabled={queuedTracks.length <= 1}
          >
            <i className='material-icons'>skip_previous</i>
          </div>
          <div
            onClick={() => status === 'PLAYING' ? pause() : unpause()}
            disabled={!currentTrack}
          >
            <i className='material-icons'>
              { status === 'PLAYING' ? 'pause' : 'play_arrow' }
            </i>
          </div>
          <div
            onClick={() => moveCurrentTrack(+1)}
            disabled={queuedTracks.length <= 1}
          >
            <i className='material-icons'>skip_next</i>
          </div>
          <div disabled>
            <i className='material-icons'>shuffle</i>
          </div>
        </div>

        <SeekSliderWrapper />
      </div>
    </div>
  );
}

function SeekSliderWrapper() {
  const value = useStatePath('player.currentTime');
  const end = useStatePath('player.duration');
  const { seek } = useActions();

  const props = {
    begin: 0,
    end: end || 0,
    value: value || 0,
    format: formatTime,
    fraction2value: (frac, __, e) => e * frac,
    value2fraction: (v, __, e) => e === 0 ? 0 : v / e,
    onSeek: seek,
  };

  return <SeekSlider {...props} />;
}


// The "value" has sort of "uncontrolled"-ness, i.e. prop update will be ignored during:
// - dragging
// - onSeek promise is resolving
function SeekSlider({ begin, end, value, format, fraction2value, value2fraction, onSeek }) {
  const draggingDisabled = begin === end;
  const propFraction = value2fraction(value, begin, end);
  const [fraction, setFraction] = useState(propFraction);
  const [dragging, setDragging] = useState(false);
  const trackNodeRef = useRef(null);
  const propFractionRef = useRef(propFraction);
  const lastTouchEventRef = useRef(null); // cf. handleDrag with e.type === 'touchend'

  if (!dragging && propFractionRef.current !== propFraction) {
    propFractionRef.current = propFraction;
    setFraction(propFraction);
  }

  const handleDrag = (e) => {
    e.stopPropagation();

    // Not so bad translation from TouchEvent to DragEvent
    // - Keep last touch event because there's no UI infomation at the time of 'touchend'
    // - Mutating type seems alright in this case
    if (e.type.startsWith('touch')) {
      if (e.type === 'touchstart') {
        e = e.touches[0];
        e.type = 'dragstart';
      }
      if (e.type === 'touchmove') {
        e = e.touches[0];
        e.type = 'dragmove';
        lastTouchEventRef.current = e;
      }
      if (e.type === 'touchend') {
        e = lastTouchEventRef.current;
        e.type = 'dragend';
      }
    }

    if (draggingDisabled) { return; }

    // Ignore some anomally (?)
    if (e.clientX === 0) { return;}

    const { left, right } = trackNodeRef.current.getClientRects()[0];
    const position =
      e.clientX <= left
      ? left
      : right <= e.clientX
        ? right
        : e.clientX;
    const newFraction = (position - left) / (right - left);
    setFraction(newFraction);

    // TODO: feels there can be doubly firing event?
    if (e.type === 'dragstart' || e.type === 'mousedown') {
      setDragging(true);
    }
    if (e.type === 'dragend' || e.type === 'mouseup') {
      onSeek(fraction2value(newFraction, begin, end))
      .then(() => setDragging(false));
    }
  }

  const unsetDragImage = (e) => {
    e.stopPropagation();
    e.dataTransfer && e.dataTransfer.setDragImage(new Image(), 0, 0);
  }

  return (
    <div className='seek-slider'>
      <div className='seek-slider__value'>{ format(fraction2value(fraction, begin, end)) }</div>
      <div className='seek-slider__track'
        ref={trackNodeRef}
        onMouseDown={handleDrag}
        onMouseUp={handleDrag}
      >
        <div
          className='seek-slider__track-hightlight'
          style={{ width: `${fraction * 100}%`}}
        ></div>
        <div
          className='seek-slider__thumb'
          style={{ left: `${fraction * 100}%`}}
          draggable={!draggingDisabled}
          onDragStart={(e) => { unsetDragImage(e); handleDrag(e); }}
          onDrag={handleDrag}
          onDragEnd={handleDrag}
          onTouchStart={handleDrag}
          onTouchMove={handleDrag}
          onTouchEnd={handleDrag}
        ></div>
      </div>
      <div className='seek-slider__end'>{ format(end) }</div>
    </div>
  );
}
