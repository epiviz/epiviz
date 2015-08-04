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
 * @constructor
 * @extends epiviz.data.DataProvider
 */
epiviz.data.EpivizApiDataProvider = function(id, serverEndpoint, measurementAnnotations) {
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
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'rows', {start: start, end: end, partition: JSON.stringify(partition)});
    case epiviz.data.Request.Action.GET_VALUES:
      var start = request.get('start');
      var end = request.get('end');
      var partition = request.get('seqName');
      var measurement = request.get('measurement');
      if (partition == '[NA]') { partition = ''; }
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'values', {start: start, end: end, partition: JSON.stringify(partition), measurement: JSON.stringify(measurement)});
    case epiviz.data.Request.Action.GET_COMBINED:
      /**
       * @type {{datasource: string, seqName: string, start: number, end: number, metadata: Array.<string>, measurements: Array.<string>}}
       */
      var datasourceRequest = request.get('datasources')[0];
      var params = {
        partition: JSON.stringify((datasourceRequest.seqName == '[NA]') ? '' : datasourceRequest.seqName),
        start: datasourceRequest.start,
        end: datasourceRequest.end,
        metadata: JSON.stringify(datasourceRequest.metadata),
        measurements: JSON.stringify(datasourceRequest.measurements)
      };
      return new epiviz.data.EpivizApiDataProvider.Request(request.id(), 'combined', params);
    case epiviz.data.Request.Action.PROPAGATE_HIERARCHY_CHANGES:
      return;
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
    case epiviz.data.Request.Action.PROPAGATE_HIERARCHY_CHANGES:
      return;
  }
  return epiviz.data.Response.fromRawObject({
    requestId: request.id(),
    data: result
  });
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
