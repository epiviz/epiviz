/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 12:58 PM
 */

goog.provide('epiviz.workspaces.WorkspaceManager');

goog.require('epiviz.workspaces.Workspace');

/**
 * @param {epiviz.Config} config
 * @param {epiviz.ui.LocationManager} locationManager
 * @param {epiviz.measurements.MeasurementsManager} measurementsManager
 * @param {epiviz.ui.charts.ChartManager} chartManager
 * @param {epiviz.ui.charts.ChartFactory} chartFactory
 * @constructor
 */
epiviz.workspaces.WorkspaceManager = function(config, locationManager, measurementsManager, chartManager, chartFactory) {
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
   * @type {epiviz.ui.charts.ChartManager}
   * @private
   */
  this._chartManager = chartManager;

  /**
   * @type {epiviz.ui.charts.ChartFactory}
   * @private
   */
  this._chartFactory = chartFactory;

  /**
   * @type {?epiviz.workspaces.Workspace}
   * @private
   */
  this._activeWorkspace = null;

  /**
   * Workspaces by id
   *
   * @type {Object.<string, epiviz.workspaces.Workspace>}
   * @private
   */
  this._workspaces = null;

  /**
   * @type {Object.<string, epiviz.workspaces.Workspace>}
   * @private
   */
  this._workspacesByName = null;

  /**
   * @type {epiviz.events.Event.<{activeWorkspace: epiviz.workspaces.Workspace, workspaces: Array.<epiviz.workspaces.Workspace>}>}
   * @private
   */
  this._workspacesLoaded = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{oldValue: epiviz.workspaces.Workspace, newValue: epiviz.workspaces.Workspace, workspaceId: string}>}
   * @private
   */
  this._activeWorkspaceChanged = new epiviz.events.Event();

  /**
   * @type {boolean}
   * @private
   */
  this._activeWorkspaceChanging = false;


  /**
   * @type {epiviz.events.Event.<{activeWorkspaceId: ?string}>}
   * @private
   */
  this._requestWorkspaces = new epiviz.events.Event();

  // Register for events

  this._registerLocationChanged();
  this._registerComputedMeasurementAdded();
  this._registerComputedMeasurementRemoved();
  this._registerChartAdded();
  this._registerChartRemoved();
  this._registerChartColorsChanged();
  this._registerChartMethodsModified();
  this._registerChartSizeChanged();
  this._registerChartMarginsChanged();
  this._registerChartCustomSettingsChanged();
};

/**
 * @returns {?epiviz.workspaces.Workspace}
 */
epiviz.workspaces.WorkspaceManager.prototype.activeWorkspace = function() {
  return this._activeWorkspace || null;
};

/**
 * @param {string} id
 * @returns {?epiviz.workspaces.Workspace}
 */
epiviz.workspaces.WorkspaceManager.prototype.get = function(id) {
  return (id && this._workspaces) ? (this._workspaces[id] || null) : null;
};

/**
 * @param {string} name
 */
epiviz.workspaces.WorkspaceManager.prototype.getByName = function(name) {
  return (name && this._workspacesByName) ? (this._workspacesByName[name] || null) : null;
};

/**
 */
epiviz.workspaces.WorkspaceManager.prototype.initialize = function() {
  var requestWorkspaceId = epiviz.ui.WebArgsManager.WEB_ARGS['ws'] ||
    epiviz.ui.WebArgsManager.WEB_ARGS['workspace'] ||
    null;
  this._requestWorkspaces.notify({ activeWorkspaceId: requestWorkspaceId });
};

/**
 * @param {Array.<epiviz.workspaces.Workspace>} workspaces
 * @param {?epiviz.workspaces.Workspace} [activeWorkspace]
 * @param {?string} [activeWorkspaceId]
 */
epiviz.workspaces.WorkspaceManager.prototype.updateWorkspaces = function(workspaces, activeWorkspace, activeWorkspaceId) {
  if (workspaces) {
    this._workspaces = {};
    this._workspacesByName = {};
    for (var i = 0; i < workspaces.length; ++i) {
      if (workspaces[i].id() === null) { continue; }
      this._workspaces[workspaces[i].id()] = workspaces[i];
      this._workspacesByName[workspaces[i].name()] = workspaces[i];
    }
  }

  if (!activeWorkspace) {
    activeWorkspace = (workspaces && workspaces.length) ?
      workspaces[0] :
      epiviz.workspaces.Workspace.fromRawObject(this._config.defaultWorkspaceSettings, this._chartFactory);
  }

  var oldActiveWorkspace = this._activeWorkspace;
  this._activeWorkspace = activeWorkspace;

  var webArgs = epiviz.ui.WebArgsManager.WEB_ARGS;

  var seqName = webArgs['seqName'] || this._activeWorkspace.range().seqName();
  var start = parseInt(webArgs['start']) || this._activeWorkspace.range().start();
  var end = parseInt(webArgs['end']) || this._activeWorkspace.range().end();

  this._activeWorkspace.locationChanged(epiviz.datatypes.GenomicRange.fromStartEnd(seqName, start, end));

  this._workspacesLoaded.notify({
    activeWorkspace: this._activeWorkspace,
    workspaces: workspaces
  });

  this._activeWorkspaceChanged.notify({
    oldValue: oldActiveWorkspace,
    newValue: this._activeWorkspace,
    workspaceId: this._activeWorkspace.id() || activeWorkspaceId
  });
};

/**
 * @param {epiviz.workspaces.Workspace} workspace
 */
epiviz.workspaces.WorkspaceManager.prototype.updateWorkspace = function(workspace) {
  this._workspaces[workspace.id()] = workspace;
  this._workspacesByName[workspace.name()] = workspace;
};

/**
 */
epiviz.workspaces.WorkspaceManager.prototype.deleteActiveWorkspace = function() {
  var activeWorkspace = this._activeWorkspace;
  if (!activeWorkspace || !activeWorkspace.id()) { return; }

  delete this._workspaces[activeWorkspace.id()];
  delete this._workspacesByName[activeWorkspace.name()];

  var newActiveWorkspace = null;
  for (var id in this._workspaces) {
    if (!this._workspaces.hasOwnProperty(id)) { continue; }
    newActiveWorkspace = this._workspaces[id];
    break;
  }

  if (!newActiveWorkspace) {
    newActiveWorkspace = epiviz.workspaces.Workspace.fromRawObject(this._config.defaultWorkspaceSettings, this._chartFactory);
  }

  this._activeWorkspace = newActiveWorkspace;

  var seqName = activeWorkspace.range().seqName();
  var start = activeWorkspace.range().start();
  var end = activeWorkspace.range().end();

  this._activeWorkspace.locationChanged(epiviz.datatypes.GenomicRange.fromStartEnd(seqName, start, end));

  this._activeWorkspaceChanged.notify({
    oldValue: activeWorkspace,
    newValue: this._activeWorkspace,
    workspaceId: this._activeWorkspace.id()
  });
};

/**
 * @returns {epiviz.events.Event.<Array.<epiviz.workspaces.Workspace>>}
 */
epiviz.workspaces.WorkspaceManager.prototype.onWorkspacesLoaded = function() { return this._workspacesLoaded; };

/**
 * @returns {epiviz.events.Event.<{oldValue: epiviz.workspaces.Workspace, newValue: epiviz.workspaces.Workspace, workspaceId: string}>}
 */
epiviz.workspaces.WorkspaceManager.prototype.onActiveWorkspaceChanged = function() { return this._activeWorkspaceChanged; };

/**
 */
epiviz.workspaces.WorkspaceManager.prototype.startChangingActiveWorkspace = function() { this._activeWorkspaceChanging = true; };

/**
 */
epiviz.workspaces.WorkspaceManager.prototype.endChangingActiveWorkspace = function() { this._activeWorkspaceChanging = false; };

/**
 * @returns {boolean}
 */
epiviz.workspaces.WorkspaceManager.prototype.activeWorkspaceChanging = function() { return this._activeWorkspaceChanging; };

/**
 * @returns {epiviz.events.Event.<{activeWorkspaceId: ?string}>}
 */
epiviz.workspaces.WorkspaceManager.prototype.onRequestWorkspaces = function() { return this._requestWorkspaces; };

/**
 * @param {?string} id The id of the new active workspace
 * @param {epiviz.workspaces.Workspace} [workspace] A workspace that doesn't belong to the current user,
 *   to replace the active workspace
 */
epiviz.workspaces.WorkspaceManager.prototype.changeActiveWorkspace = function(id, workspace) {
  workspace = workspace || this._workspaces[id];
  if (!workspace || workspace === this._activeWorkspace) { return; } // TODO: Show a message or throw an error

  var oldValue = this._activeWorkspace;
  this._activeWorkspace = workspace;
  this._activeWorkspaceChanged.notify({oldValue: oldValue, newValue: this._activeWorkspace, workspaceId: id});
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerLocationChanged = function() {
  var self = this;
  this._locationManager.onCurrentLocationChanged().addListener(new epiviz.events.EventListener(
    /**
     * @param {{oldValue: epiviz.datatypes.GenomicRange, newValue: epiviz.datatypes.GenomicRange}} e
     */
    function(e) {
      if (self._activeWorkspaceChanging) { return; }
      if (!self._activeWorkspace) { return; }
      self._activeWorkspace.locationChanged(e.newValue);
    }
  ));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerChartAdded = function() {
  var self = this;
  this._chartManager.onChartAdded().addListener(new epiviz.events.EventListener(
    /**
     * @param {{
     *   id: string,
     *   type: epiviz.ui.charts.ChartType,
     *   properties: epiviz.ui.charts.ChartProperties,
     *   chartsOrder: Object.<epiviz.ui.charts.ChartType.DisplayType, Array.<string>>}} e
     */
    function(e) {
      if (self._activeWorkspaceChanging) { return; }
      if (!self._activeWorkspace) { return; }
      self._activeWorkspace.chartAdded(e.id, e.type, e.properties, e.chartsOrder);
    }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerChartRemoved = function() {
  var self = this;
  this._chartManager.onChartRemoved().addListener(new epiviz.events.EventListener(function(e) {
    if (self._activeWorkspaceChanging) { return; }
    if (!self._activeWorkspace) { return; }
    self._activeWorkspace.chartRemoved(e.id, e.chartsOrder);
  }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerChartColorsChanged = function() {
  var self = this;
  this._chartManager.onChartColorsChanged().addListener(new epiviz.events.EventListener(function(e) {
    if (self._activeWorkspaceChanging) { return; }
    if (!self._activeWorkspace) { return; }
    self._activeWorkspace.chartColorsChanged(e.id, e.colors);
  }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerChartMethodsModified = function() {
  var self = this;
  this._chartManager.onChartMethodsModified().addListener(new epiviz.events.EventListener(function(e) {
    if (self._activeWorkspaceChanging) { return; }
    if (!self._activeWorkspace) { return; }
    self._activeWorkspace.chartMethodsModified(e.id, e.modifiedMethods);
  }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerChartCustomSettingsChanged = function() {
  var self = this;
  this._chartManager.onChartCustomSettingsChanged().addListener(new epiviz.events.EventListener(function(e) {
    if (self._activeWorkspaceChanging) { return; }
    if (!self._activeWorkspace) { return; }
    self._activeWorkspace.chartCustomSettingsChanged(e.id, e.customSettingsValues);
  }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerChartSizeChanged = function() {
  var self = this;
  this._chartManager.onChartSizeChanged().addListener(new epiviz.events.EventListener(function(e) {
    if (self._activeWorkspaceChanging) { return; }
    if (!self._activeWorkspace) { return; }
    self._activeWorkspace.chartSizeChanged(e.id, e.width, e.height);
  }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerChartMarginsChanged = function() {
  var self = this;
  this._chartManager.onChartMarginsChanged().addListener(new epiviz.events.EventListener(function(e) {
    if (self._activeWorkspaceChanging) { return; }
    if (!self._activeWorkspace) { return; }
    self._activeWorkspace.chartMarginsChanged(e.id, e.margins);
  }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerComputedMeasurementAdded = function() {
  var self = this;
  this._measurementsManager.onComputedMeasurementsAdded().addListener(new epiviz.events.EventListener(
    function(measurements) {
      if (self._activeWorkspaceChanging) { return; }
      if (!self._activeWorkspace) { return; }
      self._activeWorkspace.computedMeasurementsAdded(measurements);
    }));
};

/**
 * @private
 */
epiviz.workspaces.WorkspaceManager.prototype._registerComputedMeasurementRemoved = function() {
  var self = this;
  this._measurementsManager.onComputedMeasurementsRemoved().addListener(new epiviz.events.EventListener(
    function(measurements) {
      if (self._activeWorkspaceChanging) { return; }
      if (!self._activeWorkspace) { return; }
      self._activeWorkspace.computedMeasurementsRemoved(measurements);
    }));
};
