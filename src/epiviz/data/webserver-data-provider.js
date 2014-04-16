/**
 * Created by: Florin Chelaru
 * Date: 10/2/13
 * Time: 11:20 AM
 */

goog.provide('epiviz.data.WebServerDataProvider');

/**
 * @param {string} [id]
 * @param {string} [serverEndpoint]
 * @constructor
 * @extends epiviz.data.DataProvider
 */
epiviz.data.WebServerDataProvider = function(id, serverEndpoint) {
  epiviz.data.DataProvider.call(this, id || epiviz.data.WebServerDataProvider.DEFAULT_ID);

  /**
   * @type {string}
   * @private
   */
  this._serverEndpoint = serverEndpoint || epiviz.data.WebServerDataProvider.DEFAULT_SERVER_ENDPOINT;
};

/**
 * Copy methods from upper class
 */
epiviz.data.WebServerDataProvider.prototype = epiviz.utils.mapCopy(epiviz.data.DataProvider.prototype);
epiviz.data.WebServerDataProvider.constructor = epiviz.data.WebServerDataProvider;

epiviz.data.WebServerDataProvider.DEFAULT_ID = 'umd';

/**
 * @constant
 * @type {string}
 */
epiviz.data.WebServerDataProvider.DEFAULT_SERVER_ENDPOINT = 'data/main.php';

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response.<*>)} callback
 */
epiviz.data.WebServerDataProvider.prototype.getData = function(request, callback) {
  if (request.isEmpty()) { return; }

  if (request.method() == epiviz.data.Request.Method.GET) {
    var query = sprintf('%s?%s', this._serverEndpoint, request.joinArgs());

    epiviz.data.WebServerDataProvider.makeGetRequest(query, function(jsondata) {
      callback(epiviz.data.Response.fromRawObject(jsondata));
    });
  } else {
    epiviz.data.WebServerDataProvider.makePostRequest(this._serverEndpoint, request.joinArgs(), function(jsondata) {
      callback(epiviz.data.Response.fromRawObject(jsondata));
    });
  }
};

/**
 *
 * @param query
 * @param callback
 */
epiviz.data.WebServerDataProvider.makeGetRequest = function(query, callback) {
  var request = $.ajax({
    type: "get",
    url: query,
    dataType: "json",
    async: true,
    cache: false,
    processData: true
  });

  // callback handler that will be called on success
  request.done(function (jsonData){
    callback(jsonData);
  });

  // callback handler that will be called on failure
  request.fail(function (jqXHR, textStatus, errorThrown){
    //console.error("The following error occured: " + textStatus, errorThrown);
  });

  // callback handler that will be called regardless
  // if the request failed or succeeded
  request.always(function () {});
};

epiviz.data.WebServerDataProvider.makePostRequest = function(query, postData, callback) {
  var request = $.ajax({
    type: "post",
    url: query,
    data: postData,
    dataType: "json",
    async: true,
    cache: false,
    processData: true
  });

  // callback handler that will be called on success
  request.done(function (data, textStatus, jqXHR){
    callback(data);
  });

  // callback handler that will be called on failure
  request.fail(function (jqXHR, textStatus, errorThrown){
    console.error("The following error occured: " + textStatus, errorThrown);
    $('#php-response').append(jqXHR.responseText);
  });

  // callback handler that will be called regardless
  // if the request failed or succeeded
  request.always(function () {});
};
