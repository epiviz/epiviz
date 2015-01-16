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

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.datatypes.ItemFilteredGenomicData.prototype = epiviz.utils.mapCopy(epiviz.datatypes.MapGenomicData.prototype);
epiviz.datatypes.ItemFilteredGenomicData.constructor = epiviz.datatypes.ItemFilteredGenomicData;

/**
 * @private
 */
epiviz.datatypes.ItemFilteredGenomicData.prototype._initialize = function() {

  /** @type {*} */
  var preFilterVars = this._filter.preMark()(this._data);

  /** @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} */
  var map = new epiviz.measurements.MeasurementHashtable();

  /** @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.datatypes.GenomicData.ValueItem, boolean>} */
  var filter = this._filter;

  /** @type {epiviz.datatypes.GenomicData} */
  var data = this._data;
  data.measurements().forEach(function(m) {
    var mItems = [];
    var mItemsByGlobalIndex = {};
    for (var i = 0; i < data.size(m); ++i) {
      var item = data.get(m, i);
      if (filter.mark()(item, data, preFilterVars)) {
        mItems.push(item);
        mItemsByGlobalIndex[item.globalIndex] = item;
      }
    }

    map.put(m, new epiviz.datatypes.MeasurementGenomicDataArrayWrapper(m, mItems, mItemsByGlobalIndex));
  });

  this._setMap(map);
};
