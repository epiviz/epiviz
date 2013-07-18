/**
 * Created by: Florin Chelaru
 * Date: 5/27/13
 * Time: 8:43 PM
 */

GeneDataHandler.prototype = new DataTypeHandler({
  dataType: 'genes',
  dataTypeName: 'Genes',
  measurementsType: 'genes',
  measurementsStore: new MeasurementsStore(),
  isNumeric: false
});

GeneDataHandler.prototype.constructor = GeneDataHandler;

function GeneDataHandler() {
}

$(function() {
  ChartFactory.instance.registerDataType(new GeneDataHandler());
});

/*
 * Used by ChartDataCache
 *
 * data is of the data type corresponding to this chart type
 */
GeneDataHandler.prototype.subsetData = function(genes, start, end) {
  if (!genes || !genes.data) { return null; }
  var data = genes.data;
  var startEndIndices = DataManager.getStartEndIndices(start, end, data['start'], data['end']);
  // Unfortunately, genes end column is not sorted, so we can't use startIndex
  var endIndex = startEndIndices.endIndex;
  var indices = [];
  for (var j = 0; j <= endIndex; ++j) {
    if (data['end'][j] >= start) { indices.push(j); }
  }

  var result = new Object({
    chr: genes['chr'],
    start: start,
    end: end,
    row_count: indices.length,
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
GeneDataHandler.prototype.joinDataByLocation = function(genes1, genes2) {
  if (!genes1 || !genes1.data || jQuery.isEmptyObject(genes1.data)) { return genes2; }
  if (!genes2 || !genes2.data || jQuery.isEmptyObject(genes2.data)) { return genes1; }

  // Find index of last gene in data that doesn't match any gene in this._data
  var data1 = genes1.data;
  var data2 = genes2.data;

  var j = 0;
  while (j < data2['start'].length && data2['start'][j] <= genes1.end) { ++j; }
  var nDupes = j;

  var cols = d3.keys(data1);
  for (var i = 0; i < cols.length; ++i) {
    data2[cols[i]].splice(0, nDupes);
    data1[cols[i]] = data1[cols[i]].concat(data2[cols[i]]);
  }

  genes1.end = genes2.end;
  genes1['row_count'] = data1['gene'].length;

  return genes1;
};

/*
 * Used by DataCache. Merges data from the second data source with that of the first data source
 * (for example, server and local controller). The measurements in the two data sources have
 * to be different.
 */
GeneDataHandler.prototype.mergeDataByMeasurements = function(d1, d2, d2Measurements) {
  return d1;
};

