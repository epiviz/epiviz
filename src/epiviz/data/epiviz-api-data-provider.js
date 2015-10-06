/**
 * Created by Florin Chelaru ( florin [dot] chelaru [at] gmail [dot] com )
 * Date: 7/3/2015
 * Time: 4:27 PM
 */

goog.provide('epiviz.data.EpivizApiDataProvider');
goog.provide('epiviz.data.EpivizApiDataProvider.Request');

/**
 * @param {string} id
 * @param {string} serverEndpoint
 * @param {Array.<string>} [measurementAnnotations]
 * @param {number} [maxDepth]
 * @param {Object.<number, number>} [selectedLevels]
 * @constructor
 * @extends epiviz.data.DataProvider
 */
epiviz.data.EpivizApiDataProvider = function(id, serverEndpoint, measurementAnnotations, maxDepth, selectedLevels) {
  epiviz.data.DataProvider.call(this, id);

  /**
   * @type {string}
   * @private
   */
  this._serverEndpoint = serverEndpoint;

  /**
   * @type {Array.<string>}
   * @private
   */
  this._measurementAnnotations = measurementAnnotations;

  /**
   * @type {Object.<string, epiviz.ui.charts.tree.NodeSelectionType>}
   * @private
   */
  this._selection = {};

  /**
   * @type {Object.<string, number>}
   * @private
   */
  this._order = {};

  /**
   * @type {Object.<number, number>}
   * @private
   */
  this._selectedLevels = selectedLevels || {6: epiviz.ui.charts.tree.NodeSelectionType.NODE, 7: epiviz.ui.charts.tree.NodeSelectionType.NODE};

  /**
   * @type {string}
   * @private
   */
  this._lastRoot = '';

  /**
   * @type {number}
   * @private
   */
  this._maxDepth = maxDepth || 2;
};

/**
 * Copy methods from upper class
 */
epiviz.data.EpivizApiDataProvider.prototype = epiviz.utils.mapCopy(epiviz.data.DataProvider.prototype);
epiviz.data.EpivizApiDataProvider.constructor = epiviz.data.EpivizApiDataProvider;

/**
 * @type {Object.<string, string>}
 */
epiviz.data.EpivizApiDataProvider.REQUEST_MAPPING = {
  getRows: 'rows',
  getValues: 'values',
  getMeasurements: 'measurements',
  getSeqInfos: 'partitions',
  getHierarchy: 'hierarchy'
};

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response.<*>)} callback
 */
epiviz.data.EpivizApiDataProvider.prototype.getData = function(request, callback) {
  if (request.isEmpty()) { return; }

  var self = this;
  var apiRequest = self._adaptRequest(request);
  this._send(apiRequest, function(apiData) {
    callback(self._adaptResponse(request, apiData));
  });
};

/**
 * @param {epiviz.data.EpivizApiDataProvider.Request} request
 * @param {function(epiviz.data.EpivizApiDataProvider.Response)} callback
 * @private
 */
epiviz.data.EpivizApiDataProvider.prototype._send = function(request, callback) {
  var requestHandler = $.ajax({
    type: 'post',
    url: this._serverEndpoint,
    data: request,
    dataType: 'json',
    async: true,
    cache: false,
    processData: true
  });

  // callback handler that will be called on success
  requestHandler.done(function (data, textStatus, jqXHR){
    callback(data);
  });

  // callback handler that will be called on failure
  requestHandler.fail(function (jqXHR, textStatus, errorThrown){
    console.error("The following error occured: " + textStatus, errorThrown);
  });

  // callback handler that will be called regardless
  // if the request failed or succeeded
  requestHandler.always(function () {});
};

/**
 * Adapts Epiviz requests to API requests
 * @param {epiviz.data.Request} request
 * @returns {epiviz.data.EpivizApiDataProvider.Request}
 * @private
 */
epiviz.data.EpivizApiDataProvider.prototype._adaptRequest = function(request) {
  var action = request.get('action');
  switch (action) {
    case epiviz.data.Request.Action.GET_MEASUREMENTS:
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'measurements', {annotation: JSON.stringify(this._measurementAnnotations)});
    case epiviz.data.Request.Action.GET_SEQINFOS:
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'partitions');
    case epiviz.data.Request.Action.GET_ROWS:
      var start = request.get('start');
      var end = request.get('end');
      var partition = request.get('seqName');
      if (partition == '[NA]') { partition = ''; }
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'rows', {start: start, end: end, partition: JSON.stringify(partition), selection: JSON.stringify(this._selection), order: JSON.stringify(this._order), selectedLevels: JSON.stringify(this._selectedLevels)});
    case epiviz.data.Request.Action.GET_VALUES:
      var start = request.get('start');
      var end = request.get('end');
      var partition = request.get('seqName');
      var measurement = request.get('measurement');
      if (partition == '[NA]') { partition = ''; }
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'values', {start: start, end: end, partition: JSON.stringify(partition), measurement: JSON.stringify(measurement), selection: JSON.stringify(this._selection), order: JSON.stringify(this._order), selectedLevels: JSON.stringify(this._selectedLevels)});
    case epiviz.data.Request.Action.GET_COMBINED:
      var start = request.get('start');
      var end = request.get('end');
      var partition = request.get('seqName');
      var measurements = request.get('measurements')[this._id];
      if (partition == '[NA]') { partition = ''; }
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'combined', {start: start, end: end, partition: JSON.stringify(partition), measurements: JSON.stringify(measurements), selection: JSON.stringify(this._selection), order: JSON.stringify(this._order), selectedLevels: JSON.stringify(this._selectedLevels)});
    case epiviz.data.Request.Action.GET_HIERARCHY:
      var nodeId = request.get('nodeId') || '';
      this._lastRoot = nodeId;
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'hierarchy', {depth: this._maxDepth, nodeId: JSON.stringify(nodeId), selection: JSON.stringify(this._selection), order: JSON.stringify(this._order), selectedLevels: JSON.stringify(this._selectedLevels)});
    case epiviz.data.Request.Action.PROPAGATE_HIERARCHY_CHANGES:
      var order = request.get('order');
      var selection = request.get('selection');
      var selectedLevels = request.get('selectedLevels');

      if (selectedLevels) {
        var self = this;
        var deselectedNodeIds = [];
        $.each(this._selection, function(nodeId, selectionType) {
          var nodeDepth = self._calcNodeDepth(nodeId);
          var selectionForNodeLevel = selectedLevels[nodeDepth];
          var lastSelectionForNodeLevel = self._selectedLevels[nodeDepth];
          if (selectionForNodeLevel != undefined && selectionForNodeLevel != lastSelectionForNodeLevel) {
            deselectedNodeIds.push(nodeId);
          }
        });
        deselectedNodeIds.forEach(function(nodeId) { delete self._selection[nodeId]; });
      }

      if (selection) {
        for (var nodeId  in selection) {
          if (!selection.hasOwnProperty(nodeId)) { continue; }
          var selectionForNodeLevel = selectedLevels[self._calcNodeDepth(nodeId)];
          if (selectionForNodeLevel == undefined) { selectionForNodeLevel = epiviz.ui.charts.tree.NodeSelectionType.LEAVES; }
          // if (selection[nodeId] == epiviz.ui.charts.tree.NodeSelectionType.LEAVES) {
          if (selection[nodeId] == selectionForNodeLevel) {
            delete this._selection[nodeId];
            continue;
          }
          this._selection[nodeId] = selection[nodeId];
        }
      }

      if (order) {
        for (var nodeId in order) {
          if (!order.hasOwnProperty(nodeId)) { continue; }
          this._order[nodeId] = order[nodeId];
        }
      }

      if (selectedLevels) {
        for (var level in selectedLevels) {
          if (!selectedLevels.hasOwnProperty(level)) { continue; }
          this._selectedLevels[level] = selectedLevels[level];
          if (this._selectedLevels[level] == epiviz.ui.charts.tree.NodeSelectionType.LEAVES) {
            delete this._selectedLevels[level];
          }
        }
      }

      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'hierarchy', {depth: this._maxDepth, nodeId: JSON.stringify(this._lastRoot), selection: JSON.stringify(this._selection), order: JSON.stringify(this._order), selectedLevels: JSON.stringify(this._selectedLevels)});
  }
};

/**
 * @param {epiviz.data.Request} request
 * @param {epiviz.data.EpivizApiDataProvider.Response} data
 * @returns {epiviz.data.Response}
 * @private
 */
epiviz.data.EpivizApiDataProvider.prototype._adaptResponse = function(request, data) {
  var result = data.result;
  var action = request.get('action');
  switch (action) {
    case epiviz.data.Request.Action.GET_MEASUREMENTS:
      break;
    case epiviz.data.Request.Action.GET_SEQINFOS:
      result = result.map(function(tuple) { return tuple[0] == null ? ['[NA]'].concat(tuple.slice(1)) : tuple; });
      break;
    case epiviz.data.Request.Action.GET_ROWS:
      result.values.id = result.values.index;
      delete result.values.index;
      if (result.values.end) {
        // On the API, the resulted values are start inclusive, end exclusive
        result.values.end = result.values.end.map(function(val) { return val - 1; });
      }
      break;
    case epiviz.data.Request.Action.GET_VALUES:
      break;
    case epiviz.data.Request.Action.GET_COMBINED:
      result.rows.id = result.rows.index;
      delete result.rows.index;
      if (result.rows.end) {
        // On the API, the resulted values are start inclusive, end exclusive
        result.rows.end = result.rows.end.map(function(val) { return val - 1; });
      }

      var datasource = Object.keys(request.get('measurements'))[0];
      var ret = {};
      ret[datasource] = result;
      result = ret;
      break;
    case epiviz.data.Request.Action.GET_HIERARCHY:
      break;
    case epiviz.data.Request.Action.PROPAGATE_HIERARCHY_CHANGES:
      break;
  }
  return epiviz.data.Response.fromRawObject({
    requestId: request.id(),
    data: result
  });
};

/**
 * @param {string} nodeId
 * @returns {Number}
 * @private
 */
epiviz.data.EpivizApiDataProvider.prototype._calcNodeDepth = function(nodeId) {
  return parseInt(nodeId.split('-')[0], 16);
};

/**
 * @param {string|number} id
 * @param {string} method
 * @param {Array|Object.<string, *>} [params]
 * @constructor
 */
epiviz.data.EpivizApiDataProvider.Request = function(id, method, params) {
  /**
   * @type {string|number}
   */
  this.id = id;
  /**
   * @type {string}
   */
  this.method = method;

  /**
   * @type {Array|Object.<string, *>}
   */
  this.params = params;
};

/**
 * @param {string} id
 * @param {string} error
 * @param {*} result
 * @constructor
 */
epiviz.data.EpivizApiDataProvider.Response = function(id, error, result) {
  /**
   * @type {string}
   */
  this.id = id;

  /**
   * @type {string}
   */
  this.error = error;

  this.result = result;
};
