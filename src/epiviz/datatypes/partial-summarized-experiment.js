/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/1/13
 * Time: 12:05 PM
 */

goog.provide('epiviz.datatypes.PartialSummarizedExperiment');

goog.require('epiviz.datatypes.GenomicRangeArray');

/**
 * @constructor
 */
epiviz.datatypes.PartialSummarizedExperiment = function() {
  /**
   * @type {?epiviz.datatypes.GenomicRangeArray}
   * @private
   */
  this._rowData = null;

  /**
   * @type {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.FeatureValueArray>}
   * @private
   */
  this._values = new epiviz.measurements.MeasurementHashtable();

};

/**
 * @returns {epiviz.datatypes.GenomicRangeArray}
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.ranges = function() { return this.rowData(); };

/**
 * @returns {?epiviz.datatypes.GenomicRangeArray}
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.rowData = function() {
  return this._rowData;
};

/**
 * @param {epiviz.datatypes.GenomicRangeArray} rowData
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.addRowData = function(rowData) {
  if (!rowData) {
    return;
  }
  if (!this._rowData ||
    this._rowData.boundaries().seqName() != rowData.boundaries().seqName() ||
    this._rowData.boundaries().start() > rowData.boundaries().end() ||
    this._rowData.boundaries().end() < rowData.boundaries().start() ||
    rowData.measurement().type() == epiviz.measurements.Measurement.Type.UNORDERED) {
    this._rowData = rowData;
    return;
  }

  this._rowData = this._rowData.merge(rowData);
};

/**
 * @param {epiviz.datatypes.FeatureValueArray} values
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.addValues = function(values) {
  if (!values) {
    return;
  }
  var currentValues = this._values.get(values.measurement());
  if (!currentValues ||
    currentValues.boundaries().seqName() != values.boundaries().seqName() ||
    currentValues.boundaries().start() > values.boundaries().end() ||
    currentValues.boundaries().end() < values.boundaries().start() ||
    values.measurement().type() == epiviz.measurements.Measurement.Type.UNORDERED) {
    this._values.put(values.measurement(), values);
    return;
  }

  this._values.put(values.measurement(), currentValues.merge(values));
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @returns {epiviz.datatypes.PartialSummarizedExperiment}
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.trim = function (range) {
  var result = new epiviz.datatypes.PartialSummarizedExperiment();
  if (this._rowData) {
    result.addRowData(this._rowData.trim(range));
  }

  if (result.rowData()) {
    this._values.foreach(function (m, featureValueArray) {
      result.addValues(featureValueArray.trim(range, result.rowData().globalStartIndex(), result.rowData().size()));
    });
  }

  return result;
};

/**
 * @param {epiviz.measurements.Measurement} measurement
 * @returns {epiviz.datatypes.FeatureValueArray}
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.values = function(measurement) {
  return this._values.get(measurement);
};

/**
 * Gets the first global index contained in either the rows or one of the value
 * columns loaded so far (inclusive)
 * @returns {?number}
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.calcMinGlobalIndex = function() {
  var minGlobalIndex = this._rowData ? this._rowData.globalStartIndex() : null;

  if (this._values) {
    this._values.foreach(function(m, valuesArray) {
      if (valuesArray && valuesArray.globalStartIndex() != undefined && (minGlobalIndex == undefined || minGlobalIndex > valuesArray.globalStartIndex())) {
        minGlobalIndex = valuesArray.globalStartIndex();
      }
    });
  }

  return minGlobalIndex;
};

/**
 * Gets the last global index contained in either the rows or one of the value
 * columns loaded so far (exclusive)
 * @returns {?number}
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.calcMaxGlobalIndex = function() {
  var maxGlobalIndex = (this._rowData && this._rowData.globalStartIndex() != undefined) ? this._rowData.globalStartIndex() + this._rowData.size() : null;

  if (this._values) {
    this._values.foreach(function(m, valuesArray) {
      if (valuesArray && valuesArray.globalStartIndex() != undefined && (maxGlobalIndex == undefined || maxGlobalIndex < valuesArray.globalStartIndex() + valuesArray.size())) {
        maxGlobalIndex = valuesArray.globalStartIndex() + valuesArray.size();
      }
    });
  }

  return maxGlobalIndex;
};

/**
 * @returns {string}
 */
epiviz.datatypes.PartialSummarizedExperiment.prototype.toString = function() {

  var result = '';
  var minGlobalIndex = this.calcMinGlobalIndex();
  var maxGlobalIndex = this.calcMaxGlobalIndex();

  result += sprintf('%25s', this._rowData && this._rowData.measurement() ? this._rowData.measurement().name().substr(0, 22) : '[undefined datasource]');
  var chr, start, end, rowGlobalIndex, rowSize;
  if (this._rowData && this._rowData.boundaries()) {
    chr = this._rowData.boundaries().seqName();
    start = this._rowData.boundaries().start();
    end = this._rowData.boundaries().end();
    rowGlobalIndex = this._rowData.globalStartIndex() != undefined ? this._rowData.globalStartIndex() : '*';
    rowSize = this._rowData.size();
  } else {
    chr = start = end = rowGlobalIndex = '*';
    rowSize = 0;
  }
  result += sprintf(' [%6s%10s%10s] [globalStartIndex: %10s] [size: %7s]\n', chr, start, end, rowGlobalIndex, rowSize);

  var header = sprintf('%15s%15s%15s%15s%15s', 'id', 'idx', 'chr', 'start', 'end');
  if (this._values) {
    this._values.foreach(function(m, valuesArray) {
      result += sprintf('%25s', m.name().substr(0, 22));
      if (valuesArray && valuesArray.boundaries()) {
        chr = valuesArray.boundaries().seqName();
        start = valuesArray.boundaries().start();
        end = valuesArray.boundaries().end();
      } else {
        chr = start = end = '*';
      }
      result += sprintf(' [%6s%10s%10s] [globalStartIndex: %10s] [size: %7s]\n', chr, start, end, valuesArray.globalStartIndex() != undefined ? valuesArray.globalStartIndex() : '*', valuesArray.size());
      header += sprintf('%25s', m.name().substr(0, 22));
    });
  }
  result += header + '\n';

  for (var globalIndex = minGlobalIndex; globalIndex < maxGlobalIndex; ++globalIndex) {
    var id;
    if (this._rowData && this._rowData.globalStartIndex() != undefined && this._rowData.globalStartIndex() <= globalIndex && this._rowData.globalStartIndex() + this._rowData.size() > globalIndex) {
      var row = this._rowData.getByGlobalIndex(globalIndex);

      id = row.id();
      chr = row.seqName();
      start = row.start();
      end = row.end();
    } else {
      id = chr = start = end = '*';
    }
    result += sprintf('%15s%15s%15s%15s%15s', id, globalIndex, chr, start, end);
    if (this._values) {
      this._values.foreach(function(m, valuesArray) {
        if (valuesArray && valuesArray.globalStartIndex() != undefined && valuesArray.globalStartIndex() <= globalIndex && valuesArray.globalStartIndex() + valuesArray.size() > globalIndex) {
          result += sprintf('%25s', valuesArray.getByGlobalIndex(globalIndex));
        } else {
          result += sprintf('%25s', '*');
        }
      });
    }

    result += '\n';
  }

  return result;
};
