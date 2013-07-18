/**
 * Created by: Florin Chelaru
 * Date: 5/27/13
 * Time: 8:36 PM
 */


ProbeDataHandler.prototype = new DataTypeHandler({
  dataType: 'geneData',
  dataTypeName: 'Probe Data',
  measurementsType: 'geneMeasurements',
  measurementsStore: new MeasurementsStore(),
  isNumeric: true
});

ProbeDataHandler.prototype.constructor = ProbeDataHandler;

function ProbeDataHandler() {
  this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerDataType(new ProbeDataHandler());
});

/*
 * Used by ChartDataCache
 *
 * data is of the data type corresponding to this chart type
 */
ProbeDataHandler.prototype.subsetData = function(geneData, start, end) {
  if (!geneData || !geneData.data) { return null; }
  var data = geneData.data;

  var startEndIndices = DataManager.getStartEndIndices(start, end, data['start'], data['end']);

  // Unfortunately, genes end column is not sorted, so we can't use startIndex
  var endIndex = startEndIndices.endIndex;
  var indices = [];
  for (var j = 0; j <= endIndex; ++j) {
    if (data['end'][j] >= start) { indices.push(j); }
  }

  var result = new Object({
    chr: geneData['chr'],
    start: start,
    end: end,
    min: geneData['min'],
    max: geneData['max'],
    data: {}
  });

  var cols = d3.keys(data);
  for (var i = 0; i < cols.length; ++i) {
    result['data'][cols[i]] = [];
    for (j = 0; j < indices.length; ++j) {
      result['data'][cols[i]].push(data[cols[i]][indices[j]]);
    }
  }

  return result;
};

/*
 * Used by ChartDataCache
 *
 * d1, d2 are of the data type corresponding to this chart type
 */
ProbeDataHandler.prototype.joinDataByLocation = function(d1, d2) {
  // TODO: Check correctness
  if (!d1 || !d1.data || jQuery.isEmptyObject(d1.data)) { return d2; }
  if (!d2 || !d2.data || jQuery.isEmptyObject(d2.data)) { return d1; }
  var data1 = d1.data;
  var data2 = d2.data;
  var j = data1['end'].length - 1;
  while (j >= 0 && data1['end'][j] >= d2.start) { --j; }
  var nDupes = data1['end'].length - j - 1;
  var cols = d3.keys(data1);
  for (var i = 0; i < cols.length; ++i) {
    data1[cols[i]].splice(j + 1, nDupes);
    data1[cols[i]] = data1[cols[i]].concat(data2[cols[i]]);
  }

  d1.end = d2.end;

  return d1;
};

/*
 * Used by DataCache. Merges data from the second data source with that of the first data source
 * (for example, server and local controller). The measurements in the two data sources have
 * to be different.
 */
ProbeDataHandler.prototype.mergeDataByMeasurements = function(d1, d2, d2Measurements) {
  if (!d1 || !d1.data) {
    d1 = d2;
  } else {
    for (var i = 0; i < d2Measurements.length; ++i) {
      d1.min[d2Measurements[i]] = d2.min[d2Measurements[i]];
      d1.max[d2Measurements[i]] = d2.max[d2Measurements[i]];

      // The problem with this approach is that the local data has to output the exact same genes
      // in the exact same order. TODO: Find a way to be more flexible (see code for barcodeData below)
      d1.data[d2Measurements[i]] = d2.data[d2Measurements[i]];
    }
  }

  return d1;
};
