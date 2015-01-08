/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/7/2015
 * Time: 12:47 PM
 */

goog.provide('epiviz.ui.charts.markers.ChartMarker');

/**
 * TODO: This is not generic to Visualization but only to Chart! Later we should adapt these types to something more generic
 * @param {epiviz.ui.charts.markers.ChartMarker.Type} type
 * @param {string} [id]
 * @param {string} [name]
 * @param {function(epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>): T} [preMark]
 * @param {function(epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>, T): V} [mark]
 * @constructor
 * @template T, V
 */
epiviz.ui.charts.markers.ChartMarker = function(type, id, name, preMark, mark) {

  /**
   * @type {epiviz.ui.charts.markers.ChartMarker.Type}
   * @private
   */
  this._type = type;

  /**
   * @type {string}
   * @protected
   */
  this._id = id || epiviz.utils.generatePseudoGUID(6);

  /**
   * @type {string}
   * @protected
   */
  this._name = name || 'Custom Marker ' + this._id;

  /**
   * @type {function(epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>): T}
   * @protected
   */
  this._preMark = preMark || function() {};

  /**
   * @type {function(epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>, T): V}
   * @protected
   */
  this._mark = mark || function() {};
};

/**
 * @returns {epiviz.ui.charts.markers.ChartMarker.Type}
 */
epiviz.ui.charts.markers.ChartMarker.prototype.type = function() { return this._type; };

/**
 * @returns {string}
 */
epiviz.ui.charts.markers.ChartMarker.prototype.id = function() { return this._id; };

/**
 * @returns {string}
 */
epiviz.ui.charts.markers.ChartMarker.prototype.name = function() { return this._name; };

/**
 * @returns {function(epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>): T}
 */
epiviz.ui.charts.markers.ChartMarker.prototype.preMark = function() { return this._preMark; };

/**
 * @returns {function(epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>, T): V}
 */
epiviz.ui.charts.markers.ChartMarker.prototype.mark = function() { return this._mark; };

/**
 * @enum {string}
 */
epiviz.ui.charts.markers.ChartMarker.Type = {
  FILTER: 'filter',
  COLOR: 'color',
  ORDER: 'order'
};

/**
 * @returns {{type: string, id: string, name: string, preMark: string, mark: string}}
 */
epiviz.ui.charts.markers.ChartMarker.prototype.raw = function() {
  return {
    type: this._type,
    id: this._id,
    name: this._name,
    preMark: this._preMark.toString(),
    mark: this._mark.toString()
  };
};

/**
 * @param {{type: string, id: string, name: string, preMark: string, mark: string}} o
 * @returns {epiviz.ui.charts.markers.ChartMarker}
 */
epiviz.ui.charts.markers.ChartMarker.fromRawObject = function(o) {
  return new epiviz.ui.charts.markers.ChartMarker(
    o.type,
    o.id,
    o.name,
    eval('(' + o.preMark + ')'),
    eval('(' + o.mark + ')'));
};
