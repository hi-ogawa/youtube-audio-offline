import { fromEvent } from 'rxjs';
import { first, timeout } from 'rxjs/operators';

const EVENTS = [ // eslint-disable-line no-unused-vars
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
  "timeupdate",
  "volumechange",
  "waiting"
];

const ATTRIBUTES = [ // eslint-disable-line no-unused-vars
  'readyState', // if readyState >= HAVE_CURRENT_DATA, then audio.play should work
  'ended',
  'error',
  'duration',
  'currentTime',
  'currentSrc',
  'volume',
]

const { HAVE_CURRENT_DATA } = HTMLMediaElement;

class AudioManagerSingleton {
  initialize() {
    this.el = document.createElement('audio');
    document.body.append(this.el);

    // Log all events (for development/debugging
    // this.events = [];
    // EVENTS.forEach(eventName =>
    //   this.el.addEventListener(eventName, () =>
    //     console.log(this.events) || this.events.push(eventName)
    //   )
    // );
  }

  wait(eventName) {
    return new Promise((resolve, reject) => {
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
    this.el.fastseek(time);
    await this.wait('seeked');
  }

  setBlob(blob) {
    if (this.el.src) {
      URL.revokeObjectURL(this.el.src);
    }
    this.currentBlob = blob;
    this.el.src = URL.createObjectURL(blob);
  }
}

export default new AudioManagerSingleton();
