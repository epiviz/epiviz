/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 8:35 PM
 */

goog.provide('epiviz.data.Request');

/**
 * @param {number} id
 * @param {Object.<string, string>} args
 * @param {epiviz.data.Request.Method} [method]
 * @constructor
 */
epiviz.data.Request = function(id, args, method) {
  /**
   * @type {number}
   * @private
   */
  this._id = id;

  /**
   * @type {Object.<string, string>}
   * @private
   */
  this._args = args;

  /**
   * @type {epiviz.data.Request.Method}
   * @private
   */
  this._method = method;
};

/**
 * @enum {string}
 */
epiviz.data.Request.Method = {
  GET: 'get',
  POST: 'post'
};

/**
 * @enum {string}
 */
epiviz.data.Request.Action = {
  // Server actions
  GET_ROWS: 'getRows',
  GET_VALUES: 'getValues',
  GET_MEASUREMENTS: 'getMeasurements',
  SEARCH: 'search',
  GET_SEQINFOS: 'getSeqInfos',
  SAVE_WORKSPACE: 'saveWorkspace',
  DELETE_WORKSPACE: 'deleteWorkspace',
  GET_WORKSPACES: 'getWorkspaces',

  GET_HIERARCHY: 'getHierarchy',
  PROPAGATE_HIERARCHY_CHANGES: 'propagateHierarchyChanges',

  // UI actions
  ADD_MEASUREMENTS: 'addMeasurements',
  REMOVE_MEASUREMENTS: 'removeMeasurements',
  ADD_SEQINFOS: 'addSeqInfos',
  REMOVE_SEQNAMES: 'removeSeqNames',
  ADD_CHART: 'addChart',
  REMOVE_CHART: 'removeChart',
  CLEAR_DATASOURCE_GROUP_CACHE: 'clearDatasourceGroupCache',
  FLUSH_CACHE: 'flushCache',
  NAVIGATE: 'navigate',
  REDRAW: 'redraw',
  GET_CURRENT_LOCATION: 'getCurrentLocation',
  WRITE_DEBUG_MSG: 'writeMsg'  
};

/**
 * @param {Object.<string, string>} args A map with the arguments for the request
 * @param {epiviz.data.Request.Method} [method]
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.createRequest = function(args, method) {
  return new epiviz.data.Request(
    epiviz.data.Request._nextId++,
    args,
    method || epiviz.data.Request.Method.GET
  );
};

/**
 * @param {{requestId: number, type: string, data: Object.<string, string>}} o
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.fromRawObject = function(o) {
  return new epiviz.data.Request(o.requestId, o.data);
};

/**
 * @type {number}
 * @private
 */
epiviz.data.Request._nextId = 0;

/**
 * @returns {number}
 */
epiviz.data.Request.prototype.id = function() { return this._id; };

/**
 * @returns {epiviz.data.MessageType}
 */
epiviz.data.Request.prototype.type = function() { return epiviz.data.MessageType.REQUEST; };

/**
 * @returns {epiviz.data.Request.Method}
 */
epiviz.data.Request.prototype.method = function() { return this._method; };

/**
 * Concatenates all arguments in the request into one string. By default, the result will have the following format:
 *   <key1>=<val1>&<key2>=<val2>...
 * @param {string} [keyValGlue] The token used to join keys and values; by default, this is '='
 * @param {string} [argGlue] The token used to join different arguments together; by default, this is '&'
 * @returns {string}
 */
epiviz.data.Request.prototype.joinArgs = function(keyValGlue, argGlue) {
  keyValGlue = keyValGlue || '=';
  argGlue = argGlue || '&';

  var result = sprintf('requestId%s%s', keyValGlue, this._id);
  for (var arg in this._args) {
    if (!this._args.hasOwnProperty(arg)) { continue; }
    if (!Array.isArray(this._args[arg])) {
      result += sprintf('%s%s%s%s', argGlue, arg, keyValGlue, this._args[arg] || '');
    } else {
      for (var i = 0; i < this._args[arg].length; ++i) {
        result += sprintf('%s%s[]%s%s', argGlue, arg, keyValGlue, this._args[arg][i]);
      }
    }
  }

  return result;
};

/**
 * @returns {boolean}
 */
epiviz.data.Request.prototype.isEmpty = function() {
  for (var arg in this._args) {
    if (!this._args.hasOwnProperty(arg)) { continue; }
    return false;
  }

  return true;
};

/**
 * @param arg
 * @returns {?string}
 */
epiviz.data.Request.prototype.get = function(arg) {
  return (arg in this._args) ? this._args[arg] : null;
};

/**
 * @returns {{requestId: number, type: string, data: Object.<string, string>}}
 */
epiviz.data.Request.prototype.raw = function() {
  return {
    requestId: this._id,
    type: this.type(),
    data: epiviz.utils.mapCopy(this._args)
  };
};

/**
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.emptyRequest = function() {
  return epiviz.data.Request.createRequest({});
};

/**
 * @param {epiviz.measurements.Measurement} datasource
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.getRows = function(datasource, range) {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.GET_ROWS,
    datasource: datasource.id(),
    seqName: range ? range.seqName() : undefined,
    start: range ? range.start() : undefined,
    end: range ? range.end() : undefined,
    metadata: datasource.metadata()
  });
};

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.getValues = function(measurement, range) {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.GET_VALUES,
    datasource: measurement.datasource().id(),
    measurement: measurement.id(),
    seqName: range ? range.seqName() : undefined,
    start: range ? range.start() : undefined,
    end: range ? range.end() : undefined
  });
};

/**
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.getMeasurements = function() {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.GET_MEASUREMENTS
  });
};

/**
 * @param {string} query
 * @param {number} maxResults
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.search = function(query, maxResults) {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.SEARCH,
    q: query || '',
    maxResults: maxResults
  });
};

/**
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.getSeqInfos = function() {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.GET_SEQINFOS
  });
};

/**
 * @param {epiviz.workspaces.Workspace} workspace
 * @param {epiviz.Config} config
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.saveWorkspace = function(workspace, config) {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.SAVE_WORKSPACE,
    id: workspace.id(),
    name: workspace.name(),
    content: encodeURIComponent(JSON.stringify(workspace.raw(config).content))
  },
  epiviz.data.Request.Method.POST);
};

/**
 * @param {epiviz.workspaces.Workspace} workspace
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.deleteWorkspace = function(workspace) {
  return epiviz.data.Request.createRequest({
      version: epiviz.EpiViz.VERSION,
      action: epiviz.data.Request.Action.DELETE_WORKSPACE,
      id: workspace.id()
    },
    epiviz.data.Request.Method.POST);
};

/**
 * @param filter
 * @param requestWorkspaceId
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.getWorkspaces = function(filter, requestWorkspaceId) {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.GET_WORKSPACES,
    q: filter || '',
    ws: requestWorkspaceId
  });
};

/**
 * @param {string} datasourceGroup
 * @param {string} [nodeId]
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.getHierarchy = function(datasourceGroup, nodeId) {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.GET_HIERARCHY,
    datasourceGroup: datasourceGroup,
    nodeId: nodeId
  });
};

/**
 * @param {string} datasourceGroup
 * @param {Object.<string, epiviz.ui.charts.tree.NodeSelectionType>} [selection]
 * @param {Object.<string, number>} [order]
 * @returns {epiviz.data.Request}
 */
epiviz.data.Request.propagateHierarchyChanges = function(datasourceGroup, selection, order) {
  return epiviz.data.Request.createRequest({
    version: epiviz.EpiViz.VERSION,
    action: epiviz.data.Request.Action.PROPAGATE_HIERARCHY_CHANGES,
    datasourceGroup: datasourceGroup,
    selection: selection,
    order: order
  });
};


