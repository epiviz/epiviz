/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/15/2015
 * Time: 1:56 PM
 */

goog.provide('epiviz.datatypes.ItemFilteredGenomicData');

/**
 * @param {epiviz.datatypes.GenomicData} data
 * @param {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.datatypes.GenomicData.ValueItem, boolean>} filter
 * @constructor
 * @extends {epiviz.datatypes.MapGenomicData}
 */
epiviz.datatypes.ItemFilteredGenomicData = function(data, filter) {
  epiviz.datatypes.MapGenomicData.call(this);

  /**
   * @type {epiviz.datatypes.GenomicData}
   * @private
   */
  this._data = data;

  /**
   * @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.datatypes.GenomicData.ValueItem, boolean>}
   * @private
   */
  this._filter = filter;

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
epiviz.datatypes.ItemFilteredGenomicData.prototype = epiviz.utils.mapCopy(epiviz.datatypes.MapGenomicData.prototype);
epiviz.datatypes.ItemFilteredGenomicData.constructor = epiviz.datatypes.ItemFilteredGenomicData;

/**
 * @returns {epiviz.deferred.Deferred}
 * @private
 */
epiviz.datatypes.ItemFilteredGenomicData.prototype._initialize = function() {

  if (this._deferredInit) { return this._deferredInit; }

  this._deferredInit = new epiviz.deferred.Deferred();

  var self = this;

  /** @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.datatypes.GenomicData.ValueItem, boolean>} */
  var filter = this._filter;

  /** @type {epiviz.datatypes.GenomicData} */
  var data = this._data;

  data.ready(function() {
    filter.preMark()(data).done(function(preFilterVars) {
      /** @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} */
      var map = new epiviz.measurements.MeasurementHashtable();

      var measurements = data.measurements();

      epiviz.utils.deferredFor(measurements.length, function(j) {
        var mDeferredIteration = new epiviz.deferred.Deferred();
        var m = measurements[j];
        var mItems = [];
        var mItemsByGlobalIndex = {};

        epiviz.utils.deferredFor(data.size(m), function(i) {
          var dataDeferredIteration = new epiviz.deferred.Deferred();
          var item = data.get(m, i);
          filter.mark()(item, data, preFilterVars).done(function(markResult) {
            if (markResult) {
              mItems.push(item);
              mItemsByGlobalIndex[item.globalIndex] = item;
            }
            dataDeferredIteration.resolve();
          });
          return dataDeferredIteration;
        }).done(function() {
          map.put(m, new epiviz.datatypes.MeasurementGenomicDataArrayWrapper(m, mItems, mItemsByGlobalIndex));
          mDeferredIteration.resolve();
        });

        return mDeferredIteration;
      }).done(function() {
        self._setMap(map);
        self._deferredInit.resolve();
      });
    });
  });

  return this._deferredInit;
};
