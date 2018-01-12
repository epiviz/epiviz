/**
 * Created by: Florin Chelaru
 * Date: 10/2/13
 * Time: 12:46 PM
 */

goog.provide('epiviz.EpiViz');

goog.require('epiviz.ui.charts.VisualizationType');
goog.require('epiviz.workspaces.Workspace');
goog.require('epiviz.events.EventListener');
goog.require('epiviz.ui.controls.MessageDialog');
goog.require('epiviz.datatypes.GenomicRange');

/**
 * @param {epiviz.Config} config
 * @param {epiviz.ui.LocationManager} locationManager
 * @param {epiviz.measurements.MeasurementsManager} measurementsManager
 * @param {epiviz.ui.ControlManager} controlManager
 * @param {epiviz.data.DataManager} dataManager
 * @param {epiviz.ui.charts.ChartFactory} chartFactory
 * @param {epiviz.ui.charts.ChartManager} chartManager
 * @param {epiviz.workspaces.WorkspaceManager} workspaceManager
 * @param {epiviz.workspaces.UserManager} userManager
 * @param {epiviz.ui.WebArgsManager} webArgsManager
 * @param {epiviz.localstorage.LocalStorageManager} [cookieManager]
 * @constructor
 */
epiviz.EpiViz = function(config, locationManager, measurementsManager, controlManager, dataManager, chartFactory, chartManager, workspaceManager, userManager, webArgsManager, cookieManager) {
  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {epiviz.ui.LocationManager}
   * @private
   */
  this._locationManager = locationManager;

  /**
   * @type {epiviz.measurements.MeasurementsManager}
   * @private
   */
  this._measurementsManager = measurementsManager;

  /**
   * @type {epiviz.ui.ControlManager}
   * @private
   */
  this._controlManager = controlManager;

  /**
   * @type {epiviz.data.DataManager}
   * @private
   */
  this._dataManager = dataManager;

  /**
   * @type {epiviz.ui.charts.ChartFactory}
   * @private
   */
  this._chartFactory = chartFactory;

  /**
   * @type {epiviz.ui.charts.ChartManager}
   * @private
   */
  this._chartManager = chartManager;

  /**
   * @type {epiviz.workspaces.WorkspaceManager}
   * @private
   */
  this._workspaceManager = workspaceManager;

  /**
   * @type {epiviz.workspaces.UserManager}
   * @private
   */
  this._userManager = userManager;

  /**
   * @type {epiviz.ui.WebArgsManager}
   * @private
   */
  this._webArgsManager = webArgsManager;

  /**
   * @type {epiviz.localstorage.LocalStorageManager}
   * @private
   */
  this._cookieManager = cookieManager;

  // Register for UI events

  this._registerRequestSeqInfos();
  this._registerRequestMeasurements();

  this._registerUiAddChart();
  this._registerUiSaveWorkspace();
  this._registerUiDeleteActiveWorkspace();
  this._registerUiRevertActiveWorkspace();
  this._registerUiLoginLinkClicked();
  this._registerUiSearchWorkspaces();
  this._registerUiActiveWorkspaceChanged();
  this._registerUiSearch();

  this._registerChartRequestHierarchy();
  this._registerChartPropagateHierarchySelection();

  this._registerChartPropogateIcicleLocationChange();

  this._registerUiSettingsChanged();

  // Register for Data events

  this._registerDataAddMeasurements();
  this._registerDataRemoveMeasurements();
  this._registerDataAddChart();
  this._registerDataRemoveChart();
  this._registerDataAddSeqInfos();
  this._registerDataRemoveSeqNames();
  this._registerDataNavigate();
  this._registerDataRedraw();
  this._registerDataGetCurrentLocation();
  this._registerPrintWorkspace();
  this._registerLoadWorkspace();
  this._registerDataSetChartSettings();
  this._registerDataGetChartSettings();
  this._registerDataGetAvailableCharts();

  // Register for Workspace events

  this._registerRequestWorkspaces();
  this._registerWorkspacesLoaded();
  this._registerActiveWorkspaceChanged();
  this._registerActiveWorkspaceContentChanged();
  this._registerLocationChanged();

  // Register Loading App events
  this._registerLoadingAppScreen();
  this._registerChartRequestFeature();
  this._registerHierarchyChartRequestAddFeature();


  this._registerDataFailed();

  /*
   * Prevent closing if workspace has changed
   */
  var self = this;
  // TODO: Cleanup
  /*window.onbeforeunload = function() {
    if (epiviz.workspaces.UserManager.USER_STATUS.loggedIn && self._workspaceManager.activeWorkspace().changed()) {
      return 'There are unsaved changes in the current workspace.';
    }
    return undefined;
   };*/
};

/**
 * @type {string}
 * @const
 */
epiviz.EpiViz.VERSION = '4';

epiviz.EpiViz.prototype.start = function() {

  this._measurementsManager.initialize();
  this._cookieManager.initialize();
  this._locationManager.initialize();
  this._controlManager.initialize();
  this._workspaceManager.initialize();

  var requestWorkspaceId = epiviz.ui.WebArgsManager.WEB_ARGS['ws'] || epiviz.ui.WebArgsManager.WEB_ARGS['workspace'] || null;
  var metavizr = epiviz.ui.WebArgsManager.WEB_ARGS['websocket-host'] || null;
  
  if (requestWorkspaceId == null && metavizr == null) {
    this._controlManager.startApp();
  }
};

/**
 * @returns {epiviz.Config}
 */
epiviz.EpiViz.prototype.config = function() {
  return this._config;
};

/**
 * @param {epiviz.ui.charts.ChartType} type
 * @param {epiviz.ui.controls.VisConfigSelection} visConfigSelection
 * @param {string} [chartId] If specified, then this will be
 *   the id of the newly created chart. Otherwise, a new one
 *   will be generated.
 * @param {epiviz.ui.charts.VisualizationProperties} [chartProperties]
 * @returns {string} the id of the chart just created
 * @private
 */
epiviz.EpiViz.prototype._addChart = function(type, visConfigSelection, chartId, chartProperties, chartTitle) {
  chartId = this._chartManager.addChart(type, visConfigSelection, chartId, chartProperties, chartTitle);
  var self = this;
  // TODO: Maybe later implement hierarchical display type (see display-type.js for the start of the idea)
  if (type.typeName() == 'epiviz.plugins.charts.PCAScatterPlot'){
    var range = null;
    var chartMeasurementsMap = {};
    chartMeasurementsMap[chartId] = visConfigSelection.measurements;
    this._dataManager.getPCA(range, chartMeasurementsMap,
      function(chartId, data) {
        self._chartManager.updateCharts(range, data, [chartId]);
      });
  }
  else if (type.typeName() == 'epiviz.plugins.charts.PCoAScatterPlot'){
    var range = null;
    var chartMeasurementsMap = {};
    chartMeasurementsMap[chartId] = visConfigSelection.measurements;
    this._dataManager.getPCoA(range, chartMeasurementsMap,
      function(chartId, data) {
        self._chartManager.updateCharts(range, data, [chartId]);
      });
  }
  else if (type.typeName() == 'epiviz.plugins.charts.DiversityScatterPlot'){
    var range = null;
    var chartMeasurementsMap = {};
    chartMeasurementsMap[chartId] = visConfigSelection.measurements;
    this._dataManager.getDiversity(range, chartMeasurementsMap,
      function(chartId, data) {
        self._chartManager.updateCharts(range, data, [chartId]);
      });
  }
  else if (type.chartDisplayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) {
    var chartVisConfigSelectionMap = {};
    chartVisConfigSelectionMap[chartId] = visConfigSelection;
    var range = this._workspaceManager.activeWorkspace().range();
    var seqInfo = this._locationManager._seqInfos[visConfigSelection.datasourceGroup] || this._locationManager._seqInfos["metavizr"];
    // var range = new epiviz.datatypes.GenomicRange(seqInfo.seqName, seqInfo.min, seqInfo.max);
    if(seqInfo) {
      range = new epiviz.datatypes.GenomicRange(seqInfo.seqName, seqInfo.min, seqInfo.max);
    }
    this._locationManager.changeCurrentLocation(range);
    this._dataManager.getHierarchy(chartVisConfigSelectionMap,
      function(chartId, hierarchy) {
        self._chartManager.updateCharts(range, hierarchy, [chartId]);
      });
  } 
  else if (type.typeName() == "epiviz.plugins.charts.FeatureScatterPlot")  {
    var range = null;
    var chartMeasurementsMap = {};
    chartMeasurementsMap[chartId] = visConfigSelection.measurements;
    var properties = type.customSettingsValues();
    if(chartProperties) {
      properties = chartProperties.customSettingsValues;
    }
    this._dataManager.getFeatureData(range, chartMeasurementsMap, properties,
      function(chartId, data) {
        self._chartManager.updateCharts(range, data, [chartId]);
      });
  } 
  else {
    var range = this._workspaceManager.activeWorkspace().range();
    this._chartManager.dataWaitStart(chartId);
    var chartMeasurementsMap = {};
    chartMeasurementsMap[chartId] = visConfigSelection.measurements;
    this._dataManager.getData(range, chartMeasurementsMap,
      function(chartId, data) {
        self._chartManager.updateCharts(range, data, [chartId]);
      });
  }

  // if (type.chartDisplayType() != epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) {
  //   var mCount = 0;
  //   //add measurements as a new datasource
  //   var chartMs = visConfigSelection.measurements;
  //   chartMs.foreach(function(m, i) {
  //     if(m._datasourceGroup.indexOf('_plot-') == -1 ) {
  //       m._datasourceGroup = m._datasourceGroup + "_" + chartId;
  //       mCount++;
  //     }
  //   });

  //   if (mCount > 0) {
  //     this._measurementsManager.addMeasurements(chartMs);
  //   }
  // }

  return chartId;
};

/*****************************************************************************
 * UI Events                                                                 *
 *****************************************************************************/

/**
 * @private
 */
epiviz.EpiViz.prototype._registerRequestSeqInfos = function() {
  var self = this;
  this._locationManager.onRequestSeqInfos().addListener(new epiviz.events.EventListener(
    function() {
      self._dataManager.getSeqInfos(function(seqInfos) {
        self._locationManager.updateSeqInfos(seqInfos);
      });
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerRequestMeasurements = function() {
  var self = this;
  this._measurementsManager.onRequestMeasurements().addListener(new epiviz.events.EventListener(
    function() {
      self._dataManager.getMeasurements(function(measurements) {
        self._measurementsManager.addMeasurements(measurements);

        //self._workspaceManager.initialize();
      });
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerRequestWorkspaces = function() {
  var self = this;
  this._workspaceManager.onRequestWorkspaces().addListener(new epiviz.events.EventListener(
    /**
     * @param {{activeWorkspaceId: string}} e
     */
    function(e) {
      var cookieWorkspace = self._cookieManager.getWorkspace(self._chartFactory, self._config);
      self._dataManager.getWorkspaces(function(rawWorkspaces) {
        var ws = [];
        var activeWorkspace = null;
        var unchangedActiveWorkspace = null;
        for (var i = 0; i < rawWorkspaces.length; ++i) {
           var w = epiviz.workspaces.Workspace.fromRawObject(rawWorkspaces[i], self._chartFactory, self._config);

          if (w.id() === null) {
            // This is a workspace retrieved using e.activeWorkspaceId
            // and belonging to another user
            activeWorkspace = w;
            continue;
          }

          if (w.id() == e.activeWorkspaceId) {
            if (cookieWorkspace && cookieWorkspace.id() == e.activeWorkspaceId) {
              unchangedActiveWorkspace = w;
              w = cookieWorkspace;
            }
            activeWorkspace = w;
          }

          ws.push(w);
        }

        // if (!activeWorkspace && cookieWorkspace) {
        //   unchangedActiveWorkspace = self._workspaceManager.get(cookieWorkspace.id());
        //   if (!unchangedActiveWorkspace) {
        //     cookieWorkspace = cookieWorkspace.copy(cookieWorkspace.name());
        //     unchangedActiveWorkspace = epiviz.workspaces.Workspace.fromRawObject(self._config.defaultWorkspaceSettings, self._chartFactory, self._config);
        //   }
        //   activeWorkspace = cookieWorkspace;
        // }

        self._workspaceManager.updateWorkspaces(ws, activeWorkspace, e.activeWorkspaceId, unchangedActiveWorkspace);
        if (!cookieWorkspace) { self._workspaceManager.activeWorkspace().resetChanged(); }
       }, '', e.activeWorkspaceId);
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiAddChart = function() {
  var self = this;
  this._controlManager.onAddChart().addListener(new epiviz.events.EventListener(
    /** @param {{type: epiviz.ui.charts.ChartType, visConfigSelection: epiviz.ui.controls.VisConfigSelection}} e */
    function(e) {
      self._addChart(e.type, e.visConfigSelection, undefined, undefined, e.title);
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiSaveWorkspace = function() {
  var self = this;
  this._controlManager.onSaveWorkspace().addListener(new epiviz.events.EventListener(
    /**
     * @param {{name: string, id: ?string}} e
     */
    function(e) {
      // If there is a workspace with this name in the set of workspaces, overwrite it
      // Otherwise, create a copy of the active workspace with the new name, and save that.
      var workspace = self._workspaceManager.getByName(e.name);
      if (workspace) {
        workspace = self._workspaceManager.activeWorkspace().copy(e.name, workspace.id());
      } else {
        workspace = self._workspaceManager.activeWorkspace().copy(e.name);
      }

      self._dataManager.saveWorkspace(workspace, self._config, function(id) {
        workspace = workspace.copy(workspace.name(), id);
        workspace.resetChanged();

        self._workspaceManager.updateWorkspace(workspace);
        self._workspaceManager.changeActiveWorkspace(id);
      });
    }
  ));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiDeleteActiveWorkspace = function() {
  var self = this;
  this._controlManager.onDeleteActiveWorkspace().addListener(new epiviz.events.EventListener(
    function() {
      self._dataManager.deleteWorkspace(self._workspaceManager.activeWorkspace());
      self._workspaceManager.deleteActiveWorkspace();
    }
  ));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiRevertActiveWorkspace = function() {
  var self = this;
  this._controlManager.onRevertActiveWorkspace().addListener(new epiviz.events.EventListener(
    function() {
      self._workspaceManager.revertActiveWorkspace();
    }
  ));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiLoginLinkClicked = function() {
  var self = this;
  this._controlManager.onLoginLinkClicked().addListener(new epiviz.events.EventListener(function() {
    self._userManager.toggleLogin();
  }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiSearchWorkspaces = function() {
  var self = this;
  this._controlManager.onSearchWorkspaces().addListener(new epiviz.events.EventListener(
    /**
     * @param {{searchTerm: string, callback: function(Array.<epiviz.workspaces.Workspace>)}} e
     */
    function(e) {
      self._dataManager.getWorkspaces(function(workspaces) {
        e.callback(workspaces);
      }, e.searchTerm, e.searchTerm);
    }
  ))
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiActiveWorkspaceChanged = function() {
  var self = this;
  this._controlManager.onActiveWorkspaceChanged().addListener(new epiviz.events.EventListener(
    /**
     * @param {{oldValue: {id: string, name: string}, newValue: {id: string, name: string}, cancel: function}} e
     */
    function(e) {

      var doChangeActiveWorkspace = function() {
        if (e.newValue.id && !self._workspaceManager.get(e.newValue.id)) {
          // The requested workspace id belongs to another user, so it has to be retrieved
          self._dataManager.getWorkspaces(function(rawWorkspaces) {
            var result = null;
            for (var i = 0; i < rawWorkspaces.length; ++i) {
              var w = epiviz.workspaces.Workspace.fromRawObject(rawWorkspaces[i], self._chartFactory, self._config);

              if (w.id() === null) {
                // This is a workspace retrieved using e.activeWorkspaceId
                // and belonging to another user
                result = w;
                break;
              }
            }

            if (result) {
              self._workspaceManager.changeActiveWorkspace(e.newValue.id, result);
            }
          }, e.newValue.name, e.newValue.id);
        } else { self._workspaceManager.changeActiveWorkspace(e.newValue.id); }
      };

      if (epiviz.workspaces.UserManager.USER_STATUS.loggedIn && !self._workspaceManager.activeWorkspaceChanging() && self._workspaceManager.activeWorkspace().changed()) {
        var dialog = new epiviz.ui.controls.MessageDialog(
          'Discard workspace changes',
          {
            Yes: function() {
              doChangeActiveWorkspace();
            },
            No: function() {
              e.cancel();
            }
          },
          'There are unsaved changes in the current workspace. Do you wish to discard them?',
          epiviz.ui.controls.MessageDialog.Icon.QUESTION);
        dialog.show();
      } else {
        doChangeActiveWorkspace();
      }
    }
  ));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiSearch = function() {
  var self = this;
  this._controlManager.onSearch().addListener(new epiviz.events.EventListener(
    /**
     * @param {{searchTerm: string, callback: (function(Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>))}} e
     */
    function(e) {

      // find current icicle on the workspace
      var iciclePlot, icicleMeasuremens;

      for (var chartId in self._chartManager._charts) {
          if (!self._chartManager._charts.hasOwnProperty(chartId)) { continue; }
          if (self._chartManager._charts[chartId].displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) { 
            iciclePlot = self._chartManager._charts[chartId]; 
            // icicleMeasuremens = self._chartManager._charts[chartId].measurements();
          } 
        }

      if(iciclePlot != null || iciclePlot != undefined) {
        self._dataManager.search(function(results) {
          e.callback(results);
        }, e.searchTerm, iciclePlot);
      }

    }));

  this._chartManager._chartFeatureSearchEvent.addListener(new epiviz.events.EventListener(
    function(e) {
      // find current icicle on the workspace
      var iciclePlot, icicleMeasuremens;
      for (var chartId in self._chartManager._charts) {
          if (!self._chartManager._charts.hasOwnProperty(chartId)) { continue; }
          if (self._chartManager._charts[chartId].displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) { 
            iciclePlot = self._chartManager._charts[chartId]; 
            // icicleMeasuremens = self._chartManager._charts[chartId].measurements();
          } 
        }

      if(iciclePlot != null || iciclePlot != undefined) {
        self._dataManager.search(function(results) {
          e.callback(results);
        }, e.searchTerm, iciclePlot);
      }
  }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerChartRequestHierarchy = function() {
  var self = this;

  this._chartManager.onChartRequestHierarchy().addListener(new epiviz.events.EventListener(function(e) {
    var map = {};
    map[e.id] = e.args;
    self._dataManager.getHierarchy(map, function(chartId, data) {

      var SunburstPlot;

      for (var schartId in self._chartManager._charts) {
          if (!self._chartManager._charts.hasOwnProperty(schartId)) { continue; }
          if (self._chartManager._charts[schartId].type == "Sunburst") { 
            SunburstPlot = schartId; 
          } 
        }

      self._chartManager.updateCharts(undefined, data, [chartId, SunburstPlot]);
    });
  }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerChartRequestFeature = function() {
  var self = this;
  self._chartManager._chartFeatureGetDataEvent.addListener(new epiviz.events.EventListener(function(e) {
    var chart = self._chartManager._charts[e.chartId];
    var chartMeasurementsMap = {};
    chartMeasurementsMap[e.chartId] = chart._properties.visConfigSelection.measurements;
    self._dataManager.getFeatureData(null, chartMeasurementsMap, chart.customSettingsValues(),
      function(chartId, data) {
        self._chartManager.updateCharts(null, data, [chartId]);
      });
  }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerHierarchyChartRequestAddFeature = function() {
  var self = this;
  self._chartManager._heatmapAddFeatureChartEvent.addListener(new epiviz.events.EventListener(function(e) {
    var currentFeaturePlot = null, currentFeatureChartId = null;
    for (var chartId in self._chartManager._charts) {
      if (!self._chartManager._charts.hasOwnProperty(chartId)) { continue; }
      if (self._chartManager._charts[chartId]._featureType == "featureScatterPlot") { 
        currentFeaturePlot = self._chartManager._charts[chartId]; 
        currentFeatureChartId = chartId;
        // icicleMeasuremens = self._chartManager._charts[chartId].measurements();
      } 
    }

    if(currentFeaturePlot) {
      var vals = currentFeaturePlot.customSettingsValues();
      vals.featureId = e.featureId;
      vals.featureName = e.featureName;
      vals.rowLabel = e.rowLabel;
      self._chartManager._chartFeatureGetDataEvent.notify({"chartId": currentFeatureChartId});
    }
    else {
      var chartType = self._chartFactory._types["epiviz.plugins.charts.FeatureScatterPlot"];

      var vconfig = new epiviz.ui.controls.VisConfigSelection(
        e.measurements, // measurements
        undefined, // datasource
        undefined, // datasourceGroup
        undefined, // dataprovider
        undefined, // annotation
        chartType.chartName(), // defaultChartType
        chartType.minSelectedMeasurements());

      var chartProperties = new epiviz.ui.charts.VisualizationProperties(
        chartType.defaultWidth(), // width
        chartType.defaultHeight(), // height
        chartType.defaultMargins(), // margins
        vconfig, // configuration of measurements and other information selected by the user
        chartType.defaultColors(), // colors
        null, // modified methods
        chartType.customSettingsValues(),
        chartType.customSettingsDefs(),
        []
      );

      chartProperties.customSettingsValues.featureId = e.featureId;
      chartProperties.customSettingsValues.featureName = e.featureName;
      chartProperties.customSettingsValues.rowLabel = e.rowLabel;

      self._addChart(chartType, vconfig, undefined, chartProperties, "");
    }
  }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerChartPropagateHierarchySelection = function() {
  var self = this;
  this._chartManager.onChartPropagateHierarchyChanges().addListener(new epiviz.events.EventListener(function(e) {
    var map = {};
    map[e.id] = e.args;
    self._dataManager.propagateHierarchyChanges(map, function(chartId, data) {
      self._chartManager.updateCharts(undefined, data, [chartId]);
    })
  }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataFailed = function() {
  var self = this;
  this._dataManager._requestDataFailed.addListener(new epiviz.events.EventListener(function(e) {

    var iciclePlot, iciclePlotId;
    for (var chartId in self._chartManager._charts) {
        if (!self._chartManager._charts.hasOwnProperty(chartId)) { continue; }
        if (self._chartManager._charts[chartId].displayType() == epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE) { 
          iciclePlot = self._chartManager._charts[chartId]; 
          iciclePlotId = chartId;
          // icicleMeasuremens = self._chartManager._charts[chartId].measurements();
        } 
      }

    var map = {};
    map[iciclePlotId] = new epiviz.ui.controls.VisConfigSelection(undefined, undefined, 
        iciclePlot.datasourceGroup(), iciclePlot.dataprovider(), undefined, undefined, undefined,
        e);


        var diffNode = _.omit(iciclePlot._selectedNodes, function(v,k) {return e.selection[k] == v;});
        
            iciclePlot.selectNode(iciclePlot._uiDataMap[Object.keys(diffNode)[0]]);
            iciclePlot.selectNode(iciclePlot._uiDataMap[Object.keys(diffNode)[0]]);

    iciclePlot._selectedNodes = e.selection;
    iciclePlot._nodesOrder = e.order;
    iciclePlot._selectedLevels = e.selectedLevels;

    var dataProvider = self._dataManager._dataProviderFactory.get(iciclePlot.dataprovider()) || self._dataManager._dataProviderFactory.get(epiviz.data.EmptyResponseDataProvider.DEFAULT_ID);
    
    dataProvider._selectedLevels = dataProvider._lastSelectedLevels;
    dataProvider._lastRoot = dataProvider._lastLastRoot;
    dataProvider._selection = dataProvider._lastSelection;
    dataProvider._order = dataProvider._lastOrder;

    iciclePlot._svg.select('.items').empty();

    iciclePlot.draw();
    // iciclePlot.firePropagateHierarchyChanges();

    self._dataManager.propagateHierarchyChanges(map, function(chartId, data) {
      self._chartManager.updateCharts(undefined, data, [chartId]);
    });

    
    // self._dataManager.propagateHierarchyChanges(map, function(chartId, data) {
    //   self._chartManager.updateCharts(undefined, data, [chartId]);
    // });
  }));
};


/**
 * @private
 */
epiviz.EpiViz.prototype._registerUiSettingsChanged = function() {
  var self = this;
  this._workspaceManager.onUiChartSettingsChanged().addListener(new epiviz.events.EventListener(
      function(e) {
        //do nothing!
        self._dataManager.updateChartSettings(e);
      }));
};

/*****************************************************************************
 * Data                                                                      *
 *****************************************************************************/

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataAddMeasurements = function() {
  var self = this;
  this._dataManager.onRequestAddMeasurements().addListener(new epiviz.events.EventListener(
    /** @param {{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}} e */
    function(e) {
      try {
        self._measurementsManager.addMeasurements(e.measurements);
        e.result.success = true;
      } catch (error) {
        e.result.success = false;
        e.result.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataRemoveMeasurements = function() {
  var self = this;
  this._dataManager.onRequestRemoveMeasurements().addListener(new epiviz.events.EventListener(
    /** @param {{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}} e */
      function(e) {
      try {
        self._measurementsManager.removeMeasurements(e.measurements);
        e.result.success = true;
      } catch (error) {
        e.result.success = false;
        e.result.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataAddChart = function() {
  var self = this;
  this._dataManager.onRequestAddChart().addListener(new epiviz.events.EventListener(
    /** @param {{type: string, visConfigSelection: epiviz.ui.controls.VisConfigSelection, result: epiviz.events.EventResult}} e */
    function(e) {
      try {
        var chartType = self._chartFactory.get(e.type);
        var chartId = self._addChart(chartType, e.visConfigSelection);
        e.result.success = true;
        e.result.value = { id: chartId };
      } catch (error) {
        e.result.success = false;
        e.result.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataRemoveChart = function() {
  var self = this;
  this._dataManager.onRequestRemoveChart().addListener(new epiviz.events.EventListener(
    /**
     * @param {{id: string, result: epiviz.events.EventResult}} e
     */
    function(e) {
      try {
        self._chartManager.removeChart(e.id);
        e.result.success = true;
      } catch (error) {
        e.result.success = false;
        e.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerPrintWorkspace = function() {
  var self = this;
  this._dataManager.onRequestPrintWorkspace().addListener(new epiviz.events.EventListener(
      /**
       * @param {{id: string, result: epiviz.events.EventResult}} e
       */
      function(e) {
        try {
          var pm = new epiviz.ui.PrintManager(e.chartId, e.fileName, e.fileType);
          pm.print();
          //self._controlManager.printWorkspace(e.chartId, e.fileName, e.fileType);
          e.result.success = true;
        } catch (error) {
          e.result.success = false;
          e.errorMessage = error.toString();
        }
      }));
};


/**
 * @private
 */
epiviz.EpiViz.prototype._registerLoadWorkspace = function() {
  var self = this;
  this._dataManager.onRequestLoadWorkspace().addListener(new epiviz.events.EventListener(
      /**
       * @param {{id: string, result: epiviz.events.EventResult}} e
       */
      function(e) {
        try {
          self._workspaceManager._requestWorkspaces.notify({ activeWorkspaceId: e.workspace });
          
        } catch (error) {
          e.result.success = false;
          e.errorMessage = error.toString();
        }
      }));
};


/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataSetChartSettings = function() {
  var self = this;
  this._dataManager.onRequestSetChartSettings().addListener(new epiviz.events.EventListener(
      /**
       * @param {{id: string, settings: Array, result: epiviz.events.EventResult}} e
       */
      function(e) {
        try {
            self._chartManager.setChartSettings(e.chartId, e.settings, e.colorMap);
            e.result.success = true;
          } catch(error) {
            e.result.success = false;
            e.result.errorMessage = error.toString();
          }
        })
  );
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataGetChartSettings = function() {
  var self = this;
  this._dataManager.onRequestGetChartSettings().addListener(new epiviz.events.EventListener(
      /**
       * @param {{id: string, settings: Array, result: epiviz.events.EventResult}} e
       */
      function(e) {
        try {
          self._chartManager.getChartSettings(e.chartId);
          e.result.success = true;
        } catch(error) {
          e.result.success = false;
          e.result.errorMessage = error.toString();
        }
      })
  );
};


/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataGetAvailableCharts = function() {
  var self = this;
  this._dataManager.onRequestGetChartSettings().addListener(new epiviz.events.EventListener(
      /**
       * @param {{id: string, settings: Array, result: epiviz.events.EventResult}} e
       */
      function(e) {
        try {
          e.result.value = [];
          self._chartFactory.foreach(function(chartName, chartType) {

            e.result.value.push({
              'chartName': chartName,
              'customSettings': chartType.customSettingsDefs(),
              'colorMap':chartType.defaultColors()._colors});
          });
          e.result.success = true;
        } catch(error) {
          e.result.success = false;
          e.result.errorMessage = error.toString();
        }
      })
  );
};



/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataAddSeqInfos = function() {
  var self = this;
  this._dataManager.onRequestAddSeqInfos().addListener(new epiviz.events.EventListener(
    /**
     * @param {{seqInfos: Array.<epiviz.datatypes.SeqInfo>, result: epiviz.events.EventResult}} e
     */
    function(e) {
      try {
        self._locationManager.addSeqInfos(e.seqInfos);
        e.result.success = true;
      } catch (error) {
        e.result.success = false;
        e.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataRemoveSeqNames = function() {
  var self = this;
  this._dataManager.onRequestRemoveSeqNames().addListener(new epiviz.events.EventListener(
    /**
     * @param {{seqNames: Array.<string>, result: epiviz.events.EventResult}} e
     */
    function(e) {
      try {
        self._locationManager.removeSeqNames(e.seqNames);
        e.result.success = true;
      } catch (error) {
        e.result.success = false;
        e.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataNavigate = function() {
  var self = this;
  this._dataManager.onRequestNavigate().addListener(new epiviz.events.EventListener(
    /**
     * @param {{range: epiviz.datatypes.GenomicRange, result: epiviz.events.EventResult}} e
     */
    function(e) {
      try {
        self._locationManager.changeCurrentLocation(e.range);
        e.result.success = true;
      } catch (error) {
        e.result.success = false;
        e.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataRedraw = function() {
  var self = this;
  this._dataManager.onRequestRedraw().addListener(new epiviz.events.EventListener(
    /**
     * @param {{result: epiviz.events.EventResult}} e
     */
    function(e) {
      try {
        var currentLocation = self._locationManager.currentLocation();
        self._locationManager.changeCurrentLocation(currentLocation);
        e.result.success = true;

        self._chartManager.updateDataStructureCharts();
      } catch (error) {
        e.result.success = false;
        e.errorMessage = error.toString();
      }
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerDataGetCurrentLocation = function() {
  var self = this;
  this._dataManager.onRequestCurrentLocation().addListener(new epiviz.events.EventListener(
    /**
     * @param {{result: epiviz.events.EventResult}} e
     */
      function(e) {
      try {
        var currentLocation = self._locationManager.currentLocation();
        e.result.value = { seqName: currentLocation.seqName(), start: currentLocation.start(), end: currentLocation.end() };
        e.result.success = true;
      } catch (error) {
        e.result.success = false;
        e.errorMessage = error.toString();
      }
    }));
};

/*****************************************************************************
 * Workspaces                                                                *
 *****************************************************************************/

/**
 * @private
 */
epiviz.EpiViz.prototype._registerWorkspacesLoaded = function() {
  var self = this;
  this._workspaceManager.onWorkspacesLoaded().addListener(new epiviz.events.EventListener(
    /**
     * @param {{
     *   activeWorkspace: epiviz.workspaces.Workspace,
     *   workspaces: Array.<epiviz.workspaces.Workspace>
     * }} e
     */
    function(e) {
    }));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerActiveWorkspaceChanged = function() {
  var self = this;
  this._workspaceManager.onActiveWorkspaceChanged().addListener(new epiviz.events.EventListener(
    /**
     * @param {{oldValue: epiviz.workspaces.Workspace, newValue: epiviz.workspaces.Workspace, workspaceId: string}} e
     */
    function(e) {
      self._workspaceManager.startChangingActiveWorkspace();

      self._controlManager.updateSelectedWorkspace({id: e.newValue.id(), name: e.newValue.name()});
      self._locationManager.changeCurrentLocation(e.newValue.range());

      self._measurementsManager.removeMeasurements(self._measurementsManager.computedMeasurements());
      self._measurementsManager.addMeasurements(e.newValue.computedMeasurements());

      self._chartManager.clear();

      /**
       * @type {Object.<epiviz.ui.charts.VisualizationType.DisplayType, Array.<{id: string, type: epiviz.ui.charts.ChartType, properties: epiviz.ui.charts.VisualizationProperties}>>}
       */
      var charts = e.newValue.charts();

      for (var displayType in charts) {
        if (!charts.hasOwnProperty(displayType)) { continue; }

        for (var i = 0; i < charts[displayType].length; ++i) {
          self._addChart(charts[displayType][i].type, charts[displayType][i].properties.visConfigSelection, charts[displayType][i].id, charts[displayType][i].properties.copy());
        }
      }

      self._workspaceManager.endChangingActiveWorkspace();
    }
  ));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerActiveWorkspaceContentChanged = function() {
  var self = this;
  this._workspaceManager.onActiveWorkspaceContentChanged().addListener(new epiviz.events.EventListener(
    /**
     * @param {epiviz.workspaces.Workspace} w
     */
    function(w) {
      self._cookieManager.saveWorkspace(w, self._config);
    }
  ));
};

/**
 * @private
 */
epiviz.EpiViz.prototype._registerLocationChanged = function() {
  var self = this;
  this._locationManager.onCurrentLocationChanged().addListener(new epiviz.events.EventListener(
    /**
     * @param {{oldValue: epiviz.datatypes.GenomicRange, newValue: epiviz.datatypes.GenomicRange}} e
     */
    function(e) {
      self._chartManager.dataWaitStart(undefined,
        /**
         * @param {epiviz.ui.charts.Visualization} chart
         * @returns {boolean}
         */
        function(chart) {
          return chart.displayType() != epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE && chart.type != "Sunburst";
        });

      /** @type {Object.<string, epiviz.measurements.MeasurementSet>} */
      var chartMeasurementsMap = self._chartManager.chartsMeasurements();

      // TODO: update pca plots for Hierarchy Changes
      // remove PCA & alphadiversity here
      for ( var mea in chartMeasurementsMap) {

          var cMap = {};
          cMap[mea] = chartMeasurementsMap[mea];

          if (mea.indexOf('pca_scatter') != -1) {

            self._dataManager.getPCA(e.newValue, cMap,
              function(chartId, data) {
                self._chartManager.updateCharts(e.newValue, data, [chartId]);
            });

            delete chartMeasurementsMap[mea];
          }
          else if (mea.indexOf('pcoa_scatter') != -1) {

            self._dataManager.getPCoA(e.newValue, cMap,
              function(chartId, data) {
                self._chartManager.updateCharts(e.newValue, data, [chartId]);
            });

            delete chartMeasurementsMap[mea];
          }
          else if (mea.indexOf('diversity_scatter') != -1) {
            self._dataManager.getDiversity(e.newValue, cMap,
              function(chartId, data) {
                self._chartManager.updateCharts(e.newValue, data, [chartId]);
            });

            delete chartMeasurementsMap[mea];
          }
          else if(mea.indexOf('feature_scatter') != -1) {
            // // self._dataManager.getFeatureData(e.newValue, cMap,
            //   function(chartId, data) {
            //     self._chartManager.updateCharts(e.newValue, data, [chartId]);
            // });

            delete chartMeasurementsMap[mea];
          }
      } 

      self._dataManager.getData(e.newValue, chartMeasurementsMap,
        function(chartId, data) {
          self._chartManager.updateCharts(e.newValue, data, [chartId]);
      });

      if(!self._chartManager.onChartPropogateIcicleLocationChanges().isFiring()) {
          self._chartManager.onChartIcicleLocationChanges().notify(new epiviz.ui.charts.VisEventArgs('1', {start: e.newValue._start, width: e.newValue._width}));
        }
    }));
};

epiviz.EpiViz.prototype._registerChartPropogateIcicleLocationChange = function() {
  var self = this;

  self._chartManager.onChartPropogateIcicleLocationChanges().addListener(new epiviz.events.EventListener(
    function(e) {
      var currentLocation = self._locationManager.currentLocation();
      if(currentLocation != null) {
        self._locationManager.changeCurrentLocation(
            new epiviz.datatypes.GenomicRange(currentLocation.seqName(), 
              e.start, 
              e.width));
      }
    }
  ));
};

// loading current data set for app screen
epiviz.EpiViz.prototype._registerLoadingAppScreen = function() {
  var self = this;

  self._dataManager._loadingCurrentDataSet.addListener(new epiviz.events.EventListener(
    function(e) {
      self._controlManager.updateLoadingScreen(e);
    }
  ));
};
