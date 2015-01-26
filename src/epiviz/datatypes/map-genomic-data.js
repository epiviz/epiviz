/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/15/2015
 * Time: 4:52 PM
 */

goog.provide('epiviz.datatypes.MapGenomicData');

/**
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} [map]
 * @constructor
 * @implements {epiviz.datatypes.GenomicData}
 */
epiviz.datatypes.MapGenomicData = function(map) {
  /**
   * @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>}
   * @private
   */
  this._map = map;

  /**
   * @type {Array.<epiviz.measurements.Measurement>}
   * @private
   */
  this._measurements = map ? map.keys() : null;

  /**
   * @type {epiviz.deferred.Deferred}
   * @private
   */
  this._mapLoaded = new epiviz.deferred.Deferred();

  if (this._map) { this._mapLoaded.resolve(); }
};

/**
 * @param {function} callback
 */
epiviz.datatypes.MapGenomicData.prototype.ready = function(callback) {
  this._mapLoaded.done(callback);
};

/**
 * @returns {boolean}
 */
epiviz.datatypes.MapGenomicData.prototype.isReady = function() {
  return this._mapLoaded.state() == epiviz.deferred.Deferred.State.RESOLVED;
};

/**
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} map
 * @protected
 */
epiviz.datatypes.MapGenomicData.prototype._setMap = function(map) {
  if (this._map) { throw Error('MapGenomicData is immutable'); }
  this._map = map;
  if (!map) { return; }
  this._measurements = map.keys();
  this._mapLoaded.resolve();
};

/**
 * @returns {epiviz.datatypes.MeasurementGenomicData}
 */
epiviz.datatypes.MapGenomicData.prototype.firstSeries = function() {
  if (this._map.size() == 0) { return null; }
  return this._map.first().value;
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {epiviz.datatypes.MeasurementGenomicData}
 */
epiviz.datatypes.MapGenomicData.prototype.getSeries = function(m) {
  return this._map.get(m);
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} i
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MapGenomicData.prototype.get = function(m, i) {
  var mItems = this._map.get(m);
  if (!mItems) { return null; }
  return mItems.get(i);
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} i
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MapGenomicData.prototype.getRow = function(m, i) {
  var mItems = this._map.get(m);
  if (!mItems) { return null; }
  return mItems.getRow(i);
};

/**
 * @returns {Array.<epiviz.measurements.Measurement>}
 */
epiviz.datatypes.MapGenomicData.prototype.measurements = function() {
  return this._measurements;
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {number}
 */
epiviz.datatypes.MapGenomicData.prototype.globalStartIndex = function(m) {
  var mItems = this._map.get(m);
  if (!mItems) { return null; }
  return mItems.globalStartIndex();
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {number}
 */
epiviz.datatypes.MapGenomicData.prototype.globalEndIndex = function(m) {
  var mItems = this._map.get(m);
  if (!mItems) { return null; }
  return mItems.globalEndIndex();
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {number}
 */
epiviz.datatypes.MapGenomicData.prototype.size = function(m) {
  var mItems = this._map.get(m);
  if (!mItems) { return null; }
  return mItems.size();
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.ValueItem}
 */
epiviz.datatypes.MapGenomicData.prototype.getByGlobalIndex = function(m, globalIndex) {
  var mItems = this._map.get(m);
  if (!mItems) { return null; }
  return mItems.getByGlobalIndex(globalIndex);
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {number} globalIndex
 * @returns {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.MapGenomicData.prototype.getRowByGlobalIndex = function(m, globalIndex) {
  var mItems = this._map.get(m);
  if (!mItems) { return null; }
  return mItems.getRowByGlobalIndex(globalIndex);
};

/**
 * Gets the first index and length of the rows that have start positions within the given range
 * @param {epiviz.measurements.Measurement} m
 * @param {epiviz.datatypes.GenomicRange} range
 * @returns {{index: ?number, length: number}}
 */
epiviz.datatypes.MapGenomicData.prototype.binarySearchStarts = function(m, range) {
  var mItems = this._map.get(m);
  if (!mItems) { return {index:null, length:0}; }
  return mItems.binarySearchStarts(range);
};

/**
 * Iterates through all pairs in the map, or until the given function returns something that
 * evaluates to true.
 * @param {function(epiviz.measurements.Measurement, epiviz.datatypes.MeasurementGenomicData, number=)} callback
 */
epiviz.datatypes.MapGenomicData.prototype.foreach = function(callback) {
  this._map.foreach(function(m, series, seriesIndex) {
    callback(m, series, seriesIndex);
  });
};

