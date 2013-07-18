/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/16/13
 * Time: 12:45 PM
 * To change this template use File | Settings | File Templates.
 */

function DataCache() {
  this._chartMeasurements = {};
  this._chartCaches = {};
  this._localChartCaches = {};

  EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_ADD, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_REMOVE, this);
}

DataCache.instance = new DataCache();

DataCache.prototype.splitMeasurements = function(measurements) {
  // Split measurements into those available locally (from LocalController), and those
  // available from the server.

  var serverMs = DataManager.instance.allMeasurements.serverData;
  var localMs = DataManager.instance.allMeasurements.localData;
  var computedMs = DataManager.instance.allMeasurements.computedData;

  if (!serverMs) { serverMs = {}; }
  if (!localMs) { localMs = {}; }
  if (!computedMs) { computedMs = {}; }

  var result = {
    serverData: {},
    localData: {},
    computedData: {}
  };

  ChartFactory.foreachDataTypeHandler(function(handler) {
    var measurementsType = handler.getMeasurementsType();

    if (!measurements[measurementsType] || !measurements[measurementsType].length) {
      result.serverData[measurementsType] = [];
      result.localData[measurementsType] = [];
      return; // In the context of the iteration, this actually means 'continue'
    }

    var s = handler.splitMeasurements(measurements[measurementsType], [serverMs[measurementsType], localMs[measurementsType], computedMs[measurementsType]]);

    result.serverData[measurementsType] = s[0];
    result.localData[measurementsType] = s[1];
    result.computedData[measurementsType] = s[2];

    // Extract real measurements from computed measurements
    var ms = null;
    var i;
    while (s[2].length > 0) {
      ms = [];
      for (i = 0; i < s[2].length; ++i) {
        ms = ms.concat(ComputedMeasurements.instance.getVariables(s[2][i]));
      }
      s = handler.splitMeasurements(ms, [serverMs[measurementsType], localMs[measurementsType], computedMs[measurementsType]]);
      result.serverData[measurementsType] = result.serverData[measurementsType].concat(s[0]);
      result.localData[measurementsType] = result.localData[measurementsType].concat(s[1]);
      result.computedData[measurementsType] = result.computedData[measurementsType].concat(s[2]);
    }

    // Remove duplicates
    for (var source in result) {
      var seen = {};
      for (i = 0; i < result[source][measurementsType].length; ++i) {
        if (seen[result[source][measurementsType][i]]) {
          result[source][measurementsType].splice(i, 1);
          --i;
        }
        seen[result[source][measurementsType][i]] = true;
      }
    }
  });

  return result;
};

DataCache.prototype.onMeasurementsLoaded = function(event) {
  var chartIds = d3.keys(this._chartMeasurements);
  for (var i = 0; i < chartIds.length; ++i) {
    var splitMs = this.splitMeasurements(this._chartMeasurements[chartIds[i]]);
    this._chartCaches[chartIds[i]] = new ChartDataCache(chartIds[i], splitMs.serverData, DataManager.instance);
    this._localChartCaches[chartIds[i]] = new ChartDataCache(chartIds[i], splitMs.localData, LocalController.instance);
  }
};

DataCache.prototype.onChartAdd = function(event) {
  var chartId = event.detail.chartId;
  var measurements = event.detail.measurements;
  this._chartMeasurements[chartId] = measurements;

  if (DataManager.instance.allMeasurements && !jQuery.isEmptyObject(DataManager.instance.allMeasurements)) {
    var splitMs = this.splitMeasurements(measurements);
    this._chartCaches[chartId] = new ChartDataCache(chartId, splitMs.serverData, DataManager.instance);
    this._localChartCaches[chartId] = new ChartDataCache(chartId, splitMs.localData, LocalController.instance);
  }
};

DataCache.prototype.onChartRemove = function(event) {
  var chartId = event.detail.chartId;
  delete this._chartCaches[chartId];
  delete this._chartMeasurements[chartId];

  delete this._localChartCaches[chartId];
};

DataCache.prototype.updateData = function(chr, start, end, sender, callback) {
  var chartIds = d3.keys(this._chartCaches);
  for (var i = 0; i < chartIds.length; ++i) {
    if (this._chartCaches[chartIds[i]]) {
      this._updateChartData(chartIds[i], chr, start, end, sender, callback);
    }
  }
};

DataCache.prototype._updateChartData = function(chartId, chr, start, end, sender, callback) {
  EventManager.instance.beginUpdateChartData(chartId);
  var chartCache = this._chartCaches[chartId];
  var localChartCache = this._localChartCaches[chartId];
  var localMeasurements =  localChartCache.getMeasurements();
  var self = this;
  var serverData = null;
  var localData = null;
  chartCache.getData(chr, start, end, this,
    function(id, data) {
      serverData = data;

      if (!localData) { return; }

      var anyLocalMeasurementsDefined = false;
      ChartFactory.foreachDataTypeHandler(function(handler, breakIteration) {
        if (localMeasurements[handler.getMeasurementsType()].length) {
          anyLocalMeasurementsDefined = true;
          breakIteration.set = true;
        }
      });

      var result = self._mergeData(serverData, localData, localMeasurements);
      callback.call(sender, chartId, result);
    });

  localChartCache.getData(chr, start, end, this,
    function(id, data) {
      localData = data;

      if (!serverData) { return; }

      var anyLocalMeasurementsDefined = false;
      ChartFactory.foreachDataTypeHandler(function(handler, breakIteration) {
        if (localMeasurements[handler.getMeasurementsType()].length) {
          anyLocalMeasurementsDefined = true;
          breakIteration.set = true;
        }
      });

      var result = self._mergeData(serverData, localData, localMeasurements);
      callback.call(sender, chartId, result);
    });
};

DataCache.prototype._mergeData = function(serverData, localData, localMeasurements) {
  var result = serverData;

  ChartFactory.foreachDataTypeHandler(function(handler) {
    var measurementsType = handler.getMeasurementsType();
    var dataType = handler.getDataType();
    var ms = localMeasurements[measurementsType];
    if (ms && ms.length) {
      result[dataType] = handler.mergeDataByMeasurements(serverData[dataType], localData[dataType], ms);
    }
  });

  return result;
};

DataCache.prototype.clearChartCache = function(chartId) {
  this._chartCaches[chartId].clear();
};

DataCache.prototype.clearLocalChartCache = function(chartId) {
  this._localChartCaches[chartId].clear();
};
