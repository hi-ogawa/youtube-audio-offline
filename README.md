Youtube Audio Offline

https://youtube-audio-offline.hiogawa.now.sh/

```
# Development
$ npm start

# Testing
$ npm test

# Deployment
$ npm run build:deploy
```


TODO

- Handle expired JWT
  - update token via /new_token
  - if unsuccessful, then prompt to re-login
- Show storage usage (`localforage.setItem` fails when db limit exceeded.)
- Download audio data sequentially (some queueing logic within redux state)
- Put all downloaded track into queue
- Eject create-react-app and setup hot-loader
- Setup create-react-app default service worker for offline
- Global error handling system via redux
- Organize client storage better
- Organize styling (especially a bunch of component within modal)
- Call-to-action when no tracks
- Gracefully stop/change tracks (i.e. no spiky noise)
- Streaming play


Secondary Objectives

- Play with create-react-app, yarn
- Play with apollo-client, graphql
- React, Redux and Typescript
- Storybook


Backend services

- Rails on CloudRun: https://github.com/hi-ogawa/youtube-audio-offline/tree/master/backend
- ExpressJS on ZeitNow (Amazon Lambda): https://github.com/hi-ogawa/toy-proxy


References

- https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
- https://zeit.co/docs/v2/advanced/configuration/
- https://github.com/zeit/now-cli/issues/622
