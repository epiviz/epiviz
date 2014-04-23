/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 8:28 PM
 */

goog.provide('epiviz.data.DataProvider');

/**
 * @param {string} id
 * @constructor
 */
epiviz.data.DataProvider = function(id) {
  /**
   * @type {string}
   * @private
   */
  this._id = id;

  /**
   * seqInfos: an array of raw seqInfos, which consist of 3-element arrays: name, min and max
   * @type {epiviz.events.Event.<{seqInfos: Array.<Array>, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestAddSeqInfos = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{seqNames: Array.<string>, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestRemoveSeqNames = new epiviz.events.Event();

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
   * @type {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestFlushCache = new epiviz.events.Event();

  /**
   * @type {epiviz.events.Event.<{datasourceGroup: string, result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestClearDatasourceGroupCache = new epiviz.events.Event();

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
   * @type {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
   * @private
   */
  this._requestCurrentLocation = new epiviz.events.Event();
};

/**
 * @returns {string}
 */
epiviz.data.DataProvider.prototype.id = function() { return this._id; };

/**
 * @param {epiviz.data.Request} request
 * @param {function(epiviz.data.Response<*>)} callback
 */
epiviz.data.DataProvider.prototype.getData = function(request, callback) {
  callback(epiviz.data.Response.fromRawObject({
    requestId: request.id(),
    data: null
  }));
};

/**
 * seqInfos: an array of raw seqInfos, which consist of 3-element arrays: name, min and max
 * @returns {epiviz.events.Event.<{seqInfos: Array.<Array>, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestAddSeqInfos = function() { return this._requestAddSeqInfos; };

/**
 * @returns {epiviz.events.Event.<{seqNames: Array.<string>, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestRemoveSeqNames = function() { return this._requestRemoveSeqNames; };

/**
 * Fired whenever the data provider requests the UI to add new measurements
 * @returns {epiviz.events.Event.<{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestAddMeasurements = function() { return this._requestAddMeasurements; };

/**
 * Fired whenever the data provider requests the UI to remove measurements
 * @returns {epiviz.events.Event.<{measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestRemoveMeasurements = function() { return this._requestRemoveMeasurements; };

/**
 * The type argument is a string denoting the complete class name of the chart to be used.
 * For example: 'epiviz.plugins.charts.BlocksTrack'.
 * @returns {epiviz.events.Event.<{type: string, measurements: epiviz.measurements.MeasurementSet, result: epiviz.events.EventResult.<{id: string}>}>}
 */
epiviz.data.DataProvider.prototype.onRequestAddChart = function() { return this._requestAddChart; };

/**
 * @returns {epiviz.events.Event.<{id: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestRemoveChart = function() { return this._requestRemoveChart; };

/**
 * @returns {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestFlushCache = function() { return this._requestFlushCache; };

/**
 * @returns {epiviz.events.Event.<{datasourceGroup: string, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestClearDatasourceGroupCache = function() { return this._requestClearDatasourceGroupCache; };

/**
 * @returns {epiviz.events.Event.<{range: epiviz.datatypes.GenomicRange, result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestNavigate = function() { return this._requestNavigate; };

/**
 * @returns {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestRedraw = function() { return this._requestRedraw; };

/**
 * @returns {epiviz.events.Event.<{result: epiviz.events.EventResult}>}
 */
epiviz.data.DataProvider.prototype.onRequestCurrentLocation = function() { return this._requestCurrentLocation; };
