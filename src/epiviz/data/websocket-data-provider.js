/**
 * Created by: Florin Chelaru
 * Date: 10/1/13
 * Time: 1:22 PM
 */

goog.provide('epiviz.data.WebsocketDataProvider');

/**
 * @param {?string} [id]
 * @param {string} websocketHost
 * @constructor
 * @extends {epiviz.data.DataProvider}
 */
epiviz.data.WebsocketDataProvider = function (id, websocketHost) {
  epiviz.data.DataProvider.call(this, id || epiviz.data.WebsocketDataProvider.DEFAULT_ID);

  /**
   * @type {string}
   * @private
   */
  this._websocketHost = websocketHost;

  /**
   * @type {?WebSocket}
   * @private
   */
  this._socket = null;

  /**
   * Variable used for testing. If this is set to false, then
   * events triggered by instances of this class should have no
   * UI effect
   * @type {boolean}
   * @private
   */
  this._useUI = (epiviz.ui.WebArgsManager.WEB_ARGS['websocketNoUI'] != 'true');

  /**
   * Used for testing
   * @type {boolean}
   * @private
   */
  this._debug = (epiviz.ui.WebArgsManager.WEB_ARGS['debug'] == 'true');

  /**
   * Callbacks hashtable, mapping request ids to their corresponding callbacks
   * @type {Object.<string, function>}
   * @private
   */
  this._callbacks = {};

  /**
   * Stores messages as a stack until the socket is actually open
   * @type {Array.<string>}
   * @private
   */
  this._requestsStack = [];

  this._initialize();
};

/**
 * Copy methods from upper class
 */
epiviz.data.WebsocketDataProvider.prototype = epiviz.utils.mapCopy(epiviz.data.DataProvider.prototype);
epiviz.data.WebsocketDataProvider.constructor = epiviz.data.WebsocketDataProvider;

epiviz.data.WebsocketDataProvider.DEFAULT_ID = 'websocket';

/**
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._initialize = function () {
  if (!this._websocketHost || this._websocketHost == 'None') { return; }

  try {
    this._socket = new WebSocket(this._websocketHost);
    this._log('WebSocket - status ' + this._socket.readyState);
    var self = this;
    this._socket.onopen = function () { self._onSocketOpen(); };
    this._socket.onmessage = function (msg) { self._onSocketMessage(msg); };
    this._socket.onclose = function () { self._onSocketClose(); };
  } catch (error) {
    this._log(error.toString());
    // TODO: Throw some error to be caught up in epiviz.js
  }
};

/**
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._onSocketOpen = function () {
  // Send the requests that were made before the socked was fully open.
  // Those are stored in this._requestStack
  for (var i = 0; i < this._requestsStack.length; ++i) {
    this._socket.send(this._requestsStack[i]);
  }

  this._requestsStack = [];
};


/**
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._onSocketClose = function () {
  this._socket = null;
};

/**
 * @param {string} message
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._sendMessage = function (message) {
  if (this.connected() && this._socket.readyState) {
    this._socket.send(message);
  } else {
    this._requestsStack.push(message);
  }
};

/**
 * @param {{data: string}} msg
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._onSocketMessage = function (msg) {
  this._log('Local Controller Received: ' + msg.data);

  /**
   * @type {{requestId: number, type: string, data: *}}
   */
  var message = JSON.parse(msg.data);
  if (message['type'] == epiviz.data.MessageType.RESPONSE) {
    var response = epiviz.data.Response.fromRawObject(message);
    var callback = this._callbacks[response.id()];
    delete this._callbacks[response.id()];
    callback(response);
  } else if (message['type'] == epiviz.data.MessageType.REQUEST) {
    var Action = epiviz.data.Request.Action;
    var request = epiviz.data.Request.fromRawObject(message);

    switch (request.get('action')) {
      case Action.ADD_MEASUREMENTS:
        this._addMeasurements(request);
        break;
      case Action.REMOVE_MEASUREMENTS:
        this._removeMeasurements(request);
        break;
      case Action.ADD_SEQINFOS:
        this._addSeqInfos(request);
        break;
      case Action.REMOVE_SEQNAMES:
        this._removeSeqNames(request);
        break;
      case Action.ADD_CHART:
        this._addChart(request);
        break;
      case Action.REMOVE_CHART:
        this._removeChart(request);
        break;
      case Action.CLEAR_DATASOURCE_GROUP_CACHE:
        this._clearDatasourceGroupCache(request);
        break;
      case Action.FLUSH_CACHE:
        this._flushCache(request);
        break;
      case Action.NAVIGATE:
        this._navigate(request);
        break;
      case Action.REDRAW:
        this._redraw(request);
        break;
      case Action.GET_CURRENT_LOCATION:
        this._getCurrentLocation(request);
        break;
      case Action.WRITE_DEBUG_MSG: 
	this._writeDebugMsg(request);
	break;
    }
  }
};

/**
 * @param {string} message
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._log = function(message) {
  if (this._debug) { console.log(message); }
};

/**
 * @param {epiviz.events.Event.<{result: epiviz.events.EventResult<*>}>} event
 * @param {{result: epiviz.events.EventResult<*>}} args
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._fireEvent = function(event, args) {
  if (!this._useUI) {
    args.result.success = true;
    return;
  }

  event.notify(args);
};

/**
 * @returns {boolean}
 */
epiviz.data.WebsocketDataProvider.prototype.connected = function () {
  return (this._socket != null);
};

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response)} callback
 * @override
 */
epiviz.data.WebsocketDataProvider.prototype.getData = function (request, callback) {
  var message = JSON.stringify(request.raw());
  this._callbacks[request.id()] = callback;

  this._sendMessage(message);
};

// This is the interface to the websocket

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._addMeasurements = function (request) {
  var result = new epiviz.events.EventResult();
  var measurements = new epiviz.measurements.MeasurementSet();

  /**
   * @type {Array.<{
   *   id: string,
   *   name: string,
   *   type: string,
   *   datasourceId: string,
   *   datasourceGroup: string,
   *   defaultChartType: ?string,
   *   annotation: ?Object.<string, string>,
   *   minValue: ?number,
   *   maxValue: ?number,
   *   metadata: ?Array.<string>}>}
   */
  var rawMeasurements = JSON.parse(request.get('measurements'));
  for (var i = 0; i < rawMeasurements.length; ++i) {
    measurements.add(new epiviz.measurements.Measurement(
      rawMeasurements[i]['id'],
      rawMeasurements[i]['name'],
      rawMeasurements[i]['type'],
      rawMeasurements[i]['datasourceId'],
      rawMeasurements[i]['datasourceGroup'],
      this.id(),
      null,
      rawMeasurements[i]['defaultChartType'],
      rawMeasurements[i]['annotation'],
      rawMeasurements[i]['minValue'],
      rawMeasurements[i]['maxValue'],
      rawMeasurements[i]['metadata']
    ));
  }

  this._fireEvent(this.onRequestAddMeasurements(), {measurements: measurements, result: result});

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._removeMeasurements = function (request) {
  var result = new epiviz.events.EventResult();
  var measurements = new epiviz.measurements.MeasurementSet();

  /**
   * @type {Array.<{
   *   id: string,
   *   name: string,
   *   type: string,
   *   datasourceId: string,
   *   datasourceGroup: string,
   *   defaultChartType: ?string,
   *   annotation: ?Object.<string, string>,
   *   minValue: ?number,
   *   maxValue: ?number,
   *   metadata: ?Array.<string>}>}
   */
  var rawMeasurements = JSON.parse(request.get('measurements'));
  for (var i = 0; i < rawMeasurements.length; ++i) {
    measurements.add(new epiviz.measurements.Measurement(
      rawMeasurements[i]['id'],
      rawMeasurements[i]['name'],
      rawMeasurements[i]['type'],
      rawMeasurements[i]['datasourceId'],
      rawMeasurements[i]['datasourceGroup'],
      this.id(),
      null,
      rawMeasurements[i]['defaultChartType'],
      rawMeasurements[i]['annotation'],
      rawMeasurements[i]['minValue'],
      rawMeasurements[i]['maxValue'],
      rawMeasurements[i]['metadata']
    ));
  }
  this._fireEvent(this.onRequestRemoveMeasurements(), {measurements: measurements, result: result});

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._addSeqInfos = function (request) {
  var result = new epiviz.events.EventResult();

  /**
   * @type {Array.<Array>}
   */
  var seqInfos = JSON.parse(request.get('seqInfos'));

  this._fireEvent(this.onRequestAddSeqInfos(), {seqInfos: seqInfos, result: result});

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._removeSeqNames = function (request) {
  var result = new epiviz.events.EventResult();

  /**
   * @type {Array.<string>}
   */
  var seqNames = JSON.parse(request.get('seqNames'));

  this._fireEvent(this.onRequestRemoveSeqNames(), {seqNames: seqNames, result: result});

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._addChart = function (request) {
  /** @type {epiviz.events.EventResult.<{id: string}>} */
  var result = new epiviz.events.EventResult();
  var measurements = new epiviz.measurements.MeasurementSet();

  /**
   * @type {Array.<{
   *   id: string,
   *   name: string,
   *   type: string,
   *   datasourceId: string,
   *   datasourceGroup: string,
   *   defaultChartType: ?string,
   *   annotation: ?Object.<string, string>,
   *   minValue: ?number,
   *   maxValue: ?number,
   *   metadata: ?Array.<string>}>}
   */
  var rawMeasurements = JSON.parse(request.get('measurements'));
  for (var i = 0; i < rawMeasurements.length; ++i) {
    measurements.add(new epiviz.measurements.Measurement(
      rawMeasurements[i]['id'],
      rawMeasurements[i]['name'],
      rawMeasurements[i]['type'],
      rawMeasurements[i]['datasourceId'],
      rawMeasurements[i]['datasourceGroup'],
      this.id(),
      null,
      rawMeasurements[i]['defaultChartType'],
      rawMeasurements[i]['annotation'],
      rawMeasurements[i]['minValue'],
      rawMeasurements[i]['maxValue'],
      rawMeasurements[i]['metadata']
    ));
  }

  this._fireEvent(this.onRequestAddChart(), {
    type: request.get('type'),
    measurements: measurements,
    result: result
  });

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._removeChart = function (request) {
  var chartId = request.get('chartId');
  var result = new epiviz.events.EventResult();

  this._fireEvent(this.onRequestRemoveChart(), {
    id: chartId,
    result: result
  });

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._clearDatasourceGroupCache = function (request) {
  var result = new epiviz.events.EventResult();

  this._fireEvent(this.onRequestClearDatasourceGroupCache(), {
    datasourceGroup: request.get('datasourceGroup'),
    result: result
  });

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._flushCache = function (request) {
  var result = new epiviz.events.EventResult();
  this._fireEvent(this.onRequestFlushCache(), {
    result: result
  });

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._navigate = function (request) {
  /**
   * @type {{seqName: string, start: number, end: number}}
   */
  var range = JSON.parse(request.get('range'));
  var result = new epiviz.events.EventResult();

  this._fireEvent(this.onRequestNavigate(), {
    range: epiviz.datatypes.GenomicRange.fromStartEnd(range.seqName, range.start, range.end),
    result: result
  });

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._redraw = function (request) {
  var result = new epiviz.events.EventResult();
  this._fireEvent(this.onRequestRedraw(), {
    result: result
  });

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._getCurrentLocation = function(request) {
  var result = new epiviz.events.EventResult();
  this._fireEvent(this.onRequestCurrentLocation(), {
    result: result
  });

  var response = new epiviz.data.Response(request.id(), result);
  this._sendMessage(JSON.stringify(response.raw()));
};

/**
 * @param {epiviz.data.Request} request
 * @private
 */
epiviz.data.WebsocketDataProvider.prototype._writeDebugMsg = function(request) {
    var msg = request.get('msg');
    var msgDiv = document.createElement("pre");
    msgDiv.innerHTML = msg.replace(/&/g, "&amp;").replace(/\\</g,"&lt;");
    var response = new epiviz.data.Response(request.id(), {msg: "that msg"});
    document.getElementById("chart-container").appendChild(msgDiv);
    this._sendMessage(JSON.stringify(response.raw()));
}
