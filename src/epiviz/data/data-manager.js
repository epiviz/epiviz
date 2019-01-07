/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 7:50 PM
 */

goog.provide('epiviz.data.DataManager');

goog.require('epiviz.data.DataProvider');
goog.require('epiviz.data.DataProviderFactory');
goog.require('epiviz.measurements.MeasurementSet');
goog.require('epiviz.measurements.Measurement');
goog.require('epiviz.events.EventListener');
goog.require('epiviz.data.Cache');
goog.require('epiviz.events.Event');
goog.require('epiviz.data.RequestStack');
goog.require('epiviz.datatypes.GenomicRangeArray');
goog.require('epiviz.datatypes.FeatureValueArray');
goog.require('epiviz.datatypes.MeasurementGenomicData');
goog.require('epiviz.datatypes.MeasurementGenomicDataWrapper');
goog.require('epiviz.datatypes.SeqInfo');
goog.require('epiviz.events.EventResult');
// goog.require('epiviz.utils.arrayAppend');
// goog.require('epiviz.utils.forEach');
goog.require('epiviz.utils');


/**
 * @param {epiviz.Config} config
 * @param {epiviz.data.DataProviderFactory} dataProviderFactory
 * @constructor
 */
epiviz.data.DataManager = function(config, dataProviderFactory) {

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {epiviz.measurements.MeasurementSet}
   * @private
   */
  this._measurements = new epiviz.measurements.MeasurementSet();

  /**
   * @type {epiviz.data.DataProviderFactory}
   * @private
   */
  this._dataProviderFactory = dataProviderFactory;

  /**
   * @type {epiviz.data.Cache}
   * @private
   */
  this._cache = new epiviz.data.Cache(config, dataProviderFactory);

  /**
   * @type {Object.<string, epiviz.data.RequestStack>}
   * @private
   */
  this._combinedRequestsStacks = {};

  this._requestDataFailed = new epiviz.events.Event();  

  /**
   * @type {epiviz.events.Event.<{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestAddMeasurements = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestRemoveMeasurements = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{type: string, visConfigSelection: epiviz.ui.controls.VisConfigSelection, result: epiviz.events.EventResult.<{id: string}>}>}
   * @private
   */
  this._requestAddChart = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestRemoveChart = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestPrintWorkspace = new epiviz.events.Event();

    /**
   * @type {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestLoadWorkspace = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{seqInfos: Array.<epiviz.datatypes.SeqInfo>, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestAddSeqInfos = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{seqNames: Array.<string>, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestRemoveSeqNames = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{range: epiviz.datatypes.GenomicRange, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestNavigate = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestRedraw = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event}
   * @private
   */
  this._flushCache = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{datasourceGroup: string}>}
   * @private
   */
  this._clearDatasourceGroupCache = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestCurrentLocation = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestGetChartSettings = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestSetChartSettings = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestGetAvailableCharts = new epiviz.events.Event();

   /**
   * @type {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
   * @private
   */
  this._loadingCurrentDataSet = new epiviz.events.Event();


  this._registerProviderAddMeasurements();
  this._registerProviderRemoveMeasurements();
  this._registerProviderAddChart();
  this._registerProviderRemoveChart();
  this._registerProviderPrintWorkspace();
  this._registerProviderLoadWorkspace();
  this._registerProviderAddSeqInfos();
  this._registerProviderRemoveSeqNames();
  this._registerProviderNavigate();
  this._registerProviderRedraw();
  this._registerProviderFlushCache();
  this._registerProviderClearDatasourceGroupCache();
  this._registerProviderGetCurrentLocation();
  this._registerProviderGetChartSettings();
  this._registerProviderSetChartSettings();
  this._registerProviderGetAvailableCharts();

};

/**
 * @returns {epiviz.events.Event.<{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestAddMeasurements = function() { return this._requestAddMeasurements; };

/**
 * @returns {epiviz.events.Event.<{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestRemoveMeasurements = function() { return this._requestRemoveMeasurements; };

/**
 * @returns {epiviz.events.Event.<{type: string, visConfigSelection: epiviz.ui.controls.VisConfigSelection, result: epiviz.events.EventResult.<{id: string}>}>}
 */
epiviz.data.DataManager.prototype.onRequestAddChart = function() { return this._requestAddChart; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestRemoveChart = function() { return this._requestRemoveChart; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestPrintWorkspace = function() { return this._requestPrintWorkspace; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestLoadWorkspace = function() { return this._requestLoadWorkspace; };


/**
 * @returns {epiviz.events.Event.<{seqInfos: Array.<epiviz.datatypes.SeqInfo>, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestAddSeqInfos = function() { return this._requestAddSeqInfos; };

/**
 * @returns {epiviz.events.Event.<{seqNames: Array.<string>, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestRemoveSeqNames = function() { return this._requestRemoveSeqNames; };

/**
 * @returns {epiviz.events.Event.<{range: epiviz.datatypes.GenomicRange, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestNavigate = function() { return this._requestNavigate; };

/**
 * @returns {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestRedraw = function() { return this._requestRedraw; };

/**
 * @returns {epiviz.events.Event.<{datasourceGroup: string}>}
 */
epiviz.data.DataManager.prototype.onClearDatasourceGroupCache = function() { return this._clearDatasourceGroupCache; };

/**
 * @returns {epiviz.events.Event}
 */
epiviz.data.DataManager.prototype.onFlushCache = function() { return this._flushCache; };

/**
 * @returns {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestCurrentLocation = function() { return this._requestCurrentLocation; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestGetChartSettings = function() { return this._requestGetChartSettings; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestSetChartSettings = function() { return this._requestSetChartSettings; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestGetAvailableCharts = function() { return this._requestGetAvailableCharts; };


/**
 * @param {function(Array.<epiviz.datatypes.SeqInfo>)} callback
 */
epiviz.data.DataManager.prototype.getSeqInfos = function(callback) {
  var self = this;

  var nResponses = 0;

  var existingSeqNames = {};

  /** @type {Array.<epiviz.datatypes.SeqInfo>} */
  var result = [];
  this._dataProviderFactory.foreach(function(provider) {
    provider.getData(epiviz.data.Request.getSeqInfos(provider.id()),
      /**
       * @param {epiviz.data.Response.<Array.<Array>>} response Each element in the response is an array with three values:
       * the name of the sequence, the minimum and maximum values it can have
       */
      function(response) {
        var seqs = response.data();
        if (seqs) {
          if(!Array.isArray(seqs)) {
            var keys = Object.keys(seqs);
            for (var i=0; i<keys.length; i++) {
              if (!(keys[i] in existingSeqNames)) {
                result.push(epiviz.datatypes.SeqInfo.fromRawObject([keys[i], seqs[keys[i]][0], seqs[keys[i]][1]]));
                existingSeqNames[keys[i]] = true;
              }
            }
          }
          else {
            for (var i = 0; i < seqs.length; ++i) {
              if (!(seqs[i][0] in existingSeqNames)) {
                result.push(epiviz.datatypes.SeqInfo.fromRawObject(seqs[i]));
                existingSeqNames[seqs[i][0]] = true;
              }
            }
          }
        }

        if (++nResponses < self._dataProviderFactory.size()) { return; }

        callback(result.sort(epiviz.datatypes.SeqInfo.compare));
      });
  });
};

/**
 */
epiviz.data.DataManager.prototype.updateChartSettings = function(values) {
  var self = this;

  this._dataProviderFactory.foreach(function(provider) {

    if(provider.id().includes('websocket-')) {

      var colors = null;

      if(values.colorMap != null) {
        colors = values.colorMap._colors;
      }

      provider.updateChartSettings(epiviz.data.Request.createRequest({
            action: epiviz.data.Request.Action.SET_CHART_SETTINGS,
            settings: values.settings,
            colorMap: colors,
            chartId: values.chartId
      }),
          function() {
            //do nothing
          }
      );  
    }
  });
};


/**
 * @param {function(epiviz.measurements.MeasurementSet)} callback
 */
epiviz.data.DataManager.prototype.getMeasurements = function(callback) {
  var self = this;
  var result = new epiviz.measurements.MeasurementSet();

  var nResponses = 0;
  this._dataProviderFactory.foreach(function(provider) {
    provider.getData(epiviz.data.Request.getMeasurements(provider.id()),
      /**
       * @param {epiviz.data.Response.<{
       *   id: Array.<number>,
       *   name: Array.<string>,
       *   type: Array.<string>|string,
       *   datasourceId: Array.<string>|string,
       *   datasourceGroup: Array.<string>|string,
       *   defaultChartType: Array.<string>|string,
       *   annotation: Array.<Object.<string, string>>,
       *   minValue: Array.<number>|number,
       *   maxValue: Array.<number>|number,
       *   metadata: Array.<Array.<string>>|Array.<string>
       * }>} response
       */
      function(response) {
        var jsondata = response.data();

        if(self._config.configType == "default" && provider._id.indexOf("websocket") == -1) {
          self._loadingCurrentDataSet.notify({"dataset": provider.id(), "count": nResponses,
                         "size": self._dataProviderFactory.size(), "sampleSize": jsondata['id'].length,
                         "sequencingType": jsondata['sequencingType'] ? jsondata['sequencingType'][0] : null});
        }

        if (jsondata) {
          var n = jsondata['id'] ? (jsondata['id'].length || 0) : 0;
          for (var i = 0; i < n; ++i) {
            jsondata['annotation'][i]["sequencingType"] = jsondata['sequencingType'][i],

            result.add(new epiviz.measurements.Measurement(
              jsondata['id'][i],
              jsondata['name'][i],
              $.isArray(jsondata['type']) ? jsondata['type'][i] : jsondata['type'],
              $.isArray(jsondata['datasourceId']) ? jsondata['datasourceId'][i] : jsondata['datasourceId'],
              $.isArray(jsondata['datasourceGroup']) ? jsondata['datasourceGroup'][i] : jsondata['datasourceGroup'],
              provider.id(),
              null,
              $.isArray(jsondata['defaultChartType']) ? jsondata['defaultChartType'][i] : jsondata['defaultChartType'],
              jsondata['annotation'][i],
              $.isArray(jsondata['minValue']) ? jsondata['minValue'][i] : jsondata['minValue'],
              $.isArray(jsondata['maxValue']) ? jsondata['maxValue'][i] : jsondata['maxValue'],
              ($.isArray(jsondata['metadata']) && $.isArray(jsondata['metadata'][0])) ? jsondata['metadata'][i] : jsondata['metadata'],
              jsondata['datasourceDescription'][i]
            ));
          }
        }

        if (++nResponses < self._dataProviderFactory.size()) { return; }

        callback(result);
      });
  });
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, epiviz.datatypes.GenomicData)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.getData = function(range, chartMeasurementsMap, dataReadyCallback) {
  if (this._config.useCache) {
    this._cache.getData(range, chartMeasurementsMap, dataReadyCallback);
  } else {
    this._getDataNoCache(range, chartMeasurementsMap, dataReadyCallback);
  }
};

/**
 * TODO: Take care of computed measurements as well
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, epiviz.datatypes.GenomicData)} dataReadyCallback
 */
epiviz.data.DataManager.prototype._getDataNoCache = function(range, chartMeasurementsMap, dataReadyCallback) {
  var self = this;

  /** @type {Object.<string, epiviz.measurements.MeasurementSet>} */
  var msByDp = {};
  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }
    var chartMsByDp = chartMeasurementsMap[chartId].split(function(m) { return m.dataprovider(); });
    for (var dp in chartMsByDp) {
      if (!chartMsByDp.hasOwnProperty(dp)) { continue; }
      var dpMs = msByDp[dp];
      if (dpMs == undefined) { msByDp[dp] = chartMsByDp[dp]; }
      else { dpMs.addAll(chartMsByDp[dp]); }
    }
  }

  /**
   * @type {Object.<string, Object.<string, epiviz.datatypes.PartialSummarizedExperiment>>}
   */
  var allData = {};
  epiviz.utils.forEach(msByDp, function(dpMs, dataprovider) {
    var msByDs = dpMs.split(function(m) { return m.datasource().id(); });
    var request = epiviz.data.Request.getCombined(msByDs, range);

    var requestStack = self._combinedRequestsStacks[dataprovider];
    if (requestStack == undefined) {
      requestStack = new epiviz.data.RequestStack();
      self._combinedRequestsStacks[dataprovider] = requestStack;
    }

    requestStack.pushRequest(request, function(data) {
      var dataByDs = {};
      epiviz.utils.forEach(msByDs, function(dsMs, datasourceId) {
        var datasource = dsMs.first().datasource();
        var dsData = data[datasourceId];
        var sumExp = new epiviz.datatypes.PartialSummarizedExperiment();

        var noSampleData = [];
        for(var ecount =0; ecount < dsData.cols[Object.keys(dsData.cols)[0]].length; ecount++) {         
          noSampleData[ecount] = 0;       
        }

        var globalStartIndex = dsData.globalStartIndex;

        // if(isNaN(range._start)) {
        //  range._start = globalStartIndex;
        // }

        // if(isNaN(range._width)) {
        //   range._width = dsData.rows.end[dsData.rows.end.length-1] - range._start;
        // }

        var rowData = new epiviz.datatypes.GenomicRangeArray(datasource, range, globalStartIndex, dsData.rows);

        sumExp.addRowData(rowData);

        dsMs.foreach(function(m) {
          var valueData = new epiviz.datatypes.FeatureValueArray(m, range, globalStartIndex, dsData.cols[m.id()] || noSampleData );
          sumExp.addValues(valueData);
        });

        dataByDs[datasourceId] = sumExp;
      });

      allData[dataprovider] = dataByDs;
      self._serveAvailableData(range, chartMeasurementsMap, dataReadyCallback, allData);
    });

    var dataProvider = self._dataProviderFactory.get(dataprovider) || self._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
    dataProvider.getData(request, function(response) {
      if(response._data == null) {
        requestStack.clear();
        self._requestDataFailed.notify({"selection": dataProvider._lastSelection, "order": dataProvider._lastOrder, "selectedLevels": dataProvider._lastSelectedLevels});
      }
      else {
        requestStack.serveData(response);
      }
    });
  });
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, epiviz.datatypes.GenomicData)} dataReadyCallback
 * @param {Object.<string, Object.<string, epiviz.datatypes.PartialSummarizedExperiment>>} data
 * @private
 */
epiviz.data.DataManager.prototype._serveAvailableData = function(range, chartMeasurementsMap, dataReadyCallback, data) {
  var resolvedCharts = [];
  epiviz.utils.forEach(chartMeasurementsMap, function(ms, chartId) {
    var allMsDataFetched = true;
    var msDataMap = new epiviz.measurements.MeasurementHashtable();
    ms.foreach(function(m) {
      if (!(m.dataprovider() in data)) {
        allMsDataFetched = false;
        return true; // break
      }

      var msData = new epiviz.datatypes.MeasurementGenomicDataWrapper(m, data[m.dataprovider()][m.datasource().id()]);
      msDataMap.put(m, msData);
    });

    if (allMsDataFetched) {
      var genomicData = new epiviz.datatypes.MapGenomicData(msDataMap);
      dataReadyCallback(chartId, genomicData);
      resolvedCharts.push(chartId);
    }
  });

  resolvedCharts.forEach(function(chartId) { delete chartMeasurementsMap[chartId]; });
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, *)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.getPCA = function(range, chartMeasurementsMap, dataReadyCallback) {
  var self = this;

  /** @type {Object.<string, epiviz.measurements.MeasurementSet>} */
  var msByDp = {};
  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }     
    var chartMsByDp = chartMeasurementsMap[chartId].split(function(m) { return m.dataprovider(); });
    for (var dp in chartMsByDp) {
      if (!chartMsByDp.hasOwnProperty(dp)) { continue; }
      var dpMs = msByDp[dp];
      if (dpMs == undefined) { msByDp[dp] = chartMsByDp[dp]; }
      else { dpMs.addAll(chartMsByDp[dp]); }
    }
  }

  /**
   * @type {Object.<string, Object.<string, epiviz.datatypes.PartialSummarizedExperiment>>}
   */
  var allData = {};
  epiviz.utils.forEach(msByDp, function(dpMs, dataprovider) {
    var msByDs = dpMs.split(function(m) { return m.datasource().id(); });
    var request = epiviz.data.Request.getPCA(msByDs, range);
    var msName = Object.keys(msByDs)[0];

    var dataProvider = self._dataProviderFactory.get(dataprovider) || self._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
    dataProvider.getData(request, function(response) {
      var resp = response.data();
      if(response.data().dataprovidertype == "websocket") {
        resp = resp[msName];
      }
      dataReadyCallback(chartId, resp);
    });
  });
};


/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, *)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.getPCoA = function(range, chartMeasurementsMap, dataReadyCallback) {
  var self = this;

  /** @type {Object.<string, epiviz.measurements.MeasurementSet>} */
  var msByDp = {};
  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }     
    var chartMsByDp = chartMeasurementsMap[chartId].split(function(m) { return m.dataprovider(); });
    for (var dp in chartMsByDp) {
      if (!chartMsByDp.hasOwnProperty(dp)) { continue; }
      var dpMs = msByDp[dp];
      if (dpMs == undefined) { msByDp[dp] = chartMsByDp[dp]; }
      else { dpMs.addAll(chartMsByDp[dp]); }
    }
  }

  /**
   * @type {Object.<string, Object.<string, epiviz.datatypes.PartialSummarizedExperiment>>}
   */
  var allData = {};
  epiviz.utils.forEach(msByDp, function(dpMs, dataprovider) {
    var msByDs = dpMs.split(function(m) { return m.datasource().id(); });
    var request = epiviz.data.Request.getPCoA(msByDs, range);
    var msName = Object.keys(msByDs)[0];

    var dataProvider = self._dataProviderFactory.get(dataprovider) || self._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
    dataProvider.getData(request, function(response) {
      var resp = response.data();
      if(response.data().dataprovidertype == "websocket") {
        resp = resp[msName];
      }
      dataReadyCallback(chartId, resp);
    });
  });
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, *)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.getDiversity = function(range, chartMeasurementsMap, dataReadyCallback) {
  var self = this;

  /** @type {Object.<string, epiviz.measurements.MeasurementSet>} */
  var msByDp = {};
  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }     
    var chartMsByDp = chartMeasurementsMap[chartId].split(function(m) { return m.dataprovider(); });
    for (var dp in chartMsByDp) {
      if (!chartMsByDp.hasOwnProperty(dp)) { continue; }
      var dpMs = msByDp[dp];
      if (dpMs == undefined) { msByDp[dp] = chartMsByDp[dp]; }
      else { dpMs.addAll(chartMsByDp[dp]); }
    }
  }

  /**
   * @type {Object.<string, Object.<string, epiviz.datatypes.PartialSummarizedExperiment>>}
   */
  var allData = {};
  epiviz.utils.forEach(msByDp, function(dpMs, dataprovider) {
    var msByDs = dpMs.split(function(m) { return m.datasource().id(); });
    var request = epiviz.data.Request.getDiversity(msByDs, range);
    var msName = Object.keys(msByDs)[0];

    var dataProvider = self._dataProviderFactory.get(dataprovider) || self._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
    dataProvider.getData(request, function(response) {
      var resp = response.data();
      if(response.data().dataprovidertype == "websocket") {
        resp = resp[msName];
      }
      dataReadyCallback(chartId, resp);
    });
  });
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, *)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.getFeatureData = function(range, chartMeasurementsMap, chartSettings, dataReadyCallback) {
  var self = this;

  /** @type {Object.<string, epiviz.measurements.MeasurementSet>} */
  var msByDp = {};
  for (var chartId in chartMeasurementsMap) {
    if (!chartMeasurementsMap.hasOwnProperty(chartId)) { continue; }     
    var chartMsByDp = chartMeasurementsMap[chartId].split(function(m) { return m.dataprovider(); });
    for (var dp in chartMsByDp) {
      if (!chartMsByDp.hasOwnProperty(dp)) { continue; }
      var dpMs = msByDp[dp];
      if (dpMs == undefined) { msByDp[dp] = chartMsByDp[dp]; }
      else { dpMs.addAll(chartMsByDp[dp]); }
    }
  }

  /**
   * @type {Object.<string, Object.<string, epiviz.datatypes.PartialSummarizedExperiment>>}
   */
  var allData = {};
  epiviz.utils.forEach(msByDp, function(dpMs, dataprovider) {
    var msByDs = dpMs.split(function(m) { return m.datasource().id(); });
    var request = epiviz.data.Request.getFeatureData(msByDs, chartSettings, range);
    var msName = Object.keys(msByDs)[0];

    var dataProvider = self._dataProviderFactory.get(dataprovider) || self._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
    dataProvider.getData(request, function(response) {
      var resp = response.data();
      if(response.data().dataprovidertype == "websocket") {
        resp = resp[msName];
      }
      dataReadyCallback(chartId, resp);
    });
  });
};

/**
 * @param {Object.<string, epiviz.ui.controls.VisConfigSelection>} chartVisConfigSelectionMap
 * @param {function(string, *)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.getHierarchy = function(chartVisConfigSelectionMap, dataReadyCallback) {
  for (var chartId in chartVisConfigSelectionMap) {
    if (!chartVisConfigSelectionMap.hasOwnProperty(chartId)) { continue; }
    var visConfigSelection = chartVisConfigSelectionMap[chartId];
  }
  var dataprovider = visConfigSelection.dataprovider;
  if (!dataprovider) {
    visConfigSelection.measurements.foreach(function(m) {
      if (m.dataprovider()) {
        dataprovider = m.dataprovider();
        return true;
      }
      return false;
    });
  }
  var datasourceGroup = visConfigSelection.datasourceGroup;
  if(!datasourceGroup) {
      visConfigSelection.measurements.foreach(function(m) {
      if (m.datasourceGroup()) {
        datasourceGroup = m.datasourceGroup();
        return true;
      }
      return false;
    });
  }
  var provider = this._dataProviderFactory.get(dataprovider) || this._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
  provider.getData(epiviz.data.Request.getHierarchy(datasourceGroup, visConfigSelection.customData), function(response) {
    dataReadyCallback(chartId, response.data());
  });
};

/**
 * @param {Object.<string, epiviz.ui.controls.VisConfigSelection>} chartVisConfigSelectionMap
 * @param {function(string, *)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.propagateHierarchyChanges = function(chartVisConfigSelectionMap, dataReadyCallback) {
  for (var chartId in chartVisConfigSelectionMap) {
    if (!chartVisConfigSelectionMap.hasOwnProperty(chartId)) { continue; }
    var visConfigSelection = chartVisConfigSelectionMap[chartId];
    var dataprovider = visConfigSelection.dataprovider;
    if (!dataprovider) {
      visConfigSelection.measurements.foreach(function(m) {
        if (m.dataprovider()) {
          dataprovider = m.dataprovider();
          return true;
        }
        return false;
      });
    }
    var provider = this._dataProviderFactory.get(dataprovider) || this._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
    (function(chartId, provider, visConfigSelection) {
      provider.getData(epiviz.data.Request.propagateHierarchyChanges(
        visConfigSelection.datasourceGroup,
        visConfigSelection.customData.selection,
        visConfigSelection.customData.order,
        visConfigSelection.customData.selectedLevels), function(response) {

        setTimeout(function() {
          provider.onRequestClearDatasourceGroupCache().notify({
            datasourceGroup: visConfigSelection.datasourceGroup,
            result: new epiviz.events.EventResult()
          });
          provider.onRequestRedraw().notify({
            result: new epiviz.events.EventResult()
          });

          dataReadyCallback(chartId, response.data());
        }, 0);
      });
    })(chartId, provider, visConfigSelection);
  }
};


/**
 * @param {function(Array)} callback
 * @param {string} [filter]
 * @param {string} [requestWorkspaceId]
 */
epiviz.data.DataManager.prototype.getWorkspaces = function(callback, filter, requestWorkspaceId) {
  var workspaceProvider = this._dataProviderFactory.workspacesDataProvider();

  if (!workspaceProvider) { throw Error('Invalid data provider for workspaces (see Config.workspaceDataProvider)'); }

  workspaceProvider.getData(epiviz.data.Request.getWorkspaces(filter, requestWorkspaceId),
    /**
     * @param {epiviz.data.Response.<Array.<{id: string, id_v1: string, name: string, content: string}>>} response
     */
    function(response) {
      var wsRows = response.data();

      var workspaces = [];

      if (!wsRows || !wsRows.length) {
        // No workspaces in database
        callback(workspaces);
        return;
      }

      for (var i = 0; i < wsRows.length; ++i) {
        workspaces.push({
          id: wsRows[i].id,
          name: wsRows[i].name,
          content: JSON.parse(wsRows[i].content)
        });
      }
      callback(workspaces);
    });
};

/**
 * @param {epiviz.workspaces.Workspace} workspace
 * @param {epiviz.Config} config
 * @param {function(string)} callback
 */
epiviz.data.DataManager.prototype.saveWorkspace = function(workspace, config, callback) {
  var workspaceProvider = this._dataProviderFactory.workspacesDataProvider();

  if (!workspaceProvider) { throw Error('Invalid data provider for workspaces (see Config.workspaceDataProvider)'); }

  //workspaceProvider.saveWorkspace(workspace, callback);
  workspaceProvider.getData(epiviz.data.Request.saveWorkspace(workspace, config),
    /**
     * @param {epiviz.data.Response.<string>} response
     */
    function(response) {
      var workspaceId = response.data();
      callback(workspaceId);
    });
};

/**
 * @param {epiviz.workspaces.Workspace} workspace
 */
epiviz.data.DataManager.prototype.deleteWorkspace = function(workspace) {
  var workspaceProvider = this._dataProviderFactory.workspacesDataProvider();

  if (!workspaceProvider) { throw Error('Invalid data provider for workspaces (see Config.workspaceDataProvider)'); }

  workspaceProvider.getData(epiviz.data.Request.deleteWorkspace(workspace),
    /**
     * @param {epiviz.data.Response.<{success: boolean}>} response
     */
    function(response) {
      var success = response.data().success;
    });
};

/**
 * @param {function(Array)} callback
 * @param {string} query
 */
epiviz.data.DataManager.prototype.search = function(callback, query, chart) {
  var self = this;
  // var remainingResponses = this._dataProviderFactory.size();
  var results = [];

  var visConfigSelection = chart._properties.visConfigSelection;

  var dataprovider = visConfigSelection.dataprovider;
  if (!dataprovider) {
    visConfigSelection.measurements.foreach(function(m) {
      if (m.dataprovider()) {
        dataprovider = m.dataprovider();
        return true;
      }
      return false;
    });
  }
  var datasourceGroup = visConfigSelection.datasourceGroup;
  if(!datasourceGroup) {
      visConfigSelection.measurements.foreach(function(m) {
      if (m.datasourceGroup()) {
        datasourceGroup = m.datasourceGroup();
        return true;
      }
      return false;
    });
  }

  var provider = this._dataProviderFactory.get(dataprovider) || this._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
  provider.getData(epiviz.data.Request.search(query, self._config.maxSearchResults, datasourceGroup),
      /**
       * @param {epiviz.data.Response.<Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>>} response
       */
      function(response) {
        var providerResults = response.data().nodes;
        if (providerResults) {
          epiviz.utils.arrayAppend(results, providerResults);
        }
        callback(results);
    });
};

/**
 * @param {string} datasourceGroup
 */
epiviz.data.DataManager.prototype.clearDatasourceGroupCache = function(datasourceGroup) {
  this._cache.clearDatasourceGroupCache(datasourceGroup);
  this._clearDatasourceGroupCache.notify({datasourceGroup: datasourceGroup});
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderAddMeasurements = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestAddMeasurements().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestAddMeasurements.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderRemoveMeasurements = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestRemoveMeasurements().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestRemoveMeasurements.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderAddChart = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestAddChart().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestAddChart.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderRemoveChart = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestRemoveChart().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestRemoveChart.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderPrintWorkspace = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestPrintWorkspace().addListener(new epiviz.events.EventListener(
        function(e) {
          self._requestPrintWorkspace.notify(e);
        }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderLoadWorkspace = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestLoadWorkspace().addListener(new epiviz.events.EventListener(
        function(e) {
          self._requestLoadWorkspace.notify(e);
        }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderAddSeqInfos = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestAddSeqInfos().addListener(new epiviz.events.EventListener(
      /**
       * @param {{seqInfos: Array.<Array>, result: epiviz.events.EventResult}} e
       */
      function(e) {
        var seqInfos = [];
        for (var i = 0; i < e.seqInfos.length; ++i) {
          seqInfos.push(epiviz.datatypes.SeqInfo.fromRawObject(e.seqInfos[i]));
        }
        self._requestAddSeqInfos.notify({seqInfos: seqInfos, result: e.result});
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderRemoveSeqNames = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestRemoveSeqNames().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestRemoveSeqNames.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderNavigate = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestNavigate().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestNavigate.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderRedraw = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestRedraw().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestRedraw.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderClearDatasourceGroupCache = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestClearDatasourceGroupCache().addListener(new epiviz.events.EventListener(
      function(e) {
        self.clearDatasourceGroupCache(e.datasourceGroup);
        e.result.success = true;
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderFlushCache = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestFlushCache().addListener(new epiviz.events.EventListener(
      function(e) {
        self.flushCache();
        e.result.success = true;
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderGetCurrentLocation = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestCurrentLocation().addListener(new epiviz.events.EventListener(
      function(e) {
        self._requestCurrentLocation.notify(e);
      }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderSetChartSettings = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestSetChartSettings().addListener(new epiviz.events.EventListener(
        function(e) {
          self._requestSetChartSettings.notify(e);
        }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderGetChartSettings = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestGetChartSettings().addListener(new epiviz.events.EventListener(
        function(e) {
          self._requestGetChartSettings.notify(e);
        }));
  });
};

/**
 * @private
 */
epiviz.data.DataManager.prototype._registerProviderGetAvailableCharts = function() {
  var self = this;
  this._dataProviderFactory.foreach(function(/** @type {epiviz.data.DataProvider} */ provider) {
    provider.onRequestGetChartSettings().addListener(new epiviz.events.EventListener(
        function(e) {
          self._requestGetAvailableCharts.notify(e);
        }));
  });
};


/**
 * @private
 */
epiviz.data.DataManager.prototype.updateSplines = function(settings) {
  var self = this;
  this._dataProviderFactory.foreach(function(provider) {

    if(provider.id().includes('websocket-')) {
      provider.updateSplines(epiviz.data.Request.createRequest({
            action: epiviz.data.Request.Action.SPLINES_SETTINGS,
            settings: settings,
      }),
          function() {
            provider.onRequestRedraw().notify({
              result: new epiviz.events.EventResult()
            });
          }
      );  
    }
  });
};
