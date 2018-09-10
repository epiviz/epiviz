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

  this._shinycallbacks = {};
  this._requestQueue = [];
  this._requestInProgress = false;
  this._registered = false;
  this.providerId = Date.now().toString();
  // this._initialize();
  Shiny.onInputChange("registerProvider", {
    id: this.providerId,
    ".nounce": Math.random()
  });
  Shiny.addCustomMessageHandler(
    this.providerId + ".callback",
    this.callbackHandler.bind(this)
  );
  Shiny.addCustomMessageHandler(
    this.providerId + ".registration",
    this.registrationHandler.bind(this)
  );
};

epiviz.data.ShinyDataProvider.prototype._initialize = function() {
  Shiny.addCustomMessageHandler(
    this.providerId + ".callback",
    this.callbackHandler.bind(this)
  );
  Shiny.addCustomMessageHandler(
    this.providerId + ".registration",
    this.registrationHandler.bind(this)
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
  if (Object.keys(this._shinycallbacks).length == 0 && this._registered) {
    var time = Date.now();
    var id = request.id();
    //var id = time;
    this._shinycallbacks[time] = [callback, id];
    var params = {};
    params["_method"] = request._args.action;
    params["_reqid"] = time;
    params["_args"] = request._args;
    params[".nounce"] = Math.random();
    Shiny.onInputChange(this.providerId, params);
  } else {
    this._requestQueue.push([request, callback]);
  }
};

epiviz.data.ShinyDataProvider.prototype.registrationHandler = function(
  response
) {
  if (response.success) {
    this._registered = true;

    if (this._requestQueue.length > 0) {
      var req = this._requestQueue.shift();
      this.getData(req[0], req[1]);
    }
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

  var callback = this._shinycallbacks[id][0];
  respObj._id = this._shinycallbacks[id][1];
  delete this._shinycallbacks[id];

  if (this._requestQueue.length > 0) {
    var req = this._requestQueue.shift();
    this.getData(req[0], req[1]);
  }

  callback(respObj);
};
