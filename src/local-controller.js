/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 1/24/13
 * Time: 7:16 PM
 * To change this template use File | Settings | File Templates.
 */

/*
 * This will be the class that listens to R connections. Once it receives them, the data manager will communicate
 * with it, and it will also send requests to change chart order, etc. It will basically allow a remote control
 * of the entire thing (the same power that the user has).
 */
function LocalController() {
  this._socket = null;
  this._useUI = true;

  this._requestId = 0;
  this._callbacks = {}; // Callbacks hashtable
  this._requestsStack = [];
}

LocalController.instance = new LocalController();

LocalController.prototype.initialize = function(host, useUI) {
  useUI = typeof useUI != 'undefined' ? useUI : true;

  if (host == 'None') {
    return;
  }

  try {
    var socket = new WebSocket(host);
    var self = this;
    console.log('WebSocket - status ' + socket.readyState);
    socket.onopen = function(){ self._onSocketOpen(); };
    socket.onmessage = function(msg){ self._onSocketMessage(msg); };
    socket.onclose = function(){ self._onSocketClose(); };
    this._socket = socket;
    this._useUI = useUI;
  } catch(ex){
    console.log(ex);
  }
};

LocalController.prototype._onSocketOpen = function() {
  // Send the requests that were made before the socked was fully open.
  // Those are stored in this._requestStack
  for (var i=0; i<this._requestsStack.length; ++i) {
    this._socket.send(this._requestsStack[i]);
  }

  this._requestsStack = [];
};

LocalController.prototype._onSocketClose = function() {
  this._socket = null;
};

LocalController.prototype._onSocketMessage = function(msg) {
    console.log('Local Controller Received: ' + msg.data);

    var message = JSON.parse(msg.data);
    if (message.type == 'response') {
      var callback = this._callbacks[message.id];
      delete this._callbacks[message.id];
      callback(message.data);
    } else if (message.type == 'request') {
      switch (message.action) {
        case 'addDevice':
          this.addDevice(message.id, message.data);
          break;
        case 'rmDevice':
          this.removeDevice(message.id, message.data);
          break;
        case 'clearDeviceCache':
          this.clearDeviceCache(message.id, message.data);
          break;
        case 'navigate':
          this.navigate(message.id, message.data);
          break;

      }
    }
};

LocalController.prototype.connected = function() {
  return (this._socket != null);
};

LocalController.prototype._nextId = function() {
  return this._requestId++;
};

LocalController.prototype.getMeasurements = function(callback) {
  var id = this._nextId();
  this._callbacks[id] = callback;
  var message = JSON.stringify({
    type: 'request',
    id: id,
    action: 'getMeasurements'
  });

  if (this._socket.readyState) {
    this._socket.send(message);
  } else {
    this._requestsStack.push(message);
  }
};

LocalController.instance._makeSingleRequest = function(measurements, chr, start, end, callback) {
  var id = this._nextId();
  // this._callbacks[id] = callback;
  this._callbacks[id] = function(data) {
    // TODO: This is a hack for Block Data! Fix the problem on the R side!
    // Handle error produced by R serialization of array that have no more than one element
    if (data.blockData && data.blockData.data && !jQuery.isEmptyObject(data.blockData.data)) {
      for (var key in data.blockData.data) {
        for (var column in data.blockData.data[key]) {
          if (!jQuery.isArray(data.blockData.data[key][column])) {
            data.blockData.data[key][column] = [data.blockData.data[key][column]];
          }
        }
      }
    }
    callback(data);
  };
  var message = JSON.stringify({
    type: 'request',
    id: id,
    action: 'getAllData',
    measurements: measurements,
    chr: chr,
    start: start,
    end: end
  });

  if (this._socket.readyState) {
    this._socket.send(message);
  } else {
    this._requestsStack.push(message);
  }
};

LocalController.instance.getData = function(requestId, measurements, requests, callback) {

  var requestsFulfilled = 0;
  var responses = [];
  for (var i = 0; i < requests.length; ++i) {
    this._makeSingleRequest(measurements, requests[i].chr, requests[i].start, requests[i].end,
      function(data) {
        responses.push(data);
        requestsFulfilled++;

        if (requestsFulfilled == requests.length) {
          var response = {
            request_id: requestId,
            responses: responses
          };

          callback(response);
        }
      });
  }
};

LocalController.instance.addDevice = function(requestId, requestData) {
  var measurements = {};

  // TODO: Send measurements as a map: { blockMeasurements: [...], bpMeasurements: [...], geneMeasurements: [...], barcodeMeasurements: [...] }
  measurements[requestData.type + 'Measurements'] = requestData.measurements;

  DataManager.instance.addMeasurements('localData', measurements);

  var chartType = null;
  var measurementIds = d3.keys(requestData.measurements);

  switch (requestData.type) {
    case 'block':
      chartType = 'blocksTrack';
      break;
    case 'bp':
      chartType = 'lineTrack';
      break;
    case 'gene':
      chartType = 'geneScatterPlot';
      measurementIds = [[measurementIds[0]], [measurementIds[1]]];
      break;
  }
  var chartId = ChartManager.instance.addChart([chartType, measurementIds], this._useUI);

  UILocation.change(true);

  var message = JSON.stringify({
    type:'response',
    id:requestId,
    data:{
      id:chartId
    }
  });

  if (this._socket.readyState) {
    this._socket.send(message);
  } else {
    this._requestStack.push(message);
  }
};

LocalController.instance.removeDevice = function(requestId, requestData) {
  var trackId = requestData.id;
  var measurements = {};

  // TODO: Send measurements as a map: { blockMeasurements: [...], bpMeasurements: [...], geneMeasurements: [...], barcodeMeasurements: [...] }
  measurements[requestData.type + 'Measurements'] = requestData.measurements;

  ChartManager.instance.removeChart(trackId);
  DataManager.instance.removeMeasurements('localData', measurements);

  var message = JSON.stringify({
      type: 'response',
      id: requestId,
      data: {id: trackId}
  });

  if (this._socket.readyState) {
      this._socket.send(message);
  } else {
      this._requestsStack.push(message);
  }
};

LocalController.instance.clearDeviceCache = function(requestId, requestData) {
    var chartId = requestData.id;
    DataCache.instance.clearLocalChartCache(chartId);
    EventManager.instance.updateData(UILocation.chr, UILocation.start, UILocation.start + UILocation.width);

    var message = JSON.stringify({
        type: 'response',
        id: requestId,
        data: {id: chartId}
    });

    if (this._socket.readyState) {
        this._socket.send(message);
    } else {
        this._requestsStack.push(message);
    }
};

LocalController.instance.navigate = function(requestId, requestData) {
    console.log("changing");

    UILocation.chr = requestData.chr;
    UILocation.start = requestData.start;
    UILocation.width = requestData.end - requestData.start;
    UILocation.change();
    console.log("changing");

    var message = JSON.stringify({
        type: 'response',
        id: requestId,
        data: requestData
    });

    if (this._socket.readyState) {
        this._socket.send(message);
    } else {
        this._requestsStack.push(message);
    }
};
