/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/31/2014
 * Time: 1:04 PM
 */

goog.provide('epiviz.data.unordered.DataAggregator');

/**
 * TODO: This has the same role as epiviz.data.Cache, which is actually not only to cache data
 * TODO: but also to aggregate it from different data providers.
 * @param {epiviz.Config} config
 * @param {epiviz.data.DataProviderFactory} dataProviderFactory
 * @constructor
 */
epiviz.data.unordered.DataAggregator = function(config, dataProviderFactory) {
};

/**
 * TODO: This is just a temporary approach. In the future, we will have getRows(measurements) and getValues(measurements, rows)
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>)} dataReadyCallback
 */
epiviz.data.unordered.DataAggregator.prototype.getData = function(chartMeasurementsMap, dataReadyCallback) {

};
