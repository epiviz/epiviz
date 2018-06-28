/**
 * Created by: Jayaram Kancherla { jkanche @ umiacs (dot) umd (dot) edu}
 */

goog.provide("epiviz.data.ShinyDataProvider");

goog.require("epiviz.utils");
goog.require("epiviz.data.DataProvider");
goog.require("epiviz.data.Response");

epiviz.data.ShinyDataProvider = function(id) {
  epiviz.data.DataProvider.call(
    this,
    id || epiviz.Config.DEFAULT_DATA_PROVIDER_ID
  );

  this._callbacks = {};
  this._requestQueue = [];
  this._requestInProgress = false;
  // this._initialize();
  Shiny.addCustomMessageHandler(
    "epivizapi.callback",
    this.callbackHandler.bind(this)
  );
};

epiviz.data.ShinyDataProvider.prototype._initialize = function() {
  Shiny.addCustomMessageHandler(
    "epivizapi.callback",
    this.callbackHandler.bind(this)
  );
  // Shiny.addCustomMessageHandler('epivizapi.failureCallback', this.failureCallbackHandler);
};

/**
 * Copy methods from upper class
 */
epiviz.data.ShinyDataProvider.prototype = epiviz.utils.mapCopy(
  epiviz.data.DataProvider.prototype
);
epiviz.data.ShinyDataProvider.constructor = epiviz.data.ShinyDataProvider;

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response.<*>)} callback
 */
epiviz.data.ShinyDataProvider.prototype.getData = function(request, callback) {
  if (request.isEmpty()) {
    return;
  }
  if (Object.keys(this._callbacks).length == 0) {
    var id = request.id();
    this._callbacks[id] = callback;

    var params = {};
    params["_method"] = request._args.action;
    params["_reqid"] = id;
    params["_args"] = request._args;

    Shiny.onInputChange("epivizapi", params);
  } else {
    this._requestQueue.push([request, callback]);
  }
};

epiviz.data.ShinyDataProvider.prototype.callbackHandler = function(response) {
  response.data = JSON.parse(response.data);

  if (response.jsonType == "epivizr") {
    response.data.values = JSON.parse(response.data.values);
    response.data.rows = JSON.parse(response.data.rows);

    if (response.data.rows.values.metadata == null) {
      response.data.rows.values.metadata = {};
    }
  }

  var respObj = epiviz.data.Response.fromRawObject(response);

  var id = respObj.id();

  var callback = this._callbacks[id];
  delete this._callbacks[id];
  callback(respObj);

  if (this._requestQueue.length > 0) {
    var req = this._requestQueue.shift();
    this.getData(req[0], req[1]);
  }
};
