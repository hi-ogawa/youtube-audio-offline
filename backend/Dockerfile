### development ###
FROM alpine:3.10.2 as development

RUN apk add --no-cache less bash
RUN apk add --no-cache ruby

# cf. script.sh native_gems
# bcrypt:3.1.13          =>
# bootsnap:1.4.4         =>
# byebug:11.0.1          =>
# concurrent-ruby:1.1.5  =>
# ffi:1.11.1             =>
# msgpack:1.3.1          =>
# nio4r:2.4.0            =>
# nokogiri:1.10.3        =>
# pg:1.1.4               =>
# puma:3.12.1            =>
# rb-fsevent:0.10.3      =>
# thread_safe:0.3.6      =>
# websocket-driver:0.7.1 =>


### builder ###
FROM alpine:3.10.2 as builder

# RUN install runtime dep
# RUN install build dep

WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --deployment


### production ###
FROM alpine:3.10.2 as production

# RUN install runtime dep

WORKDIR /app
COPY --from=builder /app/vendor /app/vendor

CMD bundle exec rails s -b 0.0.0.0
