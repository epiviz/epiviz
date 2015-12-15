FROM tutum/apache-php
MAINTAINER "Hector Corrada Bravo" hcorrada@gmail.com

RUN rm -fr /app
ADD . /app
