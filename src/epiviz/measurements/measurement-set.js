/**
 * Created by: Florin Chelaru
 * Date: 9/30/13
 * Time: 7:19 PM
 */

goog.provide('epiviz.measurements.MeasurementSet');

/**
 * A collection of measurements, where each item is stored only once,
 * and iteration is done in the insertion order.
 *
 * @param {epiviz.measurements.MeasurementSet} [other]
 * @constructor
 * @implements {epiviz.utils.Iterable}
 */
epiviz.measurements.MeasurementSet = function(other) {
  /**
   * A map containing measurements in a tree structure, by the following levels:
   *   dataprovider, type, datasourceGroup, datasource, id
   * @type {Object.<string, Object.<string, Object.<string, Object.<string, Object.<string, {measurement: epiviz.measurements.Measurement, index: number}>>>>>}
   * @private
   */
  this._measurementTree = {};

  /**
   * @type {number}
   * @private
   */
  this._size = 0;

  /**
   * @type {Array.<{measurement: epiviz.measurements.Measurement, contained: boolean}>}
   * @private
   */
  this._order = [];

  if (other) {
    this.addAll(other);
  }
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {boolean} true if the measurement was successfully added to the collection and
 *   false if there was already a measurement with this id in the collection
 */
epiviz.measurements.MeasurementSet.prototype.add = function(m) {
  if (!(m.dataprovider() in this._measurementTree)) {
    this._measurementTree[m.dataprovider()] = {};
  }

  if (!(m.type() in this._measurementTree[m.dataprovider()])) {
    this._measurementTree[m.dataprovider()][m.type()] = {};
  }

  if (!(m.datasourceGroup() in this._measurementTree[m.dataprovider()][m.type()])) {
    this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()] = {};
  }

  if (!(m.datasource().id() in this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()])) {
    this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()] = {};
  }

  if (m.id() in this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()]) {
    return false;
  }

  this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()] = {
    measurement: m,
    index: this._order.length
  };

  this._order.push({
    measurement: m,
    contained: true
  });

  ++this._size;

  return true;
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {boolean} true if the measurement was in the collection and
 *   false if there was no measurement with this id in the collection
 */
epiviz.measurements.MeasurementSet.prototype.remove = function(m) {
  if (!(m.dataprovider() in this._measurementTree)) {
    return false;
  }

  if (!(m.type() in this._measurementTree[m.dataprovider()])) {
    return false;
  }

  if (!(m.datasourceGroup() in this._measurementTree[m.dataprovider()][m.type()])) {
    return false;
  }

  if (!(m.datasource().id() in this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()])) {
    return false;
  }

  if (!(m.id() in this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()])) {
    return false;
  }

  this._order[this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()].index].contained = false;

  delete this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()];
  --this._size;
  return true;
};

/**
 * Returns true if any new measurements were added and false if
 * all measurements were already in the collection.
 * @param {?epiviz.measurements.MeasurementSet} measurements
 * @returns {boolean}
 */
epiviz.measurements.MeasurementSet.prototype.addAll = function(measurements) {
  if (!measurements || !measurements.size()) { return false; }
  var newMeasurementsAdded = false;
  var self = this;
  measurements.foreach(
    /**
     * @param {epiviz.measurements.Measurement} m
     * @returns {boolean}
     */
    function(m) {
      if (self.add(m)) {
        newMeasurementsAdded = true;
      }
      return false;
    });

  return newMeasurementsAdded;
};

/**
 * @param {epiviz.measurements.MeasurementSet} measurements
 * @returns {boolean}
 */
epiviz.measurements.MeasurementSet.prototype.removeAll = function(measurements) {
  var someMeasurementsRemoved = false;
  var self = this;
  measurements.foreach(
    /**
     * @param {epiviz.measurements.Measurement} m
     * @returns {boolean}
     */
    function(m) {
      if (self.remove(m)) {
        someMeasurementsRemoved = true;
      }
      return false;
    });

  return someMeasurementsRemoved;
};

/**
 * Iterates through all items stored in this collection, in the order they were added.
 *
 * @param {function(epiviz.measurements.Measurement, number=)} func A function called
 *   for each measurement matching the given filters. Iteration
 *   is stopped if the function returns something that evaluates to true.
 * @param {function(epiviz.measurements.Measurement): boolean} [predicate]
 */
epiviz.measurements.MeasurementSet.prototype.foreach = function(func, predicate) {
  var iter = this.iterator();
  for (var m = iter.first(), i = 0; m !== null; m = iter.next(), ++i) {
    if (predicate && !predicate(m)) { continue; }
    if (func(m, i)) { return; }
  }
};

/**
 * @returns {epiviz.utils.Iterator.<epiviz.measurements.Measurement>}
 */
epiviz.measurements.MeasurementSet.prototype.iterator = function() {
  return new epiviz.measurements.MeasurementSet.Iterator(this);
};

/**
 * @param {function(epiviz.measurements.Measurement): boolean} [predicate]
 *
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.measurements.MeasurementSet.prototype.subset = function(predicate) {
  var measurements = new epiviz.measurements.MeasurementSet();
  this.foreach(function(m) { measurements.add(m); }, predicate);

  return measurements;
};

/**
 * @param {function(epiviz.measurements.Measurement): epiviz.measurements.Measurement} transformer
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.measurements.MeasurementSet.prototype.map = function(transformer) {
  var ret = new epiviz.measurements.MeasurementSet();
  this.foreach(function(m) {
    ret.add(transformer(m));
  });
  return ret;
};

/**
 * @returns {number}
 */
epiviz.measurements.MeasurementSet.prototype.size = function() { return this._size; };

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {boolean}
 */
epiviz.measurements.MeasurementSet.prototype.contains = function(m) {
  if (!(m.dataprovider() in this._measurementTree)) {
    return false;
  }

  if (!(m.type() in this._measurementTree[m.dataprovider()])) {
    return false;
  }

  if (!(m.datasourceGroup() in this._measurementTree[m.dataprovider()][m.type()])) {
    return false;
  }

  if (!(m.datasource().id() in this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()])) {
    return false;
  }

  return (m.id() in this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()]);
};

/**
 * @returns {?epiviz.measurements.Measurement}
 */
epiviz.measurements.MeasurementSet.prototype.first = function() {
  return this.iterator().first();
};

/**
 * Gets measurement at the given index. This method performs in O(n) time, so
 * it's not appropriate for iteration.
 * @param index
 * @returns {epiviz.measurements.Measurement}
 */
epiviz.measurements.MeasurementSet.prototype.get = function(index) {
  if (index >= this._size || index < 0) { return null; }
  if (this._size == this._order.length) {
    return this._order[index].measurement;
  }

  var result = null;
  this.foreach(function(m, i) {
    if (i == index) {
      result = m;
      return true;
    }
    return false;
  });

  return result;
};

/**
 * @returns {Array.<epiviz.measurements.Measurement>}
 */
epiviz.measurements.MeasurementSet.prototype.toArray = function() {
  var result = new Array(this._size);
  this.foreach(function(m, i) {
    result[i] = m;
  });

  return result;
};

/**
 * @param {function(epiviz.measurements.Measurement, epiviz.measurements.Measurement): number} comparer
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviz.measurements.MeasurementSet.prototype.sorted = function(comparer) {
  /** @type {Array.<epiviz.measurements.Measurement>} */
  var msArr = this.toArray().sort(comparer);
  var ret = new epiviz.measurements.MeasurementSet();
  msArr.forEach(function(m) { ret.add(m); });
  return ret;
};

/**
 * @returns {Array.<{id: string, name: string, type: epiviz.measurements.Measurement.Type, datasourceId: string, datasourceGroup: string, dataprovider: string, formula: null, defaultChartType: ?string, annotation: ?Object.<string, string>, minValue: ?number, maxValue: ?number, metadata: ?Array.<string>}>}
 */
epiviz.measurements.MeasurementSet.prototype.raw = function() {
  var result = new Array(this._size);
  this.foreach(function(m, i) {
    result[i] = m.raw();
  });

  return result;
};

/**
 *
 * @param {epiviz.measurements.MeasurementSet} measurementSet
 * @constructor
 * @implements {epiviz.utils.Iterator}
 */
epiviz.measurements.MeasurementSet.Iterator = function(measurementSet) {
  /**
   * @type {epiviz.measurements.MeasurementSet}
   * @private
   */
  this._parent = measurementSet;

  /**
   * @type {number}
   * @private
   */
  this._lastIndex = null;
};

/**
 * @returns {?epiviz.measurements.Measurement}
 */
epiviz.measurements.MeasurementSet.Iterator.prototype.first = function() {
  if (this._parent.size() == 0) {
    return null;
  }

  for (var i = 0; i < this._parent._order.length; ++i) {
    if (this._parent._order[i].contained) {
      this._lastIndex = i;
      return this._parent._order[i].measurement;
    }
  }

  // Should never be reached!
  throw Error('Inconsistent MeasurementSet with size() > 0 and no first element');
};

/**
 * @returns {?epiviz.measurements.Measurement}
 */
epiviz.measurements.MeasurementSet.Iterator.prototype.next = function() {
  if (this._lastIndex === null) {
    throw Error('Iterator.next() called before calling Iterator.first()');
  }

  for (var i = this._lastIndex + 1; i < this._parent._order.length; ++i) {
    if (this._parent._order[i].contained) {
      this._lastIndex = i;
      return this._parent._order[i].measurement;
    }
  }

  this._lastIndex = this._parent._order.length;
  return null;
};
