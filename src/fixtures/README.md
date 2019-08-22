Generate fixtures

```
$ PROXY_PREFIX='https://script.google.com/macros/s/AKfycbwlRhtH1THiHcTY0hbZtcMd1K_ucndHfa-8iugHJMgaKjDY2HqoJbMAACMIITNeMNpZ/exec?url='
$ curl -L "${PROXY_PREFIX}https://www.youtube.com/watch?v=GkNSbmv6QMQ" > src/fixtures/video.html
$ curl -L "${PROXY_PREFIX}https://www.youtube.com/playlist?list=PL7sA_SkHX5ye2Q1BxeMA5SHZOtYJzBxkX" > src/fixtures/playlist.html
```
