Epiviz
======

Epiviz is a scientific information visualization tool for genetic and epigenetic data, used to aid in the exploration and understanding of correlations between various genome features.

For more information, visit - http://epiviz.github.io/

Using any PHP supported webserver
---------------------------------
Copy the Epiviz directory to the webserver configured directory. Navigate to <webserver-ip>/epiviz/index.php on your browser.

Using PHP
---------
PHP (http://php.net/) lets your run local webservers. Navigate to localhost:8181 on your browser.
To run epiviz use:
```
php.exe -S localhost:8181 -t <location of the epiviz directory>
```

Using Docker
-------------------

This repository includes a `Dockerfile` to run a webserver that serves
the epiviz web application. It includes a `site-settings.js` file that
sets up data backends pointing to the University of Maryland. Update
that file to use a different backend. It is registered in the DockerHub
registry: (https://hub.docker.com/r/epiviz/epiviz/)[https://hub.docker.com/r/epiviz/epiviz/].
To run it use:

```shell
docker pull epiviz/epiviz
docker run --name epiviz-app -d -p 80:80 epiviz/epiviz
```
