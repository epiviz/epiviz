/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/8/14
 * Time: 1:48 PM
 */

goog.provide('epiviztest.TestSuite');

/**
 * @param {string} name
 * @param {{
 *   config: epiviz.Config,
 *   locationManager: epiviz.ui.LocationManager,
 *   measurementsManager: epiviz.measurements.MeasurementsManager,
 *   chartFactory: epiviz.ui.charts.ChartFactory,
 *   chartManager: epiviz.ui.charts.ChartManager,
 *   controlManager: epiviz.ui.ControlManager,
 *   dataProviderFactory: epiviz.data.DataProviderFactory,
 *   dataManager: epiviz.data.DataManager,
 *   workspaceManager: epiviz.workspaces.WorkspaceManager,
 *   userManager: epiviz.workspaces.UserManager,
 *   webArgsManager: epiviz.ui.WebArgsManager,
 *   epivizHandler: epiviz.EpiViz
 * }} epivizFramework
 * @param {number} nRunsPerTestCase
 * @param {string} chartTypeName
 * @constructor
 */
epiviztest.TestSuite = function(name, epivizFramework, nRunsPerTestCase, chartTypeName) {
  /**
   * @type {string}
   * @private
   */
  this._id = epiviz.utils.generatePseudoGUID(5);

  /**
   * @type {string}
   * @private
   */
  this._name = name || sprintf('Unnamed test [%s]', this._id);

  /**
   * @type {{config: epiviz.Config, locationManager: epiviz.ui.LocationManager, measurementsManager: epiviz.measurements.MeasurementsManager, chartFactory: epiviz.ui.charts.ChartFactory, chartManager: epiviz.ui.charts.ChartManager, controlManager: epiviz.ui.ControlManager, dataProviderFactory: epiviz.data.DataProviderFactory, dataManager: epiviz.data.DataManager, workspaceManager: epiviz.workspaces.WorkspaceManager, userManager: epiviz.workspaces.UserManager, webArgsManager: epiviz.ui.WebArgsManager, epivizHandler: epiviz.EpiViz}}
   */
  this.epivizFramework = epivizFramework;

  /**
   * @type {number}
   * @private
   */
  this._nRunsPerTestCase = nRunsPerTestCase || 1;

  /**
   * @type {string}
   * @private
   */
  this._chartTypeName = chartTypeName;

  /**
   * @type {number}
   * @private
   */
  this._widthCoef = 0.01;
};

/**
 * @returns {string}
 */
epiviztest.TestSuite.prototype.id = function() {
  return this._id;
};

/**
 * @returns {string}
 */
epiviztest.TestSuite.prototype.name = function() {
  return this._name;
};

/**
 * @returns {Array.<string>}
 */
epiviztest.TestSuite.prototype.getTestCases = function() {
  var result = [];
  for (var member in this) {
    if (jQuery.isFunction(this[member]) && epiviz.utils.stringStartsWith(member, 'test')) {
      result.push(member);
    }
  }
  return result;
};

/**
 * @param {string} testCase
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.TestSuite.prototype.runTestCase = function(testCase, resultContainer, finishCallback) {
  if (!this[testCase] || !jQuery.isFunction(this[testCase])) {
    resultContainer.empty();
    resultContainer.append('ERROR: Testcase not found');
    finishCallback(null);
    return;
  }

  this[testCase](resultContainer, finishCallback);
};

/**
 * @param {string} chartTypeName
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementSet} measurements
 * @param {Object.<string, *>} customSettings
 * @param {boolean} useCache
 * @param {function(number=, number=, number=, number=, number=, number=)} finishCallback Parameters are:
 *   totalTime, getDataTime, processingTime, drawTime, drawnObjects, dataObjects
 */
epiviztest.TestSuite.prototype.addChart = function(chartTypeName, range, measurements, customSettings, useCache, finishCallback) {
  // Go to a predefined location, and make sure the cache is empty
  this.epivizFramework.locationManager.changeCurrentLocation(range);

  var t = this.epivizFramework.chartFactory.get(chartTypeName);
  var chartProperties = new epiviz.ui.charts.VisualizationProperties(t.defaultWidth(), t.defaultHeight(), t.defaultMargins(), new epiviz.ui.controls.VisConfigSelection(measurements), t.defaultColors(), null, customSettings, t.customSettingsDefs());
  var measurementIds = {};
  measurements.foreach(function(m) { measurementIds[m.id()] = true; });

  // Highjack the data provider getData method, to measure time used to actually retrieve the data
  var provider = this.epivizFramework.dataProviderFactory.get(measurements.first().dataprovider());

  var Action = epiviz.data.Request.Action;
  var getDataStartTime = null, getDataTime = null;
  var providerGetData = provider.getData;
  provider.getData = function(request, callback) {
    var action = request.get('action');
    var seqName = request.get('seqName');
    var start = request.get('start');
    var end = request.get('end');
    var datasource = request.get('datasource');
    var measurement = request.get('measurement');

    var perfCallback = callback;
    if (
      (action == Action.GET_ROWS || action == Action.GET_VALUES) &&
        seqName == range.seqName() &&
        start <= range.end() &&
        end >= range.start() &&
        datasource == measurements.first().datasourceId() &&
        (!measurement || (measurement in measurementIds))) {

      // Also highjack the callback
      perfCallback = function(response) {
        getDataTime = new Date().getTime() - getDataStartTime;
        callback(response);
      };

      if (getDataStartTime === null) {
        getDataStartTime = new Date().getTime();
      }
    }

    providerGetData.call(this, request, perfCallback);
  };

  var chartId = sprintf('%s-%s-%s', t.chartDisplayType(), t.chartHtmlAttributeName(), epiviz.utils.generatePseudoGUID(5));
  var chartMeasurementsMap = {};
  chartMeasurementsMap[chartId] = new epiviz.measurements.MeasurementSet(measurements);

  var self = this;
  var doAddChart = function() {
    var drawTime, drawnObjects, dataObjects;
    var startTime = new Date().getTime();

    self.epivizFramework.chartManager.addChart(t, new epiviz.ui.controls.VisConfigSelection(measurements), chartId, chartProperties);
    var chart = self.epivizFramework.chartManager._charts[chartId];

    // Highjack the chart draw method, to measure time used to draw
    var chartDraw = chart.draw;
    chart.draw = function() {
      this.draw = chartDraw; // Only do this once

      var drawStartTime = new Date().getTime();
      var uiObjects = chartDraw.apply(this, arguments);
      var drawEndTime = new Date().getTime();
      drawTime = drawEndTime - drawStartTime;
      drawnObjects = uiObjects.length;

      dataObjects = 0;
      if (this._lastData) {
        this._lastData.foreach(function(m, series) {
          dataObjects += series.size();
        });
      }

      return uiObjects;
    };

    self.epivizFramework.chartManager.dataWaitStart(chartId);

    self.epivizFramework.dataManager.getData(range, chartMeasurementsMap,
      function(chartId, data) {
        var dataRetrievalAndProcessingTime = new Date().getTime() - startTime;

        self.epivizFramework.chartManager.updateCharts(range, data, [chartId]);

        if (useCache) { getDataTime = 0; }
        var totalTime = new Date().getTime() - startTime;
        var processingTime = dataRetrievalAndProcessingTime - getDataTime;

        provider.getData = providerGetData;

        if (finishCallback) { finishCallback(totalTime, getDataTime, processingTime, drawTime, drawnObjects, dataObjects); }
      });
  };

  if (useCache) {
    var cache = this.epivizFramework.dataManager._cache;
    cache.getData(range, chartMeasurementsMap, function(chartId, data) {
      doAddChart();
    });
  } else {
    this.epivizFramework.dataManager.flushCache();
    doAddChart();
  }
};

epiviztest.TestSuite.prototype.navigate = function(chartTypeName, initialRange, newRange, measurements, customSettings, useCache, finishCallback) {

  // First, add chart.

  // Go to a predefined location, and make sure the cache is empty
  this.epivizFramework.locationManager.changeCurrentLocation(initialRange);

  var t = this.epivizFramework.chartFactory.get(chartTypeName);
  var chartProperties = new epiviz.ui.charts.VisualizationProperties(t.defaultWidth(), t.defaultHeight(), t.defaultMargins(), new epiviz.ui.controls.VisConfigSelection(measurements), t.defaultColors(), null, customSettings, t.customSettingsDefs());
  var measurementIds = {};
  measurements.foreach(function(m) { measurementIds[m.id()] = true; });

  var chartId = sprintf('%s-%s-%s', t.chartDisplayType(), t.chartHtmlAttributeName(), epiviz.utils.generatePseudoGUID(5));
  var chartMeasurementsMap = {};
  chartMeasurementsMap[chartId] = new epiviz.measurements.MeasurementSet(measurements);

  var self = this;
  var drawTime, drawnObjects, dataObjects;
  var startTime = null;
  var getDataStartTime = null, getDataTime = null;

  self.epivizFramework.chartManager.addChart(t, new epiviz.ui.controls.VisConfigSelection(measurements), chartId, chartProperties);
  var chart = self.epivizFramework.chartManager._charts[chartId];

  var doNavigate = function() {
    // Highjack the data provider getData method, to measure time used to actually retrieve the data
    var provider = self.epivizFramework.dataProviderFactory.get(measurements.first().dataprovider());

    var Action = epiviz.data.Request.Action;
    var providerGetData = provider.getData;
    provider.getData = function(request, callback) {
      var action = request.get('action');
      var seqName = request.get('seqName');
      var start = request.get('start');
      var end = request.get('end');
      var datasource = request.get('datasource');
      var measurement = request.get('measurement');

      var perfCallback = callback;
      if (
        (action == Action.GET_ROWS || action == Action.GET_VALUES) &&
          seqName == newRange.seqName() &&
          start < newRange.end() &&
          end > newRange.start() &&
          datasource == measurements.first().datasourceId() &&
          (!measurement || (measurement in measurementIds))) {

        // Also highjack the callback
        perfCallback = function(response) {
          getDataTime = new Date().getTime() - getDataStartTime;
          callback(response);
        };

        if (getDataStartTime === null) {
          getDataStartTime = new Date().getTime();
        }
      }

      providerGetData.call(this, request, perfCallback);
    };

    // Highjack the chart draw method, to measure time used to draw
    var chartDraw = chart.draw;
    chart.draw = function() {
      chart.draw = chartDraw; // Only do this once

      var drawStartTime = new Date().getTime();
      var uiObjects = chartDraw.apply(this, arguments);
      var drawEndTime = new Date().getTime();
      drawTime = drawEndTime - drawStartTime;
      drawnObjects = uiObjects.length;

      dataObjects = 0;
      if (this._lastData) {
        this._lastData.foreach(function(m, series) { dataObjects += series.size(); });
      }

      // Now that chart has finished drawing, we can compute all other numbers
      var totalTime = new Date().getTime() - startTime;
      var processingTime = totalTime - drawTime - getDataTime;

      provider.getData = providerGetData;

      if (finishCallback) {
        finishCallback(totalTime, getDataTime, processingTime, drawTime, drawnObjects, dataObjects);
      }

      return uiObjects;
    };

    startTime = new Date().getTime();

    self.epivizFramework.chartManager.dataWaitStart();
    var chartMeasurementsMap = self.epivizFramework.chartManager.chartsMeasurements();

    self.epivizFramework.dataManager.getData(newRange, chartMeasurementsMap,
      function(chartId, data) {
        self.epivizFramework.chartManager.updateCharts(newRange, data, [chartId]);
      });
  };

  self.epivizFramework.chartManager.dataWaitStart(chartId);
  self.epivizFramework.dataManager.getData(initialRange, chartMeasurementsMap,
    function(chartId, data) {

      self.epivizFramework.chartManager.updateCharts(initialRange, data, [chartId]);

      // Now navigate
      var cache = self.epivizFramework.dataManager._cache;
      if (useCache) {
        var checkPendingRequests = function() {
          var hasPendingRequests = false;
          cache._measurementPendingRequestsMap.foreach(function(m, map) {
            if (Object.keys(map).length) {
              hasPendingRequests = true;
              return true;
            }
            return false;
          });
          if (hasPendingRequests) {
            window.setTimeout(checkPendingRequests, 10);
          } else {
            doNavigate();
          }
        };

        checkPendingRequests();
      } else {
        cache.flush();
        doNavigate();
      }
    });
};

epiviztest.TestSuite.prototype.addChartWithCache = function(resultContainer, finishCallback) {
  var measurements = this.measurements();
  var chartTypeName = this._chartTypeName;
  var customSettings = this.customSettings();
  var avgTotalTime = 0, avgGetDataTime = 0, avgProcessingTime = 0, avgDrawTime = 0, avgDrawnObjects = 0, avgDataObjects = 0, avgRangeWidth = 0;
  var totalTimes = [], getDataTimes = [], processingTimes = [], drawTimes = [], drawnObjectsArr = [], dataObjectsArr = [], rangeWidths = [];

  var seqInfos = this.epivizFramework.locationManager._seqInfos;
  var seqNames = Object.keys(seqInfos);

  var run = -1;
  var self = this;
  var iteration = function() {
    ++run;
    if (run >= self._nRunsPerTestCase) {
      if (finishCallback) {
        finishCallback({
          totalTimes: totalTimes,
          getDataTimes: getDataTimes,
          processingTimes: processingTimes,
          drawTimes: drawTimes,
          drawnObjects: drawnObjectsArr,
          dataObjects: dataObjectsArr,
          rangeWidths: rangeWidths,
          nRuns: self._nRunsPerTestCase
        });
      }
      return;
    }

    // Remove all charts from the stage
    self.epivizFramework.chartManager.clear();

    var seqName = seqNames[Math.floor(Math.random() * seqNames.length)];
    var minStart = seqInfos[seqName].min;
    var maxStart = seqInfos[seqName].max - 1;
    var start = Math.floor(Math.random() * (maxStart - minStart)) + minStart;
    var maxWidth = seqInfos[seqName].max - start;
    var width = Math.floor(Math.random() * maxWidth * self._widthCoef) + 1;
    var range = new epiviz.datatypes.GenomicRange(seqName, start, width);

    self.addChart(chartTypeName, range, measurements, customSettings, true,
      function(totalTime, getDataTime, processingTime, drawTime, drawnObjects, dataObjects) {
        avgTotalTime = (avgTotalTime * run + totalTime) / (run + 1);
        avgGetDataTime = (avgGetDataTime * run + getDataTime) / (run + 1);
        avgProcessingTime = (avgProcessingTime * run + processingTime) / (run + 1);
        avgDrawTime = (avgDrawTime * run + drawTime) / (run + 1);
        avgDrawnObjects = (avgDrawnObjects * run + drawnObjects) / (run + 1);
        avgDataObjects = (avgDataObjects * run + dataObjects) / (run + 1);
        avgRangeWidth = (avgRangeWidth * run + range.width()) / (run + 1);

        totalTimes.push(totalTime);
        getDataTimes.push(getDataTime);
        processingTimes.push(processingTime);
        drawTimes.push(drawTime);
        drawnObjectsArr.push(drawnObjects);
        dataObjectsArr.push(dataObjects);
        rangeWidths.push(width);

        resultContainer.empty();
        resultContainer.append(sprintf(
          'Total runs: %s <br />' +
            'Average execution time: %s <br />' +
            'Average data retrieval time: %s <br />' +
            'Average data processing time: %s <br />' +
            'Average chart draw time: %s <br />' +
            'Average chart drawn objects: %s <br />' +
            'Average data objects (not drawn): %s <br />' +
            'Average draw range size: %s <br />',
          run+1, avgTotalTime, avgGetDataTime, avgProcessingTime, avgDrawTime, avgDrawnObjects, avgDataObjects, range.width()));

        iteration();
      });
  };

  iteration();
};

epiviztest.TestSuite.prototype.addChartNoCache = function(resultContainer, finishCallback) {
  var measurements = this.measurements();
  var chartTypeName = this._chartTypeName;
  var customSettings = this.customSettings();
  var avgTotalTime = 0, avgGetDataTime = 0, avgProcessingTime = 0, avgDrawTime = 0, avgDrawnObjects = 0, avgDataObjects = 0, avgRangeWidth = 0;
  var totalTimes = [], getDataTimes = [], processingTimes = [], drawTimes = [], drawnObjectsArr = [], dataObjectsArr = [], rangeWidths = [];

  var seqInfos = this.epivizFramework.locationManager._seqInfos;
  var seqNames = Object.keys(seqInfos);

  var run = -1;
  var self = this;
  var iteration = function() {
    ++run;
    if (run >= self._nRunsPerTestCase) {
      if (finishCallback) {
        finishCallback({
          totalTimes: totalTimes,
          getDataTimes: getDataTimes,
          processingTimes: processingTimes,
          drawTimes: drawTimes,
          drawnObjects: drawnObjectsArr,
          dataObjects: dataObjectsArr,
          rangeWidths: rangeWidths,
          nRuns: self._nRunsPerTestCase
        });
      }
      return;
    }

    // Remove all charts from the stage
    self.epivizFramework.chartManager.clear();

    var seqName = seqNames[Math.floor(Math.random() * seqNames.length)];
    var minStart = seqInfos[seqName].min;
    var maxStart = seqInfos[seqName].max - 1;
    var start = Math.floor(Math.random() * (maxStart - minStart)) + minStart;
    var maxWidth = seqInfos[seqName].max - start;
    var width = Math.floor(Math.random() * maxWidth * self._widthCoef) + 1;
    var range = new epiviz.datatypes.GenomicRange(seqName, start, width);

    self.epivizFramework.dataManager.flushCache();
    self.addChart(chartTypeName, range, measurements, customSettings, false,
      function(totalTime, getDataTime, processingTime, drawTime, drawnObjects, dataObjects) {
        avgTotalTime = (avgTotalTime * run + totalTime) / (run + 1);
        avgGetDataTime = (avgGetDataTime * run + getDataTime) / (run + 1);
        avgProcessingTime = (avgProcessingTime * run + processingTime) / (run + 1);
        avgDrawTime = (avgDrawTime * run + drawTime) / (run + 1);
        avgDrawnObjects = (avgDrawnObjects * run + drawnObjects) / (run + 1);
        avgDataObjects = (avgDataObjects * run + dataObjects) / (run + 1);
        avgRangeWidth = (avgRangeWidth * run + range.width()) / (run + 1);

        totalTimes.push(totalTime);
        getDataTimes.push(getDataTime);
        processingTimes.push(processingTime);
        drawTimes.push(drawTime);
        drawnObjectsArr.push(drawnObjects);
        dataObjectsArr.push(dataObjects);
        rangeWidths.push(width);

        resultContainer.empty();
        resultContainer.append(sprintf(
          'Total runs: %s <br />' +
            'Average execution time: %s <br />' +
            'Average data retrieval time: %s <br />' +
            'Average data processing time: %s <br />' +
            'Average chart draw time: %s <br />' +
            'Average chart drawn objects: %s <br />' +
            'Average data objects (not drawn): %s <br />' +
            'Average draw range size: %s <br />',
          run+1, avgTotalTime, avgGetDataTime, avgProcessingTime, avgDrawTime, avgDrawnObjects, avgDataObjects, range.width()));

        iteration();
      });
  };

  iteration();
};

epiviztest.TestSuite.prototype.navigateWithCache = function(resultContainer, finishCallback) {
  var measurements = this.measurements();
  var chartTypeName = this._chartTypeName;
  var customSettings = this.customSettings();
  var avgTotalTime = 0, avgGetDataTime = 0, avgProcessingTime = 0, avgDrawTime = 0, avgDrawnObjects = 0, avgDataObjects = 0, avgRangeWidth = 0;
  var totalTimes = [], getDataTimes = [], processingTimes = [], drawTimes = [], drawnObjectsArr = [], dataObjectsArr = [], rangeWidths = [];

  var seqInfos = this.epivizFramework.locationManager._seqInfos;
  var seqNames = Object.keys(seqInfos);

  var run = -1;
  var self = this;
  var iteration = function() {
    ++run;
    if (run >= self._nRunsPerTestCase) {
      if (finishCallback) {
        finishCallback({
          totalTimes: totalTimes,
          getDataTimes: getDataTimes,
          processingTimes: processingTimes,
          drawTimes: drawTimes,
          drawnObjects: drawnObjectsArr,
          dataObjects: dataObjectsArr,
          rangeWidths: rangeWidths,
          nRuns: self._nRunsPerTestCase
        });
      }
      return;
    }

    // Remove all charts from the stage
    self.epivizFramework.chartManager.clear();

    var seqName = seqNames[Math.floor(Math.random() * seqNames.length)];
    var minStart = seqInfos[seqName].min;
    var maxStart = seqInfos[seqName].max - 1;
    var start = Math.floor(Math.random() * (maxStart - minStart)) + minStart;
    var maxWidth = seqInfos[seqName].max - start;
    var width = Math.floor(Math.random() * maxWidth * self._widthCoef) + 1;
    var initialRange = new epiviz.datatypes.GenomicRange(seqName, start, width);

    var newRange = new epiviz.datatypes.GenomicRange(seqName, Math.floor(start + width * 0.2), width);
    self.navigate(chartTypeName, initialRange, newRange, measurements, customSettings, true,
      function(totalTime, getDataTime, processingTime, drawTime, drawnObjects, dataObjects) {
        avgTotalTime = (avgTotalTime * run + totalTime) / (run + 1);
        avgGetDataTime = (avgGetDataTime * run + getDataTime) / (run + 1);
        avgProcessingTime = (avgProcessingTime * run + processingTime) / (run + 1);
        avgDrawTime = (avgDrawTime * run + drawTime) / (run + 1);
        avgDrawnObjects = (avgDrawnObjects * run + drawnObjects) / (run + 1);
        avgDataObjects = (avgDataObjects * run + dataObjects) / (run + 1);
        avgRangeWidth = (avgRangeWidth * run + width) / (run + 1);

        totalTimes.push(totalTime);
        getDataTimes.push(getDataTime);
        processingTimes.push(processingTime);
        drawTimes.push(drawTime);
        drawnObjectsArr.push(drawnObjects);
        dataObjectsArr.push(dataObjects);
        rangeWidths.push(width);

        resultContainer.empty();
        resultContainer.append(sprintf(
          'Total runs: %s <br />' +
            'Average execution time: %s <br />' +
            'Average data retrieval time: %s <br />' +
            'Average data processing time: %s <br />' +
            'Average chart draw time: %s <br />' +
            'Average chart drawn objects: %s <br />' +
            'Average data objects (not drawn): %s <br />' +
            'Average draw range size: %s <br />',
          run+1, avgTotalTime, avgGetDataTime, avgProcessingTime, avgDrawTime, avgDrawnObjects, avgDataObjects, initialRange.width()));

        iteration();
      });
  };

  iteration();
};

epiviztest.TestSuite.prototype.navigateNoCache = function(resultContainer, finishCallback) {
  var measurements = this.measurements();
  var chartTypeName = this._chartTypeName;
  var customSettings = this.customSettings();
  var avgTotalTime = 0, avgGetDataTime = 0, avgProcessingTime = 0, avgDrawTime = 0, avgDrawnObjects = 0, avgDataObjects = 0, avgRangeWidth = 0;
  var totalTimes = [], getDataTimes = [], processingTimes = [], drawTimes = [], drawnObjectsArr = [], dataObjectsArr = [], rangeWidths = [];

  var seqInfos = this.epivizFramework.locationManager._seqInfos;
  var seqNames = Object.keys(seqInfos);

  var run = -1;
  var self = this;
  var iteration = function() {
    ++run;
    if (run >= self._nRunsPerTestCase) {
      if (finishCallback) {
        finishCallback({
          totalTimes: totalTimes,
          getDataTimes: getDataTimes,
          processingTimes: processingTimes,
          drawTimes: drawTimes,
          drawnObjects: drawnObjectsArr,
          dataObjects: dataObjectsArr,
          rangeWidths: rangeWidths,
          nRuns: self._nRunsPerTestCase
        });
      }
      return;
    }

    // Remove all charts from the stage
    self.epivizFramework.chartManager.clear();

    var seqName = seqNames[Math.floor(Math.random() * seqNames.length)];
    var minStart = seqInfos[seqName].min;
    var maxStart = seqInfos[seqName].max - 1;
    var start = Math.floor(Math.random() * (maxStart - minStart)) + minStart;
    var maxWidth = seqInfos[seqName].max - start;
    var width = Math.floor(Math.random() * maxWidth * self._widthCoef) + 1;
    var initialRange = new epiviz.datatypes.GenomicRange(seqName, start, width);

    var newRange = new epiviz.datatypes.GenomicRange(seqName, Math.floor(start + width * 0.2), width);

    self.navigate(chartTypeName, initialRange, newRange, measurements, customSettings, false,
      function(totalTime, getDataTime, processingTime, drawTime, drawnObjects, dataObjects) {
        avgTotalTime = (avgTotalTime * run + totalTime) / (run + 1);
        avgGetDataTime = (avgGetDataTime * run + getDataTime) / (run + 1);
        avgProcessingTime = (avgProcessingTime * run + processingTime) / (run + 1);
        avgDrawTime = (avgDrawTime * run + drawTime) / (run + 1);
        avgDrawnObjects = (avgDrawnObjects * run + drawnObjects) / (run + 1);
        avgDataObjects = (avgDataObjects * run + dataObjects) / (run + 1);
        avgRangeWidth = (avgRangeWidth * run + width) / (run + 1);

        totalTimes.push(totalTime);
        getDataTimes.push(getDataTime);
        processingTimes.push(processingTime);
        drawTimes.push(drawTime);
        drawnObjectsArr.push(drawnObjects);
        dataObjectsArr.push(dataObjects);
        rangeWidths.push(width);

        resultContainer.empty();
        resultContainer.append(sprintf(
          'Total runs: %s <br />' +
            'Average execution time: %s <br />' +
            'Average data retrieval time: %s <br />' +
            'Average data processing time: %s <br />' +
            'Average chart draw time: %s <br />' +
            'Average chart drawn objects: %s <br />' +
            'Average data objects (not drawn): %s <br />' +
            'Average draw range size: %s <br />',
          run+1, avgTotalTime, avgGetDataTime, avgProcessingTime, avgDrawTime, avgDrawnObjects, avgDataObjects, initialRange.width()));

        iteration();
      });
  };

  iteration();
};

/**
 * @returns {epiviz.measurements.MeasurementSet} To be implemented in subclasses
 */
epiviztest.TestSuite.prototype.measurements = function() { return null; };

/**
 * @returns {Object.<string, *>} To be implemented in subclasses
 */
epiviztest.TestSuite.prototype.customSettings = function() { return null; };
