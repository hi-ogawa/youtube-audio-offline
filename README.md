Youtube Audio Offline

```
# Development
$ npm start

# Testing
$ npm test

# Deployment
$ npm run build:deploy
```

TODO

- Optional simple login system
  - zeit-now function + heroku postgres
  - just few apis:
    - POST /register: client (username, password) <-> server (success, failure, auth token)
    - POST /auth:     client (username, password) <-> server (success, failure, auth token)
    - GET  /data:     client (auth token, data) <-> server (username, data)
    - POST /data:     client (auth token, data) <-> server (username, data)
  - persisted data is just:
    - username, hashed_password, single json per user
- Download audio data sequentially (some queueing logic within redux state)
- Clear audio data and remove track
- show storage usage
- Call-to-action when no tracks
- Put all downloaded track into queue
- Streaming play
- Eject create-react-app and setup hot-loader
- Setup create-react-app default service worker for offline
- gracefully stop/change tracks (i.e. no spiky noise)
- Global error handling system via redux
- Organize client storage better
- Organize styling (especially a bunch of component within modal)


Secondary Objectives

- Play with create-react-app, yarn
- Play with apollo-client, graphql
- React, Redux and Typescript
- Storybook


References

- https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
- https://zeit.co/docs/v2/advanced/configuration/
- https://github.com/zeit/now-cli/issues/622
