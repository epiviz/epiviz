/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/8/13
 * Time: 12:37 PM
 * To change this template use File | Settings | File Templates.
 */

function ChartFactory() {
  this._chartTypes = {};
  this._chartHandlers = [];
  this._chartHandlerIndices = {};

  this._dataTypes = {};
  this._dataTypeHandlers = [];
  this._dataTypeHandlerIndices = {};
}

ChartFactory.instance = new ChartFactory();

ChartFactory.prototype.registerChartType = function(chartHandler) {
  var chartType = chartHandler.getChartType();
  if (!this._chartTypes[chartType]) {
    this._chartTypes[chartHandler.getChartType()] = chartHandler;
    this._chartHandlerIndices[chartType] = this._chartHandlers.length;
    this._chartHandlers.push(chartHandler);
  }
};

ChartFactory.prototype.unregisterChartType = function(chartHandler) {
  var chartType = chartHandler.getChartType();

  if (!this._chartTypes[chartType]) {
    return;
  }

  delete this._chartTypes[chartType];

  for (var i = this._chartHandlerIndices[chartType]; i < this._chartHandlers.length-1; ++i) {
    this._chartHandlers[i] = this._chartHandlers[i+1];
    this._chartHandlerIndices[this._chartHandlers[i]] = i;
  }
  delete this._chartHandlerIndices[this._chartHandlers.length-1];
  this._chartHandlers.splice(this._chartHandlers.length-1, 1);
};

ChartFactory.prototype.getChartHandlerByChartType = function(chartType) {
  return this._chartTypes[chartType];
};

ChartFactory.foreachChartTypeHandler = function(iterationCallback) {
  var chartTypeHandlers = ChartFactory.instance._chartHandlers;
  for (var i = 0; i < chartTypeHandlers.length; ++i) {
    var breakIteration = { set: false };
    iterationCallback(chartTypeHandlers[i], breakIteration);
    if (breakIteration.set) { break; }
  }
};


ChartFactory.prototype.registerDataType = function(dataTypeHandler) {
  var dataType = dataTypeHandler.getDataType();
  if (!this._dataTypes[dataType]) {
    this._dataTypes[dataType] = dataTypeHandler;
    this._dataTypeHandlerIndices[dataType] = this._dataTypeHandlers.length;
    this._dataTypeHandlers.push(dataTypeHandler);
  }
};

ChartFactory.prototype.unregisterDataType = function(dataTypeHandler) {
  // TODO: Not yet implemented
};

ChartFactory.foreachDataTypeHandler = function(iterationCallback) {
  var dataTypeHandlers = ChartFactory.instance._dataTypeHandlers;
  for (var i = 0; i < dataTypeHandlers.length; ++i) {
    var breakIteration = { set: false };
    iterationCallback(dataTypeHandlers[i], breakIteration);
    if (breakIteration.set) { break; }
  }
};
