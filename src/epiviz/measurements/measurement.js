/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 6:47 PM
 */

goog.provide('epiviz.measurements.Measurement');
goog.provide('epiviz.measurements.Measurement.Type');

/**
 * @param {string} id
 * @param {string} name
 * @param {epiviz.measurements.Measurement.Type} type
 * @param {string} datasourceId
 * @param {string} datasourceGroup
 * @param {string} dataprovider
 * @param {{referredMeasurements: Object.<number, epiviz.measurements.Measurement>, expression: epiviz.utils.ExpressionParser.Expression}} [formula]
 * @param {string} [defaultChartType]
 * @param {Object.<string, string>} [annotation]
 * @param {number} [minValue]
 * @param {number} [maxValue]
 * @param {Array.<string>} [metadata]
 * @constructor
 */
epiviz.measurements.Measurement = function(id, name, type, datasourceId, datasourceGroup,
                                           dataprovider, formula, defaultChartType, annotation,
                                           minValue, maxValue, metadata) {

  var MeasurementType = epiviz.measurements.Measurement.Type;

  /**
   * @type {string}
   * @private
   */
  this._id = id;

  /**
   * @type {string}
   * @private
   */
  this._name = name;

  /**
   * @type {epiviz.measurements.Measurement.Type}
   * @private
   */
  this._type = type;

  /**
   * @type {epiviz.measurements.Measurement}
   * @private
   */
  this._datasource = type == (MeasurementType.RANGE) ? this :
    new epiviz.measurements.Measurement(
      datasourceId, // id
      datasourceId, // name
      MeasurementType.RANGE, // type
      datasourceId, // datasource
      datasourceGroup, // datasourceGroup
      dataprovider, // dataprovider
      null, // formula
      'Blocks Track', // defaultChartType
      null, null, null, // annotation, minValue, maxValue
      metadata); // metadata

  /**
   * @type {string}
   * @private
   */
  this._datasourceGroup = datasourceGroup;

  /**
   * @type {string}
   * @private
   */
  this._dataprovider = dataprovider;

  /**
   * @type {?{referredMeasurements: Object.<number, epiviz.measurements.Measurement>, expression: epiviz.utils.ExpressionParser.Expression}}
   * @private
   */
  this._formula = formula || null;

  /**
   * @type {?string}
   * @private
   */
  this._defaultChartType = defaultChartType || null;

  /**
   * @type {?Object.<string, string>}
   * @private
   */
  this._annotation = annotation || null;

  /**
   * @type {?number}
   * @private
   */
  this._minValue = (minValue || minValue === 0) ? minValue : null;

  /**
   * @type {?number}
   * @private
   */
  this._maxValue = (maxValue || maxValue === 0) ? maxValue : null;

  /**
   * @type {?Array.<string>}
   * @private
   */
  this._metadata = metadata || null;
};

/**
 * @enum {string}
 */
epiviz.measurements.Measurement.Type = {
  FEATURE: 'feature',
  RANGE: 'range'
};

/**
 * @returns {string}
 */
epiviz.measurements.Measurement.prototype.id = function() {
  return this._id;
};

/**
 * @returns {string}
 */
epiviz.measurements.Measurement.prototype.name = function() {
  return this._name;
};

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */
epiviz.measurements.Measurement.prototype.type = function() {
  return this._type;
};

/**
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.measurements.Measurement.prototype.datasource = function() {
  return this._datasource;
};

/**
 * @returns {string}
 */
epiviz.measurements.Measurement.prototype.datasourceId = function() {
  return this._datasource.id();
};

/**
 * @returns {string}
 */
epiviz.measurements.Measurement.prototype.datasourceGroup = function() {
  return this._datasourceGroup;
};

/**
 * @returns {string}
 */
epiviz.measurements.Measurement.prototype.dataprovider = function() {
  return this._dataprovider;
};

/**
 * @returns {?{referredMeasurements: Object.<number, epiviz.measurements.Measurement>, expression: epiviz.utils.ExpressionParser.Expression}}
 */
epiviz.measurements.Measurement.prototype.formula = function() {
  return this._formula;
};

/**
 * @returns {string}
 */
epiviz.measurements.Measurement.prototype.formulaStr = function() {
  if (!this._formula) { return ''; }
  var referredMs = this._formula.referredMeasurements;
  var expression = this._formula.expression.toString();

  for (var formulaIndex in referredMs) {
    if (!referredMs.hasOwnProperty(formulaIndex)) { continue; }

    expression = expression.replace(
      new RegExp('\\{' + formulaIndex + '\\}', 'g'),
      ' {' + referredMs[formulaIndex].name()  + '} ');
  }

  return expression;
};

/**
 * @param {epiviz.measurements.MeasurementHashtable.<number>} values A map between
 *   each of the component measurements and their corresponding values. See
 *   epiviz.measurements.Measurement.prototype.componentMeasurements() for more.
 */
epiviz.measurements.Measurement.prototype.evaluate = function(values) {
  var tuple = {};
  for (var i in this._formula.referredMeasurements) {
    if (!this._formula.referredMeasurements.hasOwnProperty(i)) { continue; }

    var m = this._formula.referredMeasurements[i];
    tuple['{' + i + '}'] = m.isComputed() ?
      m.evaluate(values) : values.get(m);
  }

  return this._formula.expression.evaluate(tuple);
};

/*
 *@param {epiviz.measurements.MeasurementHashtable.<Array.<number>>} values A map between
 *   each of the component measurements and an array of their corresponding values. See
 *   epiviz.measurements.Measurement.prototype.componentMeasurements() for more.
 */
epiviz.measurements.Measurement.prototype.evaluateArr = function(values) {
  /** @type {Object.<string, Array.<number>>} */
  var tuple = {};
  for (var i in this._formula.referredMeasurements) {
    if (!this._formula.referredMeasurements.hasOwnProperty(i)) { continue; }

    var m = this._formula.referredMeasurements[i];
    tuple['{' + i + '}'] = m.isComputed() ?
      m.evaluateArr(values) : values.get(m);
  }

  return this._formula.expression.evaluateArr(tuple);
};

/**
 * @returns {?string}
 */
epiviz.measurements.Measurement.prototype.defaultChartType = function() {
  return this._defaultChartType;
};

/**
 * @returns {?Object.<string, string>}
 */
epiviz.measurements.Measurement.prototype.annotation = function() {
  return this._annotation;
};

/**
 * @returns {?number}
 */
epiviz.measurements.Measurement.prototype.minValue = function() {
  return this._minValue;
};

/**
 * @returns {?number}
 */
epiviz.measurements.Measurement.prototype.maxValue = function() {
  return this._maxValue;
};

/**
 * @returns {Array.<string>}
 */
epiviz.measurements.Measurement.prototype.metadata = function() {
  return this._metadata;
};

/**
 * Gets a set of all independent measurements needed to compute this measurement. If the measurement is independent,
 * then the returned set contains this measurement only.
 *
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.measurements.Measurement.prototype.componentMeasurements = function() {
  var result = new epiviz.measurements.MeasurementSet();

  if (!this._formula) {
    result.add(this);
    return result;
  }

  for (var i in this._formula.referredMeasurements) {
    if (!this._formula.referredMeasurements.hasOwnProperty(i)) { continue; }

    result.addAll(this._formula.referredMeasurements[i].componentMeasurements());
  }

  return result;
};

/**
 * @returns {boolean}
 */
epiviz.measurements.Measurement.prototype.isComputed = function() { return (this._formula) ? true : false; };

/**
 *
 * @param {epiviz.measurements.MeasurementHashtable.<number>} measurementsIndexMap
 * @returns {{id: string, name: string, type: epiviz.measurements.Measurement.Type, datasourceId: string, datasourceGroup: string, dataprovider: string, formula: {expression: (string), referredMeasurements: Object.<number, number>}, defaultChartType: ?string, annotation: ?Object.<string, string>, minValue: ?number, maxValue: ?number, metadata: ?Array.<string>}}
 */
epiviz.measurements.Measurement.prototype.raw = function(measurementsIndexMap) {

  if (this._formula) {
    /** @type {Object.<number, epiviz.measurements.Measurement>} */
    var referredMeasurements = this._formula.referredMeasurements;

    /** @type {Object.<number, number>} */
    var rawReferredMeasurements = {};

    for (var formulaIndex in referredMeasurements) {
      if (!referredMeasurements.hasOwnProperty(formulaIndex)) { continue; }

      rawReferredMeasurements[formulaIndex] = measurementsIndexMap.get(referredMeasurements[formulaIndex]);
    }
  }

  return {
    id: this._id,
    name: this._name,
    type: this._type,
    datasourceId: this._datasource._id,
    datasourceGroup: this._datasourceGroup,
    dataprovider: this._dataprovider,
    formula: this._formula ?
      {expression: this._formula.expression.toString(), referredMeasurements: rawReferredMeasurements} :
      null,
    defaultChartType: this._defaultChartType,
    annotation: this._annotation,
    minValue: this._minValue,
    maxValue: this._maxValue,
    metadata: this._metadata
  };
};

/**
 * @returns {string}
 */
epiviz.measurements.Measurement.prototype.toString = function() {
  return this.name();
};

/**
 * @param {{
 *   id: string,
 *   name: string,
 *   type: string,
 *   datasourceId: string,
 *   datasourceGroup: string,
 *   dataprovider: string,
 *   formula: ?{expression: string, referredMeasurements: Object.<number, number>},
 *   defaultChartType: ?string,
 *   annotation: ?Object.<string, string>,
 *   minValue: ?number,
 *   maxValue: ?number,
 *   metadata: ?Array.<string>}} o
 * @param {Array.<epiviz.measurements.Measurement>} [measurements] This argument is used in conjunction
 *   with o.formula. If that is null, then this parameter is ignored.
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.measurements.Measurement.fromRawObject = function(o, measurements) {
  var formula = null;
  if (o.formula) {
    var expr = epiviz.utils.ExpressionParser.parse(o.formula.expression);
    var refMs = {};

    var vars = expr.variables();
    for (var i = 0; i < vars.length; ++i) {
      if (!epiviz.utils.stringStartsWith(vars[i], '{') || !epiviz.utils.stringEndsWith(vars[i], '}')) {
        // This means that the variable is something else than a measurement
        continue;
      }
      var formulaIndex = parseInt(vars[i].substring(1, vars[i].length - 1));
      var index = o.formula.referredMeasurements[formulaIndex];
      refMs[formulaIndex] = measurements[index];
    }
    formula = {expression: expr, referredMeasurements: refMs};
  }

  return new epiviz.measurements.Measurement(o.id, o.name, o.type, o.datasourceId, o.datasourceGroup, o.dataprovider,
    formula, o.defaultChartType, o.annotation, o.minValue, o.maxValue, o.metadata);
};
