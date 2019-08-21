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
    this.audioEl = document.createElement('audio');
    document.body.append(this.audioEl);

    // Log all events (for development/debugging
    // this.events = [];
    // EVENTS.forEach(eventName =>
    //   this.audioEl.addEventListener(eventName, () =>
    //     console.log(this.events) || this.events.push(eventName)
    //   )
    // );
  }

  addEventListener() {
    this.audioEl.addEventListener(...arguments);
  }

  async wait(eventName) {
    let unsubscribe;
    await new Promise(resolve => {
      unsubscribe = this.audioEl.addEventListener(eventName, resolve);
    }).then(unsubscribe);
  }

  async play() {
    console.assert(this.audioEl.src);
    if (this.audioEl.readyState >= HAVE_CURRENT_DATA) {
      this.audioEl.play();
      await this.wait('play');
    } else {
      await this.wait('canplay');
      this.audioEl.play();
      await this.wait('play');
    }
  }

  async pause() {
    this.audioEl.pause();
    await this.wait('pause');
  }

  async seek(time) {
    this.audioEl.fastseek(time);
    await this.wait('seeked');
  }

  setBlob(blob) {
    if (this.audioEl.src) {
      URL.revokeObjectURL(this.audioEl.src);
    }
    this.currentBlob = blob;
    this.audioEl.src = URL.createObjectURL(blob);
  }
}

export default new AudioManagerSingleton();
