###################
### development ###
###################
FROM ruby:2.6.4-alpine3.10 as development

# 1. Align bundler version
ENV BUNDLER_VERSION='2.0.2'
RUN gem install bundler --no-document -v '2.0.2'

# 2. Install run/build-deps (cf. script.sh native-gems apk-builddeps)
RUN apk add --no-cache \
libc6-compat musl-dev \
gmp gmp-dev \
gcompat \
xz-libs xz-dev \
zlib zlib-dev \
libpq postgresql-dev \
libssl1.1 openssl-dev \
libcrypto1.1 openssl-dev \
krb5-libs krb5-dev \
libldap openldap-dev \
libcom_err e2fsprogs-dev \
keyutils-libs keyutils-dev \
libsasl cyrus-sasl-dev

# 2.1. non-native gem dependency
RUN apk add --no-cache tzdata

# 3. Install build tools
RUN apk add --no-cache gcc make

# 4. Some dev convenience
RUN apk add --no-cache less bash


###############
### builder ###
###############
FROM ruby:2.6.4-alpine3.10 as builder

# 1,2,3,4. These steps are identical to "development"
ENV BUNDLER_VERSION='2.0.2'
RUN gem install bundler --no-document -v '2.0.2'
RUN apk add --no-cache \
libc6-compat musl-dev \
gmp gmp-dev \
gcompat \
xz-libs xz-dev \
zlib zlib-dev \
libpq postgresql-dev \
libssl1.1 openssl-dev \
libcrypto1.1 openssl-dev \
krb5-libs krb5-dev \
libldap openldap-dev \
libcom_err e2fsprogs-dev \
keyutils-libs keyutils-dev \
libsasl cyrus-sasl-dev
RUN apk add --no-cache tzdata
RUN apk add --no-cache gcc make
RUN apk add --no-cache less bash

# 5. Install gems under "vendor/bundle"
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --deployment --without development test

# 5.1. Remove unnecessary cache (save about 13.2M)
RUN rm -r ./vendor/bundle/ruby/2.6.0/cache

# 5.2. Print out bundle configuration for debugging
RUN bundle config


##################
### production ###
##################
FROM ruby:2.6.4-alpine3.10 as production

# 1. Align bundler version
ENV BUNDLER_VERSION='2.0.2'
RUN gem install bundler --no-document -v '2.0.2'

# 2. Install only rundeps + tzdata (cf. script.sh native-gems apk-rundeps)
RUN apk add --no-cache \
libc6-compat \
gmp \
gcompat \
xz-libs \
zlib \
libpq \
libssl1.1 \
libcrypto1.1 \
krb5-libs \
libldap \
libcom_err \
keyutils-libs \
libsasl \
tzdata

# 3. Copy gem files from builder
WORKDIR /app
COPY --from=builder /usr/local/bundle/config /usr/local/bundle/config
COPY --from=builder /app/vendor/bundle /app/vendor/bundle

# 4. Copy application files
COPY . .

# 5. Start application
CMD bundle exec rails s -b 0.0.0.0
