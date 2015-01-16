/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/16/2015
 * Time: 10:56 AM
 */

goog.provide('epiviz.datatypes.MeasurementAggregatedGenomicData');

/**
 * @param {epiviz.datatypes.GenomicData} data
 * @param {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.measurements.Measurement, string>} groupByMarker
 * @constructor
 * @extends {epiviz.datatypes.MapGenomicData}
 */
epiviz.datatypes.MeasurementAggregatedGenomicData = function(data, groupByMarker) {
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
   * TODO: Temporary mean and std aggregator, later make this customizable
   * @type {function(string, Array.<epiviz.measurements.Measurement>, Array.<number>): {value: number, errMinus: number=, errPlus: number=}}
   * @private
   */
  this._aggregator = function(label, measurements, values) {
    if (!values || values.length == 0) { return null; }
    var mean = values.reduce(function(v1, v2) { return v1 + v2; }) / values.length;
    var variance = values
      .map(function(v) { return (v - mean) * (v - mean); })
      .reduce(function(v1, v2) { return v1 + v2; }) / values.length;
    var stdev = Math.sqrt(variance);
    return {
      value: mean,
      errMinus: mean - stdev,
      errPlus: mean + stdev
    };
  };

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.datatypes.MeasurementAggregatedGenomicData.prototype = epiviz.utils.mapCopy(epiviz.datatypes.MapGenomicData.prototype);
epiviz.datatypes.MeasurementAggregatedGenomicData.constructor = epiviz.datatypes.MeasurementAggregatedGenomicData;

/**
 * @private
 */
epiviz.datatypes.MeasurementAggregatedGenomicData.prototype._initialize = function() {

  /** @type {*} */
  var preGroupVars = this._groupByMarker.preMark()(this._data);

  /** @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.MeasurementGenomicData>} */
  var map = new epiviz.measurements.MeasurementHashtable();

  /** @type {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.datatypes.GenomicData, *, epiviz.measurements.Measurement, string>} */
  var groupBy = this._groupByMarker;

  /** @type {epiviz.datatypes.GenomicData} */
  var data = this._data;

  /**
   * @type {Object.<string, Array.<epiviz.measurements.Measurement>>}
   */
  var grouped = {};
  data.measurements().forEach(function(m) {
    var groupLabel = groupBy.mark()(m, data, preGroupVars);
    if (!(groupLabel in grouped)) {
      grouped[groupLabel] = [];
    }
    grouped[groupLabel].push(m);
  });

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
      annotation = ms[0].annotation(),
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
      var aggregation = this._aggregator(label, ms, values);
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

  this._setMap(map);
};

