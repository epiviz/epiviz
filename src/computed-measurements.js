/**
 * Created by: Florin Chelaru
 * Date: 5/28/13
 * Time: 12:03 PM
 */

function ComputedMeasurements() {
  this._measurements = {};
  this._count = 0;
  this._workspaceMeasurements = {};
}

ComputedMeasurements.instance = new ComputedMeasurements();

ComputedMeasurements.prototype.add = function(measurementsType, key, name, expression, min, max) {

  if (!key || key.trim() == '') {
    throw 'Invalid value for key';
  }

  if (!name || name.trim() == '') {
    name = key;
  }

  if (!expression || expression.trim() == '') {
    throw 'Invalid expression';
  }

  var minf = parseFloat(min);

  if (isNaN(minf)) {
    throw 'Invalid value for min';
  }

  var maxf = parseFloat(max);

  if (isNaN(maxf)) {
    throw 'Invalid value for max';
  }

  var expr = Parser.parse(expression); // If something goes wrong, this throws an exception.

  var measurements = {};
  measurements[measurementsType] = {};
  measurements[measurementsType][key] = name;

  if (!this._measurements[key]) { ++this._count; }

  this._measurements[key] = {
    expr: expr,
    min: minf,
    max: maxf,
    measurementsType: measurementsType,
    name: name,
    measurementsMap: measurements
  };

  this._workspaceMeasurements[key] = [measurementsType, key, name, expression, min, max];

  DataManager.instance.addMeasurements('computedData', measurements);
};

ComputedMeasurements.prototype.remove = function(key) {
  if (!this._measurements[key]) { return; }

  DataManager.instance.removeMeasurements('computedData', this._measurements[key].measurementsMap);
  delete this._measurements[key];
  delete this._workspaceMeasurements[key];

  --this._count;
};

ComputedMeasurements.prototype.clear = function() {
  if (this._count == 0) { return; }

  var keys = [];
  for (var key in this._measurements) {
    keys.push(key);
  }

  for (var i = 0; i < keys.length; ++i) {
    this.remove(keys[i]);
  }
};

ComputedMeasurements.prototype.contains = function(key) {
  if (this._measurements[key]) { return true; }

  return false;
};

ComputedMeasurements.prototype.get = function(key) {
  return this._measurements[key];
};

ComputedMeasurements.prototype.getAllWorkspaceData = function() {
  var result = [];

  if (this._count == 0) { return result; }

  for (var key in this._workspaceMeasurements) {
    result.push(this._workspaceMeasurements[key]);
  }

  return result;
};

ComputedMeasurements.prototype.compute = function(key, variableMap) {
  return this._measurements[key].expr.evaluate(variableMap);
};

ComputedMeasurements.prototype.evaluate = function(dataTable, measurement, index, indexer) {
  if (dataTable[measurement]) {
    return indexer(dataTable[measurement], index);
  }

  var expr = this._measurements[measurement].expr;
  var vars = expr.variables();

  var vals = {};
  for (var i = 0; i < vars.length; ++i) {
    vals[vars[i]] = this.evaluate(dataTable, vars[i], index, indexer);
  }

  return expr.evaluate(vals);
};

ComputedMeasurements.prototype.getVariables = function(key) {
  return this._measurements[key].expr.variables();
};

ComputedMeasurements.prototype.getNonComputedVariables = function(key) {
  if (!this._measurements[key]) { return [key]; }

  var vs = this.getVariables(key);

  for (var i = 0; i < vs.length; ++i) {
    if (this._measurements[vs[i]]) {
      var nonCompVars = this.getNonComputedVariables(vs[i]);
      vs.splice.apply(vs, [i, 1].concat(nonCompVars));
      i += nonCompVars.length - 1;
    }
  }

  return vs;
};

ComputedMeasurements.prototype.getDependentMeasurements = function(measurement) {
  if (this._count == 0) { return []; }

  var result = [];
  for (var key in this._measurements) {
    var vs = this.getVariables(key);

    if (vs.indexOf(measurement) >= 0) {
      result.push(key);
    }
  }

  return result;
};

ComputedMeasurements.prototype.min = function(mins, measurement) {
  if (mins[measurement] !== undefined) {
    return mins[measurement];
  }

  return this._measurements[measurement].min;
};

ComputedMeasurements.prototype.max = function(maxs, measurement) {
  if (maxs[measurement] !== undefined) {
    return maxs[measurement];
  }

  return this._measurements[measurement].max;
};
