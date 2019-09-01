#!/bin/bash

case $1 in
  dev-bash)
    docker-compose up -d db_dev rails_dev
    docker-compose exec rails_dev bash
  ;;
  dev-start)
    docker-compose up -d db_dev rails_dev
    docker-compose exec rails_dev rails s -p 3030
  ;;
  gen-set-env-vars)
    cat > set-env-vars.yml <<GEN
--set-env-vars:
  RAILS_ENV: production
  RAILS_LOG_TO_STDOUT: 'true'
  DATABASE_URL: $(bash scripts.sh heroku db url)
  RAILS_MASTER_KEY: $(cat config/master.key)
GEN
  ;;
  show-set-env-vars)
    tail -4 set-env-vars.yml | ruby -ne 'puts $_.strip.split(": ").join("=")'
  ;;
  rails_prod)
    shift
    export $(bash scripts.sh show-set-env-vars loadable)
    docker-compose run --rm rails_prod "${@}"
  ;;
  native-gems)
    shift
    case $1 in
      # bash scripts.sh native-gems apk-rundeps > apk-rundeps.txt
      apk-rundeps)
        if ! test -f lib-apk.txt; then echo 'run "lib-apk" first'; exit 1; fi
        cat lib-apk.txt \
        | ruby -ne 'puts $_.chomp.split[1]' \
        | ruby -e 'puts STDIN.read.lines.uniq'
      ;;
      apk-builddeps)
        if ! test -f lib-apk.txt; then echo 'run "lib-apk" first'; exit 1; fi
        for PKG in $(bash scripts.sh native-gems apk-rundeps); do
          DEV_PKG=$(bash scripts.sh apk-get-subpackages $PKG 2>/dev/null 1| grep dev)
          printf "%s %s\n" $PKG $DEV_PKG
        done
      ;;
      # bash scripts.sh native-gems lib-apk > lib-apk.txt
      lib-apk)
        for LIB in $(bash scripts.sh native-gems lib-so); do
          bash scripts.sh apk-search-by-file $LIB \
          | xargs -I @ printf "$LIB @\n"
        done
      ;;
      lib-gem)
        for GEM in $(bash scripts.sh native-gems gem-so); do
          for LIB in $(ldd $GEM | ruby -ne 'puts $_.chomp.split[0]'); do
            printf "${LIB##*/}\t${GEM##*gems}\n"
          done
        done | ruby -e 'puts STDIN.read.lines.sort'
      ;;
      gem-lib)
        for GEM in $(bash scripts.sh native-gems gem-so); do
          for LIB in $(ldd $GEM | ruby -ne 'puts $_.chomp.split[0]'); do
            printf "${GEM##*gems}\t${LIB##*/}\n"
          done
        done | ruby -e 'puts STDIN.read.lines.sort'
      ;;
      lib-so)
        for GEM in $(bash scripts.sh native-gems gem-so); do
          for LIB in $(ldd $GEM | ruby -ne 'puts $_.chomp.split[0]'); do
            printf "${LIB##*/}\n"
          done
        done | ruby -e 'puts STDIN.read.lines.uniq'
      ;;
      gem-so)
        for DIR in $(bundle show --paths 2>/dev/null); do
          if test -d "${DIR}/ext"; then
            find "${DIR}/ext" -name '*.so'
          fi
        done
      ;;
      *) echo ":: Command [$@] not found." ;;
    esac
  ;;
  apk-search-by-file)
    shift
    NAME="${1}" # filename (e.g. libssl.so.1.1)
    BRANCH="v3.10"
    URL="https://pkgs.alpinelinux.org/contents?file=${NAME}&branch=${BRANCH}&arch=x86_64"
    nokogiri "${URL}" -e '@doc.css("tbody tr").map{ |tr| puts tr.css("td ~ td").map{ |td| td.text }.join(" ") }'
  ;;
  apk-get-subpackages)
    shift
    NAME="${1}" # package name (e.g. libssl1.1)
    BRANCH="v3.10"
    URL="https://pkgs.alpinelinux.org/package/${BRANCH}/main/x86_64/${NAME}"
    nokogiri "${URL}" -e 'puts @doc.css(".multi-fields details:last-child li").map(&:text)'
  ;;
  heroku)
    shift
    HEROKU_APP_NAME="yt-offline-rails-db-175028"
    case $1 in
      setup)
        heroku apps:create "${HEROKU_APP_NAME}" &&\
        heroku addons:create --app="${HEROKU_APP_NAME}" heroku-postgresql
      ;;
      cleanup)
        heroku apps:destroy "${HEROKU_APP_NAME}"
      ;;
      db)
        shift
        case $1 in
          check)
            bash scripts.sh rails_prod bundle exec rails runner 'ActiveRecord::Base.connection && puts("success")'
          ;;
          migrate)
            bash scripts.sh rails_prod bundle exec rails db:migrate
          ;;
          info)
            heroku pg:info --app="${HEROKU_APP_NAME}"
          ;;
          url)
            heroku config --app="${HEROKU_APP_NAME}" --json | jq -r '.DATABASE_URL'
          ;;
          *) echo ":: Command [$@] not found." ;;
        esac
      ;;
      *) echo ":: Command [$@] not found." ;;
    esac
  ;;
  *) echo ":: Command [$@] not found." ;;
esac
