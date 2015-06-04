/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/16/2015
 * Time: 10:56 AM
 */

goog.provide('epiviz.datatypes.MeasurementAggregatedGenomicData');

/**
 * @param {epiviz.datatypes.GenomicData} data
 * @param {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.measurements.Measurement, string>} groupByMarker
 * @param {epiviz.ui.charts.markers.MeasurementAggregator} aggregator
 * @constructor
 * @extends {epiviz.datatypes.MapGenomicData}
 */
epiviz.datatypes.MeasurementAggregatedGenomicData = function(data, groupByMarker, aggregator) {
  epiviz.datatypes.MapGenomicData.call(this);

  /**
   * @type {epiviz.datatypes.GenomicData}
   * @private
   */
  this._data = data;

  /**
   * @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.measurements.Measurement, string>}
   * @private
   */
  this._groupByMarker = groupByMarker;

  /**
   * @type {epiviz.ui.charts.markers.MeasurementAggregator}
   * @private
   */
  this._aggregator = aggregator;

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
epiviz.datatypes.MeasurementAggregatedGenomicData.prototype = epiviz.utils.mapCopy(epiviz.datatypes.MapGenomicData.prototype);
epiviz.datatypes.MeasurementAggregatedGenomicData.constructor = epiviz.datatypes.MeasurementAggregatedGenomicData;

/**
 * @returns {epiviz.deferred.Deferred}
 * @private
 */
epiviz.datatypes.MeasurementAggregatedGenomicData.prototype._initialize = function() {
  if (this._deferredInit) { return this._deferredInit; }

  this._deferredInit = new epiviz.deferred.Deferred();

  var self = this;

  /** @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.measurements.Measurement, string>} */
  var groupBy = this._groupByMarker;

  /** @type {epiviz.datatypes.GenomicData} */
  var data = this._data;

  data.ready(function() {
    groupBy.preMark()(data).done(function(preGroupVars) {
      /** @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} */
      var map = new epiviz.measurements.MeasurementHashtable();

      /** @type {Object.<string, Array.<epiviz.measurements.Measurement>>} */
      var grouped = {};

      var measurements = data.measurements();

      epiviz.utils.deferredFor(measurements.length, function(j) {
        var mDeferredIteration = new epiviz.deferred.Deferred();
        var m = measurements[j];
        groupBy.mark()(m, data, preGroupVars).done(function(groupLabel) {
          if (!(groupLabel in grouped)) {
            grouped[groupLabel] = [];
          }
          grouped[groupLabel].push(m);
          mDeferredIteration.resolve();
        });
        return mDeferredIteration;
      }).done(function() {
        var labelMeasurements = {};
        var label;
        /** @type {Array.<epiviz.measurements.Measurement>} */
        var ms;
        for (label in grouped) {
          if (!grouped.hasOwnProperty(label)) { continue; }

          ms = grouped[label];
          var id = label + '-group',
            name = label,
            type = ms[0].type(),
            datasourceId = ms[0].datasourceId(),
            datasourceGroup = ms[0].datasourceGroup(),
            dataprovider = ms[0].dataprovider(),
            defaultChartType = ms[0].defaultChartType(),
            annotation = epiviz.utils.mapCopy(ms[0].annotation()),
            minValue = ms[0].minValue(),
            maxValue = ms[0].maxValue(),
            metadata = ['errMinus', 'errPlus'].concat(ms[0].metadata());
          var metadataColsMap = {};
          metadata.forEach(function(c) { metadataColsMap[c] = c; });
          grouped[label].forEach(function(m) {
            if (datasourceId != m.datasourceId()) { datasourceId = '*'; }
            if (datasourceGroup != m.datasourceGroup()) { datasourceGroup = '*'; }
            if (dataprovider != m.dataprovider()) { dataprovider = '*'; }
            if (defaultChartType != m.defaultChartType()) { defaultChartType = '*'; }

            var mAnno = m.annotation();
            if (annotation != mAnno) {
              if (annotation == undefined) { annotation = epiviz.utils.mapCopy(mAnno); }
              else if (mAnno != undefined) {
                for (var k in mAnno) {
                  if (!mAnno.hasOwnProperty(k)) { continue; }
                  if (!(k in annotation)) { annotation[k] = mAnno[k]; continue; }
                  if (annotation[k] != mAnno[k]) { annotation[k] = '*'; }
                }
              }
            }
            minValue = Math.min(minValue, m.minValue());
            maxValue = Math.max(maxValue, m.maxValue());

            m.metadata().forEach(function(c) {
              if (!(c in metadataColsMap)) {
                metadataColsMap[c] = c;
                metadata.push(c);
              }
            });
          });
          labelMeasurements[label] = new epiviz.measurements.Measurement(id, name, type, datasourceId, datasourceGroup, dataprovider, null, defaultChartType, annotation, minValue, maxValue, metadata);
        }

        for (label in grouped) {
          if (!grouped.hasOwnProperty(label)) { continue; }
          var m = labelMeasurements[label];
          var items = [];
          var itemsByGlobalIndex = {};
          ms = grouped[label];
          var globalStartIndex = Math.min.apply(undefined, ms.map(function(m) { return data.globalStartIndex(m); }));
          var globalEndIndex = Math.max.apply(undefined, ms.map(function(m) { return data.globalEndIndex(m); }));
          for (var globalIndex = globalStartIndex; globalIndex < globalEndIndex; ++globalIndex) {
            /** @type {Array.<epiviz.datatypes.GenomicData.ValueItem>} */
            var indexItems = ms
              .map(function(m) { return data.getByGlobalIndex(m, globalIndex); })
              .filter(function(item) { return item; });
            if (!indexItems.length) { continue; }
            var values = indexItems
              .map(function(item) { return item.value; });
            var aggregation = self._aggregator.aggregate(label, ms, values);
            var row = indexItems[0].rowItem;
            var aggRow = new epiviz.datatypes.RowItemImpl(row.id(), row.seqName(), row.start(), row.end(), row.globalIndex(), row.strand(),
              epiviz.utils.mapCombine(row.rowMetadata() || {}, {errMinus:aggregation.errMinus, errPlus:aggregation.errPlus}));
            var item = new epiviz.datatypes.GenomicData.ValueItem(globalIndex, aggRow, aggregation.value, m);
            items.push(item);
            itemsByGlobalIndex[globalIndex] = item;
          }
          var series = new epiviz.datatypes.MeasurementGenomicDataArrayWrapper(m, items, itemsByGlobalIndex);
          map.put(m, series);
        }

        self._setMap(map);
        self._deferredInit.resolve();
      });
    });
  });

  return this._deferredInit;
};
