FROM php:8.5-cli-alpine
RUN apk add --no-cache libpq && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS postgresql-dev && docker-php-ext-install pdo_pgsql && apk del .build-deps
WORKDIR /app
COPY report.php /app/report.php
USER nobody
CMD ["php", "/app/report.php"]
