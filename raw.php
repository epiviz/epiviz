<?php

if (array_key_exists('url', $_REQUEST) && filter_var($_REQUEST['url'], FILTER_VALIDATE_URL)) {
  header('Content-type: application/javascript');
  readfile($_REQUEST['url']);
}
