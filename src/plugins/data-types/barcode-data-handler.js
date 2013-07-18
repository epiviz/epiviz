/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 5/27/13
 * Time: 8:03 PM
 * To change this template use File | Settings | File Templates.
 */

BarcodeDataHandler.prototype = new DataTypeHandler({
  dataType: 'barcodeData',
  dataTypeName: 'Barcode Data',
  measurementsType: 'barcodeMeasurements',
  measurementsStore: new BarcodeMeasurementsStore(),
  isNumeric: false
});

BarcodeDataHandler.prototype.constructor = BarcodeDataHandler;

function BarcodeDataHandler() {
  //this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerDataType(new BarcodeDataHandler());
});

/*
 * Used by ChartDataCache
 *
 * data is of the data type corresponding to this chart type
 */
BarcodeDataHandler.prototype.subsetData = function(barcodeData, start, end) {
  if (!barcodeData || !barcodeData.data) { return null; }
  var data = barcodeData.data;

  var startEndIndices = DataManager.getStartEndIndices(start, end, data['start'], data['end']);

  // Unfortunately, probe end column is not sorted, so we can't use startIndex
  var endIndex = startEndIndices.endIndex;
  var indices = [];
  for (var j = 0; j <= endIndex; ++j) {
    if (data['end'][j] >= start) { indices.push(j); }
  }

  var result = new Object({
    chr: barcodeData['chr'],
    start: start,
    end: end,
    data: {
      values: {}
    }
  });

  var col;
  for (col in data.values) {
    result['data']['values'][col] = [];
    for (j = 0; j < indices.length; ++j) {
      result['data']['values'][col].push(data.values[col][indices[j]]);
    }
  }

  for (col in data) {
    if (col == 'values') { continue; }

    result['data'][col] = [];
    for (j = 0; j < indices.length; ++j) {
      result['data'][col].push(data[col][indices[j]]);
    }
  }

  return result;
};

/*
 * Used by ChartDataCache
 *
 * d1, d2 are of the data type corresponding to this chart type
 */
BarcodeDataHandler.prototype.joinDataByLocation = function(d1, d2) {
  // TODO: Check correctness
  if (!d1 || !d1.data || jQuery.isEmptyObject(d1.data) || jQuery.isEmptyObject(d1.data.values)) { return d2; }
  if (!d2 || !d2.data || jQuery.isEmptyObject(d2.data) || jQuery.isEmptyObject(d2.data.values)) { return d1; }
  var data1 = d1.data;
  var data2 = d2.data;
  var j = data1['end'].length - 1;
  while (j >= 0 && data1['end'][j] >= d2.start) { --j; }
  var nDupes = data1['end'].length - j - 1;
  var col;
  for (col in data1) {
    if (col == 'values') { continue; }
    data1[col].splice(j + 1, nDupes);
    data1[col] = data1[col].concat(data2[col]);
  }

  for (col in data1.values) {
    data1.values[col].splice(j + 1, nDupes);
    data1.values[col] = data1.values[col].concat(data2.values[col]);
  }

  d1.end = d2.end;

  return d1;
};

/*
 * Used by DataCache. Merges data from the second data source with that of the first data source
 * (for example, server and local controller). The measurements in the two data sources have
 * to be different.
 */
BarcodeDataHandler.prototype.mergeDataByMeasurements = function(d1, d2, d2Measurements) {
  if (!d1 || !d1.data) {
    d1 = d2;
  } else if (d2 && d2.data) {

    // First make a record of all probes in the d1
    var probes = {};
    var d1BarcodeData = d1.data;
    for (var i = 0; i < d1BarcodeData.probe.length; ++i) {
      probes[d1BarcodeData.probe[i]] = i;
    }

    var n = i;
    var d2BarcodeData = d2.data;
    for (i = 0; i < d2BarcodeData.probe.length; ++i) {
      if (!probes[d2BarcodeData.probe[i]]) {
        probes[d2BarcodeData.probe[i]] = n++;

        // Add rows in the server data for all the probes that are only present in the local data
        d1BarcodeData.probe.push(d2BarcodeData.probe[i]);
        d1BarcodeData.start.push(d2BarcodeData.start[i]);
        d1BarcodeData.end.push(d2BarcodeData.end[i]);
        for (var colname in d1BarcodeData.values) {
          d1BarcodeData.values[colname].push(null);
        }
      }
    }

    for (i = 0; i < d2Measurements.length; ++i) {
      d1BarcodeData.values[d2Measurements[i]] = Utils.fillArray(n, null);
      for (var j = 0; j < d2BarcodeData.probe.length; ++j) {
        d1BarcodeData.values[d2Measurements[i]][probes[d2BarcodeData.probe[j]]] = d2BarcodeData.values[d2Measurements[i]][j];
      }
    }
  }

  return d1;
};

/*
 * Splits the given measurements into those corresponding to dataSource1, and dataSource2
 * (for example, server and local controller).
 */
BarcodeDataHandler.prototype.splitMeasurements = function(measurements, dataSources) {

  var i;
  var result = [];
  for (i = 0; i < dataSources.length; ++i) {
    result.push([]);
  }

  for (var j = 0; j < measurements.length; ++j) {

    for (i = 0; i < dataSources.length; ++i) {
      if (dataSources[i]){
        var d = this._measurementsStore.keyToName(measurements[j]);
        if (dataSources[i][d.tissue] &&
          (!d.subtype || dataSources[i][d.tissue][d.subtype]) &&
          (!d.sample || jQuery.inArray(d.sample, dataSources[i][d.tissue][d.subtype])>=0)) {
          result[i].push(measurements[j]);
          break;
        }
      }
    }
  }

  return result;
};

BarcodeDataHandler.prototype.buildRequestSubquery = function(measurements) {
  if (!measurements || !measurements.length) {
    return '';
  }

  var subQuery = '';

  for (var i = 0; i < measurements.length; ++i) {
    var type = this._measurementsStore.getColumnType(measurements[i]);
    var measurementType;
    switch (type) {
      case 'tissue':
        measurementType = 'barcodeTissues';
        break;
      case 'subtype':
        measurementType = 'barcodeSubtypes';
        break;
      case 'sample':
        measurementType = 'barcodeSamples';
        break;
    }
    subQuery += sprintf('&%s[]=%s', measurementType, measurements[i].replace('+', '%2B'));
  }

  return subQuery;
};
