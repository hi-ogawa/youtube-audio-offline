import _ from 'lodash';
import { fromEvent, merge } from 'rxjs';
import { first, timeout, map, throttleTime } from 'rxjs/operators';

// cf. https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
const EVENTS = [
  "audioprocess",
  "canplay",
  "canplaythrough",
  "complete",
  "durationchange",
  "emptied",
  "ended",
  "loadeddata",
  "loadedmetadata",
  "pause",
  "play",
  "playing",
  "ratechange",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "volumechange",
  "waiting"
];

const THROTTLED_EVENTS = [
  "timeupdate",
]

const ATTRIBUTES = [
  'readyState', // if readyState >= HAVE_CURRENT_DATA, then audio.play should work
  'paused',
  'ended',
  'error',
  'currentSrc',
  'currentTime',
  'duration',
  'playbackRate',
  'volume',
]

const { HAVE_CURRENT_DATA } = HTMLMediaElement;

// @returns Observable<{ type, state: {...ATTRIBUTES} }>
const fromAudioElement = (el, throttle) =>
  merge(
    ...EVENTS.map(type => fromEvent(el, type)),
    ...THROTTLED_EVENTS.map(type => fromEvent(el, type).pipe(throttleTime(throttle))),
  )
  .pipe(map(e => ({ type: e.type, state: _.pick(el, ATTRIBUTES) })));

class AudioManagerSingleton {
  initialize() {
    this.el = document.createElement('audio');
    document.body.append(this.el);
  }

  getState() {
    return _.pick(this.el, ATTRIBUTES);
  }

  getObservable(throttle) {
    return fromAudioElement(this.el, throttle);
  }

  // TODO: handle timeout error
  wait(eventName) {
    return new Promise((resolve, reject) => {
      // TODO; should dispose explicitly?
      fromEvent(this.el, eventName).pipe(
        first(),
        timeout(1000)
      ).subscribe(resolve, reject);
    });
  }

  async play() {
    console.assert(this.el.src);
    if (this.el.readyState >= HAVE_CURRENT_DATA) {
      this.el.play();
      await this.wait('play');
    } else {
      await this.wait('canplay');
      this.el.play();
      await this.wait('play');
    }
  }

  async pause() {
    this.el.pause();
    await this.wait('pause');
  }

  async seek(time) {
    this.el.currentTime = time;
    await this.wait('seeked');
  }

  reset() {
    this.el.pause();
    if (this.el.src) {
      URL.revokeObjectURL(this.el.src);
    }
    this.el.src = null;
  }

  setBlob(blob) {
    if (this.el.src) {
      // assert audio not running
      URL.revokeObjectURL(this.el.src);
    }
    this.currentBlob = blob;
    this.el.src = URL.createObjectURL(blob);
  }
}

export default new AudioManagerSingleton();
