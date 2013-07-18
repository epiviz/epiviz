/**
 * Created by: Florin Chelaru
 * Date: 5/27/13
 * Time: 8:32 PM
 */

BpDataHandler.prototype = new DataTypeHandler({
  dataType: 'bpData',
  dataTypeName: 'BP Data',
  measurementsType: 'bpMeasurements',
  measurementsStore: new MeasurementsStore(),
  isNumeric: true
});

BpDataHandler.prototype.constructor = BpDataHandler;

function BpDataHandler() {
  this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerDataType(new BpDataHandler());
});

/*
 * Used by ChartDataCache
 *
 * data is of the data type corresponding to this chart type
 */
BpDataHandler.prototype.subsetData = function(bpData, start, end) {
  if (!bpData || !bpData.data) { return null; }
  var result = new Object({
    chr: bpData.chr,
    start: start,
    end: end,
    min: bpData.min,
    max: bpData.max,
    data: {}
  });
  var measurements = d3.keys(bpData.data);

  for (var j = 0; j < measurements.length; ++j) {
    var data = bpData.data[measurements[j]];

    var startEndIndices = DataManager.getStartEndIndices(start, end, data['bp'], data['bp']);
    var startIndex = startEndIndices.startIndex;
    var endIndex = startEndIndices.endIndex;
    var rowCount = (startIndex >= 0 && endIndex >= 0) ? endIndex - startIndex + 1 : 0;

    result.data[measurements[j]] = new Object({
      bp: (rowCount > 0) ? data['bp'].slice(startIndex, endIndex + 1) : [],
      value: (rowCount > 0) ? data['value'].slice(startIndex, endIndex + 1) : []
    });
  }

  return result;
};

/*
 * Used by ChartDataCache
 *
 * d1, d2 are of the data type corresponding to this chart type
 */
BpDataHandler.prototype.joinDataByLocation = function(d1, d2) {
  if (!d1 || !d1.data || jQuery.isEmptyObject(d1.data)) { return d2; }
  if (!d2 || !d2.data || jQuery.isEmptyObject(d2.data)) { return d1; }
  var data1 = d1.data;
  var data2 = d2.data;
  var measurements = d3.keys(data1);

  for (var k = 0;  k < measurements.length; ++k) {
    var m1 = data1[measurements[k]];
    var m2 = data2[measurements[k]];
    var j = m1['bp'].length - 1;
    while (j >= 0 && m1['bp'][j] >= d2.start) { --j; }
    var nDupes = m1['bp'].length - j - 1;
    var cols = d3.keys(m1);
    for (var i = 0; i < cols.length; ++i) {
      m1[cols[i]].splice(j + 1, nDupes);
      m1[cols[i]] = m1[cols[i]].concat(m2[cols[i]]);
    }
  }

  d1.end = d2.end;

  return d1;
};

/*
 * Used by DataCache. Merges data from the second data source with that of the first data source
 * (for example, server and local controller). The measurements in the two data sources have
 * to be different.
 */
BpDataHandler.prototype.mergeDataByMeasurements = function(d1, d2, d2Measurements) {
  if (!d1 || !d1.data) {
    d1 = d2;
  } else {
    for (var i = 0; i < d2Measurements.length; ++i) {
      d1.min[d2Measurements[i]] = d2.min[d2Measurements[i]];
      d1.max[d2Measurements[i]] = d2.max[d2Measurements[i]];
      d1.data[d2Measurements[i]] = d2.data[d2Measurements[i]];
    }
  }

  return d1;
};

