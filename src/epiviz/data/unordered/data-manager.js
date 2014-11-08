/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/31/2014
 * Time: 3:36 PM
 */

/**
 * @param {epiviz.Config} config
 * @param {epiviz.data.DataProviderFactory} dataProviderFactory
 * @constructor
 */
epiviz.data.unordered.DataManager = function(config, dataProviderFactory) {
  this._dataAggregator = new epiviz.data.unordered.DataAggregator(config, dataProviderFactory);
};

/**
 * @param {function(epiviz.measurements.MeasurementSet)} callback
 */
epiviz.data.unordered.DataManager.prototype.getMeasurements = function(callback) {

};

/**
 * @param {Object.<string, epiviz.measurements.MeasurementSet>} chartMeasurementsMap
 * @param {function(string, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>)} dataReadyCallback
 */
epiviz.data.unordered.DataManager.prototype.getData = function(chartMeasurementsMap, dataReadyCallback) {
  this._dataAggregator.getData(chartMeasurementsMap, dataReadyCallback);
};
