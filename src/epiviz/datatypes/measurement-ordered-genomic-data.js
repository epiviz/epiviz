/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/15/2015
 * Time: 5:42 PM
 */

goog.provide('epiviz.datatypes.MeasurementOrderedGenomicData');

/**
 * @param {epiviz.datatypes.GenomicData} data
 * @param {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.measurements.Measurement, string|number>} order
 * @constructor
 * @extends {epiviz.datatypes.MapGenomicData}
 */
epiviz.datatypes.MeasurementOrderedGenomicData = function(data, order) {
  epiviz.datatypes.MapGenomicData.call(this);

  /**
   * @type {epiviz.datatypes.GenomicData}
   * @private
   */
  this._data = data;

  /**
   * @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.measurements.Measurement, string|number>}
   * @private
   */
  this._order = order;

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.datatypes.MeasurementOrderedGenomicData.prototype = epiviz.utils.mapCopy(epiviz.datatypes.MapGenomicData.prototype);
epiviz.datatypes.MeasurementOrderedGenomicData.constructor = epiviz.datatypes.MeasurementOrderedGenomicData;

/**
 * @private
 */
epiviz.datatypes.MeasurementOrderedGenomicData.prototype._initialize = function() {

  /** @type {*} */
  var preOrderVars = this._order.preMark()(this._data);

  /** @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} */
  var map = new epiviz.measurements.MeasurementHashtable();

  /** @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.datatypes.GenomicData.ValueItem, boolean>} */
  var order = this._order;

  /** @type {epiviz.datatypes.GenomicData} */
  var data = this._data;

  var measurements = this._data.measurements().sort(function(m1, m2) {
    var v1 = order.mark()(m1, data, preOrderVars);
    var v2 = order.mark()(m2, data, preOrderVars);
    return (v1 == v2) ? 0 : (v1 < v2 ? -1 : 1);
  });

  measurements.forEach(function(m) {
    map.put(m, data.getSeries(m));
  });

  this._setMap(map);
};
