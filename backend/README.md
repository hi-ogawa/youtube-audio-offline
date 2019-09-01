Convenient scripts

```
# Development within container
$ bash scripts.sh dev-bash

# Deployment
$ bash scripts.sh heroku setup
$ bash scripts.sh gen-set-env-vars
$ bash run.sh deploy               # cf. https://github.com/hi-ogawa/cloud-run-script
$ bash scripts.sh heroku db migrate

# Logging
$ bash run.sh request        # google's reverse proxy log
$ bash run.sh logs | less -R # application log
```

Container images size

```
$ docker images | grep backend_
backend_rails_prod                     latest              cd979701acfb        15 minutes ago      111MB
backend_rails_dev                      latest              244566e448df        3 hours ago         194MB
backend_rails_prod_builder             latest              1a9fbe209881        9 hours ago         286MB

$ docker history backend_rails_prod
IMAGE               CREATED             CREATED BY                                      SIZE                COMMENT
cd979701acfb        17 minutes ago      /bin/sh -c #(nop)  CMD ["/bin/sh" "-c" "bund…   0B
e0c0290bcf57        17 minutes ago      /bin/sh -c #(nop) COPY dir:23de38c89ae9beba6…   38.5kB
5b0b036dd89b        17 minutes ago      /bin/sh -c #(nop) COPY dir:d252abcfe09d90d0e…   52.2MB
3408c0df5e80        3 hours ago         /bin/sh -c #(nop) COPY file:2f34a6e5afb24904…   90B
8bf8d7c4317c        3 hours ago         /bin/sh -c #(nop) WORKDIR /app                  0B
67e07591a6c2        3 hours ago         /bin/sh -c apk add --no-cache libc6-compat g…   6.37MB
8c8ee5bdfbb4        11 hours ago        /bin/sh -c gem install bundler --no-document…   1.78MB
3469fbf16d68        11 hours ago        /bin/sh -c #(nop)  ENV BUNDLER_VERSION=2.0.2    0B
43d83f132738        3 days ago          /bin/sh -c #(nop)  CMD ["irb"]                  0B
<missing>           3 days ago          /bin/sh -c mkdir -p "$GEM_HOME" && chmod 777…   0B
<missing>           3 days ago          /bin/sh -c #(nop)  ENV PATH=/usr/local/bundl…   0B
<missing>           3 days ago          /bin/sh -c #(nop)  ENV BUNDLE_PATH=/usr/loca…   0B
<missing>           3 days ago          /bin/sh -c #(nop)  ENV GEM_HOME=/usr/local/b…   0B
<missing>           3 days ago          /bin/sh -c set -eux;   apk add --no-cache --…   42MB
<missing>           3 days ago          /bin/sh -c #(nop)  ENV RUBY_DOWNLOAD_SHA256=…   0B
<missing>           3 days ago          /bin/sh -c #(nop)  ENV RUBY_VERSION=2.6.4       0B
<missing>           11 days ago         /bin/sh -c #(nop)  ENV RUBY_MAJOR=2.6           0B
<missing>           11 days ago         /bin/sh -c set -eux;  mkdir -p /usr/local/et…   45B
<missing>           11 days ago         /bin/sh -c apk add --no-cache   gmp-dev         3.4MB
<missing>           11 days ago         /bin/sh -c #(nop)  CMD ["/bin/sh"]              0B
<missing>           11 days ago         /bin/sh -c #(nop) ADD file:fe64057fbb83dccb9…   5.58MB
```
