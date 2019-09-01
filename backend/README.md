- Usual operations

```
# Development within container
$ bash scripts.sh dev-bash

# Deployment
$ bash scripts.sh gen-set-env-vars
$ bash run.sh deploy               # cf. https://github.com/hi-ogawa/cloud-run-script
$ bash scripts.sh heroku db migrate

# Logging
$ bash run.sh logs request # Google's reverse proxy log
$ bash run.sh logs tail    # application log
```

- Container images size

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

- Some convenient scripts to figure out necessary Alpine Packages to run Rails app
  - You'll try these scripts in "non-slim" image or your bare machine where
    it succeeded to build native gems already.
  - In my case here, these scripts are run in archlinux with rbenv.

```
# List shared library (.so) used in gems
$ bash scripts.sh native-gems gem-so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/bcrypt-3.1.13/ext/mri/bcrypt_ext.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/bootsnap-1.4.5/ext/bootsnap/bootsnap.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/byebug-11.0.1/ext/byebug/byebug.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/ffi-1.11.1/ext/ffi_c/ffi_c.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/msgpack-1.3.1/ext/msgpack/msgpack.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/nio4r-2.5.1/ext/nio4r/nio4r_ext.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/nokogiri-1.10.4/ext/nokogiri/nokogiri.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/pg-1.1.4/ext/pg_ext.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/puma-3.12.1/ext/puma_http11/puma_http11.so
/home/hiogawa/code/others/rbenv/versions/2.6.4/lib/ruby/gems/2.6.0/gems/websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so

# Run "ldd" to each gem's .so file
$ bash scripts.sh native-gems gem-lib
/bcrypt-3.1.13/ext/mri/bcrypt_ext.so    ld-musl-x86_64.so.1
/bcrypt-3.1.13/ext/mri/bcrypt_ext.so    libc.musl-x86_64.so.1
/bcrypt-3.1.13/ext/mri/bcrypt_ext.so    libgmp.so.10
/bcrypt-3.1.13/ext/mri/bcrypt_ext.so    libruby.so.2.6
/bcrypt-3.1.13/ext/mri/bcrypt_ext.so    libz.so.1
/bootsnap-1.4.5/ext/bootsnap/bootsnap.so        ld-musl-x86_64.so.1
/bootsnap-1.4.5/ext/bootsnap/bootsnap.so        libc.musl-x86_64.so.1
/bootsnap-1.4.5/ext/bootsnap/bootsnap.so        libgmp.so.10
/bootsnap-1.4.5/ext/bootsnap/bootsnap.so        libruby.so.2.6
/bootsnap-1.4.5/ext/bootsnap/bootsnap.so        libz.so.1
/byebug-11.0.1/ext/byebug/byebug.so     ld-musl-x86_64.so.1
/byebug-11.0.1/ext/byebug/byebug.so     libc.musl-x86_64.so.1
/byebug-11.0.1/ext/byebug/byebug.so     libgmp.so.10
/byebug-11.0.1/ext/byebug/byebug.so     libruby.so.2.6
/byebug-11.0.1/ext/byebug/byebug.so     libz.so.1
/ffi-1.11.1/ext/ffi_c/ffi_c.so  ld-musl-x86_64.so.1
/ffi-1.11.1/ext/ffi_c/ffi_c.so  libc.musl-x86_64.so.1
/ffi-1.11.1/ext/ffi_c/ffi_c.so  libffi.so.6
/ffi-1.11.1/ext/ffi_c/ffi_c.so  libgmp.so.10
/ffi-1.11.1/ext/ffi_c/ffi_c.so  libruby.so.2.6
/ffi-1.11.1/ext/ffi_c/ffi_c.so  libz.so.1
/msgpack-1.3.1/ext/msgpack/msgpack.so   ld-musl-x86_64.so.1
/msgpack-1.3.1/ext/msgpack/msgpack.so   libc.musl-x86_64.so.1
/msgpack-1.3.1/ext/msgpack/msgpack.so   libgmp.so.10
/msgpack-1.3.1/ext/msgpack/msgpack.so   libruby.so.2.6
/msgpack-1.3.1/ext/msgpack/msgpack.so   libz.so.1
/nio4r-2.5.1/ext/nio4r/nio4r_ext.so     ld-musl-x86_64.so.1
/nio4r-2.5.1/ext/nio4r/nio4r_ext.so     libc.musl-x86_64.so.1
/nio4r-2.5.1/ext/nio4r/nio4r_ext.so     libgmp.so.10
/nio4r-2.5.1/ext/nio4r/nio4r_ext.so     libruby.so.2.6
/nio4r-2.5.1/ext/nio4r/nio4r_ext.so     libz.so.1
/nokogiri-1.10.4/ext/nokogiri/nokogiri.so       ld-musl-x86_64.so.1
/nokogiri-1.10.4/ext/nokogiri/nokogiri.so       libc.musl-x86_64.so.1
/nokogiri-1.10.4/ext/nokogiri/nokogiri.so       libgmp.so.10
/nokogiri-1.10.4/ext/nokogiri/nokogiri.so       liblzma.so.5
/nokogiri-1.10.4/ext/nokogiri/nokogiri.so       libruby.so.2.6
/nokogiri-1.10.4/ext/nokogiri/nokogiri.so       libz.so.1
/pg-1.1.4/ext/pg_ext.so ld-musl-x86_64.so.1
/pg-1.1.4/ext/pg_ext.so libc.musl-x86_64.so.1
/pg-1.1.4/ext/pg_ext.so libcrypto.so.1.1
/pg-1.1.4/ext/pg_ext.so libgmp.so.10
/pg-1.1.4/ext/pg_ext.so liblber-2.4.so.2
/pg-1.1.4/ext/pg_ext.so libldap_r-2.4.so.2
/pg-1.1.4/ext/pg_ext.so libpq.so.5
/pg-1.1.4/ext/pg_ext.so libruby.so.2.6
/pg-1.1.4/ext/pg_ext.so libsasl2.so.3
/pg-1.1.4/ext/pg_ext.so libssl.so.1.1
/pg-1.1.4/ext/pg_ext.so libz.so.1
/puma-3.12.1/ext/puma_http11/puma_http11.so     ld-musl-x86_64.so.1
/puma-3.12.1/ext/puma_http11/puma_http11.so     libc.musl-x86_64.so.1
/puma-3.12.1/ext/puma_http11/puma_http11.so     libcrypto.so.1.1
/puma-3.12.1/ext/puma_http11/puma_http11.so     libgmp.so.10
/puma-3.12.1/ext/puma_http11/puma_http11.so     libruby.so.2.6
/puma-3.12.1/ext/puma_http11/puma_http11.so     libssl.so.1.1
/puma-3.12.1/ext/puma_http11/puma_http11.so     libz.so.1
/websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so  ld-musl-x86_64.so.1
/websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so  libc.musl-x86_64.so.1
/websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so  libgmp.so.10
/websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so  libruby.so.2.6
/websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so  libz.so.1

# Reversed map of above command
$ bash scripts.sh native-gems lib-gem
ld-linux-x86-64.so.2    /bcrypt-3.1.13/ext/mri/bcrypt_ext.so
ld-linux-x86-64.so.2    /bootsnap-1.4.5/ext/bootsnap/bootsnap.so
ld-linux-x86-64.so.2    /byebug-11.0.1/ext/byebug/byebug.so
ld-linux-x86-64.so.2    /ffi-1.11.1/ext/ffi_c/ffi_c.so
ld-linux-x86-64.so.2    /msgpack-1.3.1/ext/msgpack/msgpack.so
ld-linux-x86-64.so.2    /nio4r-2.5.1/ext/nio4r/nio4r_ext.so
ld-linux-x86-64.so.2    /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
ld-linux-x86-64.so.2    /pg-1.1.4/ext/pg_ext.so
ld-linux-x86-64.so.2    /puma-3.12.1/ext/puma_http11/puma_http11.so
ld-linux-x86-64.so.2    /websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so
libc.so.6       /bcrypt-3.1.13/ext/mri/bcrypt_ext.so
libc.so.6       /bootsnap-1.4.5/ext/bootsnap/bootsnap.so
libc.so.6       /byebug-11.0.1/ext/byebug/byebug.so
libc.so.6       /ffi-1.11.1/ext/ffi_c/ffi_c.so
libc.so.6       /msgpack-1.3.1/ext/msgpack/msgpack.so
libc.so.6       /nio4r-2.5.1/ext/nio4r/nio4r_ext.so
libc.so.6       /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
libc.so.6       /pg-1.1.4/ext/pg_ext.so
libc.so.6       /puma-3.12.1/ext/puma_http11/puma_http11.so
libc.so.6       /websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so
libcom_err.so.2 /pg-1.1.4/ext/pg_ext.so
libcrypto.so.1.1        /pg-1.1.4/ext/pg_ext.so
libcrypto.so.1.1        /puma-3.12.1/ext/puma_http11/puma_http11.so
libdl.so.2      /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
libdl.so.2      /pg-1.1.4/ext/pg_ext.so
libdl.so.2      /puma-3.12.1/ext/puma_http11/puma_http11.so
libffi.so.6     /ffi-1.11.1/ext/ffi_c/ffi_c.so
libgssapi_krb5.so.2     /pg-1.1.4/ext/pg_ext.so
libk5crypto.so.3        /pg-1.1.4/ext/pg_ext.so
libkeyutils.so.1        /pg-1.1.4/ext/pg_ext.so
libkrb5.so.3    /pg-1.1.4/ext/pg_ext.so
libkrb5support.so.0     /pg-1.1.4/ext/pg_ext.so
liblber-2.4.so.2        /pg-1.1.4/ext/pg_ext.so
libldap_r-2.4.so.2      /pg-1.1.4/ext/pg_ext.so
liblzma.so.5    /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
libm.so.6       /bcrypt-3.1.13/ext/mri/bcrypt_ext.so
libm.so.6       /bootsnap-1.4.5/ext/bootsnap/bootsnap.so
libm.so.6       /byebug-11.0.1/ext/byebug/byebug.so
libm.so.6       /ffi-1.11.1/ext/ffi_c/ffi_c.so
libm.so.6       /msgpack-1.3.1/ext/msgpack/msgpack.so
libm.so.6       /nio4r-2.5.1/ext/nio4r/nio4r_ext.so
libm.so.6       /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
libm.so.6       /pg-1.1.4/ext/pg_ext.so
libm.so.6       /puma-3.12.1/ext/puma_http11/puma_http11.so
libm.so.6       /websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so
libpq.so.5      /pg-1.1.4/ext/pg_ext.so
libpthread.so.0 /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
libpthread.so.0 /pg-1.1.4/ext/pg_ext.so
libpthread.so.0 /puma-3.12.1/ext/puma_http11/puma_http11.so
libresolv.so.2  /pg-1.1.4/ext/pg_ext.so
libsasl2.so.3   /pg-1.1.4/ext/pg_ext.so
libssl.so.1.1   /pg-1.1.4/ext/pg_ext.so
libssl.so.1.1   /puma-3.12.1/ext/puma_http11/puma_http11.so
libz.so.1       /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
linux-vdso.so.1 /bcrypt-3.1.13/ext/mri/bcrypt_ext.so
linux-vdso.so.1 /bootsnap-1.4.5/ext/bootsnap/bootsnap.so
linux-vdso.so.1 /byebug-11.0.1/ext/byebug/byebug.so
linux-vdso.so.1 /ffi-1.11.1/ext/ffi_c/ffi_c.so
linux-vdso.so.1 /msgpack-1.3.1/ext/msgpack/msgpack.so
linux-vdso.so.1 /nio4r-2.5.1/ext/nio4r/nio4r_ext.so
linux-vdso.so.1 /nokogiri-1.10.4/ext/nokogiri/nokogiri.so
linux-vdso.so.1 /pg-1.1.4/ext/pg_ext.so
linux-vdso.so.1 /puma-3.12.1/ext/puma_http11/puma_http11.so
linux-vdso.so.1 /websocket-driver-0.7.1/ext/websocket-driver/websocket_mask.so

# Search Alpine package which includes shared library by scraping https://pkgs.alpinelinux.org/contents
$ bash scripts.sh native-gems lib-apk
libm.so.6 libc6-compat v3.10 main x86_64
libc.so.6 libc6-compat v3.10 main x86_64
ld-linux-x86-64.so.2 gcompat v3.10 community x86_64
ld-linux-x86-64.so.2 libc6-compat v3.10 main x86_64
libffi.so.6 libffi v3.10 main x86_64
liblzma.so.5 xz-libs v3.10 main x86_64
libz.so.1 zlib v3.10 main x86_64
libpthread.so.0 libc6-compat v3.10 main x86_64
libpq.so.5 libpq v3.10 main x86_64
libssl.so.1.1 libssl1.1 v3.10 main x86_64
libssl.so.1.1 libssl1.1 v3.10 main x86_64
libcrypto.so.1.1 libcrypto1.1 v3.10 main x86_64
libcrypto.so.1.1 libcrypto1.1 v3.10 main x86_64
libgssapi_krb5.so.2 krb5-libs v3.10 main x86_64
libldap_r-2.4.so.2 libldap v3.10 main x86_64
libkrb5.so.3 krb5-libs v3.10 main x86_64
libk5crypto.so.3 krb5-libs v3.10 main x86_64
libcom_err.so.2 libcom_err v3.10 main x86_64
libkrb5support.so.0 krb5-libs v3.10 main x86_64
libkeyutils.so.1 keyutils-libs v3.10 main x86_64
liblber-2.4.so.2 libldap v3.10 main x86_64
libsasl2.so.3 libsasl v3.10 main x86_64

# List unique Alpine packages from above command
$ bash scripts.sh native-gems lib-apk > lib-apk.txt
$ bash scripts.sh native-gems apk-rundeps
libc6-compat
gmp
gcompat
xz-libs
zlib
libpq
libssl1.1
libcrypto1.1
krb5-libs
libldap
libcom_err
keyutils-libs
libsasl

# List "dev" version package of above runtime packages by scraping https://pkgs.alpinelinux.org/package
$ bash scripts.sh native-gems lib-apk > lib-apk.txt
$ bash scripts.sh native-gems apk-builddeps
libc6-compat musl-dev
gmp gmp-dev
gcompat
xz-libs xz-dev
zlib zlib-dev
libpq postgresql-dev
libssl1.1 openssl-dev
libcrypto1.1 openssl-dev
krb5-libs krb5-dev
libldap openldap-dev
libcom_err e2fsprogs-dev
keyutils-libs keyutils-dev
libsasl cyrus-sasl-dev
```
