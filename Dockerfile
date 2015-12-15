FROM tutum/apache-php

RUN rm -fr /app
ADD . /app
