/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 7:50 PM
 */

goog.provide('epiviz.data.DataManager');

goog.require('epiviz.data.DataProvider');
goog.require('epiviz.data.DataProviderFactory');
goog.require('epiviz.measurements.MeasurementSet');
goog.require('epiviz.events.EventListener');

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
   * @type {epiviz.events.Event.<{type: string, measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult.<{id: string}>}>}
   * @private
   */
  this._requestAddChart = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestRemoveChart = new epiviz.events.Event();

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

  this._registerProviderAddMeasurements();
  this._registerProviderRemoveMeasurements();
  this._registerProviderAddChart();
  this._registerProviderRemoveChart();
  this._registerProviderAddSeqInfos();
  this._registerProviderRemoveSeqNames();
  this._registerProviderNavigate();
  this._registerProviderRedraw();
  this._registerProviderFlushCache();
  this._registerProviderClearDatasourceGroupCache();
  this._registerProviderGetCurrentLocation();
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
 * @returns {epiviz.events.Event.<{type: string, measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult.<{id: string}>}>}
 */
epiviz.data.DataManager.prototype.onRequestAddChart = function() { return this._requestAddChart; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataManager.prototype.onRequestRemoveChart = function() { return this._requestRemoveChart; };

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
 * @param {function(Array.<epiviz.datatypes.SeqInfo>)} callback
 */
epiviz.data.DataManager.prototype.getSeqInfos = function(callback) {
  var self = this;

  var nResponses = 0;

  var existingSeqNames = {};

  /** @type {Array.<epiviz.datatypes.SeqInfo>} */
  var result = [];
  this._dataProviderFactory.foreach(function(provider) {
    provider.getData(epiviz.data.Request.getSeqInfos(),
      /**
       * @param {epiviz.data.Response.<Array.<Array>>} response Each element in the response is an array with three values:
       * the name of the sequence, the minimum and maximum values it can have
       */
      function(response) {
        var seqs = response.data();
        if (seqs) {
          for (var i = 0; i < seqs.length; ++i) {
            if (!(seqs[i][0] in existingSeqNames)) {
              result.push(epiviz.datatypes.SeqInfo.fromRawObject(seqs[i]));
              existingSeqNames[seqs[i][0]] = true;
            }
          }
        }

        if (++nResponses < self._dataProviderFactory.size()) { return; }

        callback(result.sort(epiviz.datatypes.SeqInfo.compare));
      });
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
    provider.getData(epiviz.data.Request.getMeasurements(),
      /**
       * @param {epiviz.data.Response.<{
       *   id: Array.<number>,
       *   name: Array.<string>,
       *   type: Array.<string>,
       *   datasourceId: Array.<string>,
       *   datasourceGroup: Array.<string>,
       *   defaultChartType: Array.<string>,
       *   annotation: Array.<Object.<string, string>>,
       *   minValue: Array.<number>,
       *   maxValue: Array.<number>,
       *   metadata: Array.<Array.<string>>
       * }>} response
       */
      function(response) {
        var jsondata = response.data();

        if (jsondata) {
          var n = jsondata['id'] ? (jsondata['id'].length || 0) : 0;
          for (var i = 0; i < n; ++i) {
            result.add(new epiviz.measurements.Measurement(
              jsondata['id'][i],
              jsondata['name'][i],
              jsondata['type'][i],
              jsondata['datasourceId'][i],
              jsondata['datasourceGroup'][i],
              provider.id(),
              null,
              jsondata['defaultChartType'][i],
              jsondata['annotation'][i],
              jsondata['minValue'][i],
              jsondata['maxValue'][i],
              jsondata['metadata'][i]
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
 * @param {function(string, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>)} dataReadyCallback
 */
epiviz.data.DataManager.prototype.getData = function(range, chartMeasurementsMap, dataReadyCallback) {
  this._cache.getData(range, chartMeasurementsMap, dataReadyCallback);
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
 * @param {function(string)} callback
 */
epiviz.data.DataManager.prototype.saveWorkspace = function(workspace, callback) {
  var workspaceProvider = this._dataProviderFactory.workspacesDataProvider();

  if (!workspaceProvider) { throw Error('Invalid data provider for workspaces (see Config.workspaceDataProvider)'); }

  //workspaceProvider.saveWorkspace(workspace, callback);
  workspaceProvider.getData(epiviz.data.Request.saveWorkspace(workspace),
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

  //workspaceProvider.saveWorkspace(workspace, callback);
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
epiviz.data.DataManager.prototype.search = function(callback, query) {
  var self = this;
  var remainingResponses = this._dataProviderFactory.size();
  var results = [];
  this._dataProviderFactory.foreach(function(provider) {
    provider.getData(epiviz.data.Request.search(query, self._config.maxSearchResults),
      /**
       * @param {epiviz.data.Response.<Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>>} response
       */
      function(response) {
        var providerResults = response.data();
        if (providerResults) {
          epiviz.utils.arrayAppend(results, providerResults);
        }

        --remainingResponses;

        if (!remainingResponses) {
          callback(results);
        }
      });
  });
};

/**
 * Clears all data from cache
 */
epiviz.data.DataManager.prototype.flushCache = function() {
  this._cache.flush();
  this._flushCache.notify();
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
