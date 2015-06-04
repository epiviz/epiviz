/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/16/2015
 * Time: 6:58 PM
 */

goog.provide('epiviz.ui.charts.markers.MeasurementAggregator');

/**
 * @param {string} [id]
 * @param {function(string, Array.<epiviz.measurements.Measurement>, Array.<number>): {value: number, errMinus: number=, errPlus: number=}} aggregator
 * @constructor
 */
epiviz.ui.charts.markers.MeasurementAggregator = function(id, aggregator) {
  /**
   * @type {string}
   * @private
   */
  this._id = id;

  /**
   * @type {function(string, Array.<epiviz.measurements.Measurement>, Array.<number>): {value: number, errMinus?: number, errPlus?: number}}
   * @private
   */
  this._aggregator = aggregator;
};

/**
 * @param {string} label
 * @param {Array.<epiviz.measurements.Measurement>} measurements
 * @param {Array.<number>} values
 * @returns {{value: number, errMinus?: number, errPlus?: number}}
 */
epiviz.ui.charts.markers.MeasurementAggregator.prototype.aggregate = function(label, measurements, values) {
  return this._aggregator(label, measurements, values);
};

/**
 * @returns {string}
 */
epiviz.ui.charts.markers.MeasurementAggregator.prototype.id = function() { return this._id; };

/**
 * @type{Object.<string, epiviz.ui.charts.markers.MeasurementAggregator>}
 */
epiviz.ui.charts.markers.MeasurementAggregators = {
  'mean-stdev': new epiviz.ui.charts.markers.MeasurementAggregator('mean-stdev', function(label, measurements, values) {
    if (!values || values.length == 0) { return null; }
    var mean = values.reduce(function(v1, v2) { return v1 + v2; }) / values.length;
    var variance = values
        .map(function(v) { return (v - mean) * (v - mean); })
        .reduce(function(v1, v2) { return v1 + v2; }) / values.length;
    var stdev = Math.sqrt(variance);
    return { value: mean, errMinus: mean - stdev, errPlus: mean + stdev };
  }),

  'quartiles': new epiviz.ui.charts.markers.MeasurementAggregator('quartiles', function(label, measurements, values) {
    if (!values || values.length == 0) { return null; }
    values = values.slice(0).sort(function(v1, v2) { return v1 - v2; });
    var n = values.length;
    var m1 = Math.floor(n * 0.5);
    var m2 = Math.ceil(n * 0.5);
    var q2 = (values[Math.floor((n - 1) * 0.5)] + values[m1]) * 0.5;
    var q1 = (values[Math.floor((m1 - 1) * 0.5)] + values[Math.floor(m1 * 0.5)]) * 0.5;
    var q3 = (values[m2 + Math.floor((n - m2 - 1) * 0.5)] + values[m2 + Math.floor((n - m2) * 0.5)]) * 0.5;

    return { value: q2, errMinus: q1, errPlus: q3 };
  }),

  'count': new epiviz.ui.charts.markers.MeasurementAggregator('count', function(label, measurements, values) {
    if (!values || values.length == 0) { return 0; }
    return { value: values.length };
  }),

  'min': new epiviz.ui.charts.markers.MeasurementAggregator('min', function(label, measurements, values) {
    if (!values || values.length == 0) { return null; }
    return { value: Math.min.apply(undefined, values) };
  }),

  'max': new epiviz.ui.charts.markers.MeasurementAggregator('max', function(label, measurements, values) {
    if (!values || values.length == 0) { return null; }
    return { value: Math.max.apply(undefined, values) };
  }),

  'sum': new epiviz.ui.charts.markers.MeasurementAggregator('sum', function(label, measurements, values) {
    if (!values || values.length == 0) { return null; }
    return { value: values.reduce(function(v1, v2) { return v1 + v2; }) };
  })
};
