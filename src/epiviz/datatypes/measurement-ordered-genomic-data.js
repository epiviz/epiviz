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

  /**
   * @type {epiviz.deferred.Deferred}
   * @private
   */
  this._deferredInit = null;

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.datatypes.MeasurementOrderedGenomicData.prototype = epiviz.utils.mapCopy(epiviz.datatypes.MapGenomicData.prototype);
epiviz.datatypes.MeasurementOrderedGenomicData.constructor = epiviz.datatypes.MeasurementOrderedGenomicData;

/**
 * @returns {epiviz.deferred.Deferred}
 * @private
 */
epiviz.datatypes.MeasurementOrderedGenomicData.prototype._initialize = function() {

  if (this._deferredInit) { return this._deferredInit; }

  this._deferredInit = new epiviz.deferred.Deferred();

  var self = this;

  /** @type {epiviz.datatypes.GenomicData} */
  var data = this._data;

  /** @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.datatypes.GenomicData.ValueItem, boolean>} */
  var order = this._order;

  data.ready(function() {
    order.preMark()(data).done(function(preOrderVars) {
      /** @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} */
      var map = new epiviz.measurements.MeasurementHashtable();

      var measurements = data.measurements();
      var measurementLabels = new epiviz.measurements.MeasurementHashtable();
      epiviz.utils.deferredFor(measurements.length, function(j) {
        var mDeferredIteration = new epiviz.deferred.Deferred();
        var m = measurements[j];
        order.mark()(m, data, preOrderVars).done(function(label) {
          measurementLabels.put(m, label);
          mDeferredIteration.resolve();
        });
        return mDeferredIteration;
      }).done(function() {
        measurements.sort(function(m1, m2) {
          var v1 = measurementLabels.get(m1);
          var v2 = measurementLabels.get(m2);
          return (v1 == v2) ? 0 : (v1 < v2 ? -1 : 1);
        });

        measurements.forEach(function(m) {
          map.put(m, data.getSeries(m));
        });

        self._setMap(map);
        self._deferredInit.resolve();
      });
    });
  });

  return this._deferredInit;
};
