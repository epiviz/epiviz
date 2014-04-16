/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/13
 * Time: 3:45 PM
 */

goog.provide('epiviz.measurements.MeasurementHashtable');

/**
 * @constructor
 * @implements {epiviz.utils.Iterable}
 * @template T
 */
epiviz.measurements.MeasurementHashtable = function() {
  /**
   * @type {number}
   * @private
   */
  this._size = 0;

  /**
   * A map containing measurement values in a tree structure, by the following levels:
   *   dataprovider, type, datasourceGroup, datasource, id
   * @type {Object.<string, Object.<string, Object.<string, Object.<string, Object.<string, {key: epiviz.measurements.Measurement, value: T, index: number}>>>>>}
   * @private
   */
  this._measurementTree = {};

  /**
   * @type {Array.<{key: epiviz.measurements.Measurement, value: T, contained: boolean}>}
   * @private
   */
  this._order = [];
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @param {T} value
 */
epiviz.measurements.MeasurementHashtable.prototype.put = function(m, value) {
  if (this.contains(m)) {
    var existingItem = this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()];
    this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()] = {key: m, value: value, index: existingItem.index};
    this._order[existingItem.index] = {key: m, value: value, contained: true};
    return;
  }

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

  this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()] = {key: m, value: value, index: this._order.length};
  this._order.push({key: m, value: value, contained: true});

  ++this._size;
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {?T}
 */
epiviz.measurements.MeasurementHashtable.prototype.get = function(m) {
  if (!this.contains(m)) { return null; }

  return this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()].value;
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {boolean} true if the measurement was in the data structure and was removed
 *   and false if the measurement was not in the collection
 */
epiviz.measurements.MeasurementHashtable.prototype.remove = function(m) {
  if (!this.contains(m)) {
    return false;
  }

  var item = this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()];
  delete this._measurementTree[m.dataprovider()][m.type()][m.datasourceGroup()][m.datasource().id()][m.id()];
  this._order[item.index].contained = false;
  --this._size;
  return true;
};

/**
 * @param {epiviz.measurements.Measurement} m
 * @returns {boolean}
 */
epiviz.measurements.MeasurementHashtable.prototype.contains = function(m) {
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
 */
epiviz.measurements.MeasurementHashtable.prototype.clear = function() {
  this._size = 0;
  this._measurementTree = {};
  this._order = [];
};

/**
 * @returns {boolean}
 */
epiviz.measurements.MeasurementHashtable.prototype.isEmpty = function() {
  return this._size == 0;
};

/**
 * returns {number}
 */
epiviz.measurements.MeasurementHashtable.prototype.size = function() {
  return this._size;
};

/**
 * Iterates through all pairs in the map, or until the given function returns something that
 * evaluates to true.
 * @param {function(epiviz.measurements.Measurement, T, number=)} func
 * @param {function(epiviz.measurements.Measurement):boolean} [predicate]
 */
epiviz.measurements.MeasurementHashtable.prototype.foreach = function(func, predicate) {
  var iter = this.iterator();
  for (var pair = iter.first(), i = 0; pair !== null; pair = iter.next(), ++i) {
    if (predicate && !predicate(pair.key)) { continue; }
    if (func(pair.key, pair.value, i)) { return; }
  }
};

/**
 * @returns {?{key: epiviz.measurements.Measurement, value: T}}
 */
epiviz.measurements.MeasurementHashtable.prototype.first = function() {
  return this.iterator().first();
};

/**
 * @returns {epiviz.utils.Iterator.<{key: epiviz.measurements.Measurement, value: T}>}
 */
epiviz.measurements.MeasurementHashtable.prototype.iterator = function() {
  return new epiviz.measurements.MeasurementHashtable.Iterator(this);
};

/**
 * @param {epiviz.measurements.MeasurementHashtable} measurementHashtable
 * @constructor
 * @implements {epiviz.utils.Iterator}
 */
epiviz.measurements.MeasurementHashtable.Iterator = function(measurementHashtable) {
  /**
   * @type {epiviz.measurements.MeasurementHashtable}
   * @private
   */
  this._parent = measurementHashtable;

  /**
   * @type {number}
   * @private
   */
  this._lastIndex = null;
};

/**
 * @returns {?{key: epiviz.measurements.Measurement, value: T}}
 */
epiviz.measurements.MeasurementHashtable.Iterator.prototype.first = function() {
  if (this._parent.size() == 0) {
    return null;
  }

  for (var i = 0; i < this._parent._order.length; ++i) {
    if (this._parent._order[i].contained) {
      this._lastIndex = i;
      return {key: this._parent._order[i].key, value: this._parent._order[i].value};
    }
  }

  // Should never be reached!
  throw Error('Inconsistent MeasurementHashtable with size() > 0 and no first element');
};

/**
 * @returns {?{key: epiviz.measurements.Measurement, value: T}}
 */
epiviz.measurements.MeasurementHashtable.Iterator.prototype.next = function() {
  if (this._lastIndex === null) {
    throw Error('Iterator.next() called before calling Iterator.first()');
  }

  for (var i = this._lastIndex + 1; i < this._parent._order.length; ++i) {
    if (this._parent._order[i].contained) {
      this._lastIndex = i;
      return {key: this._parent._order[i].key, value: this._parent._order[i].value};
    }
  }

  this._lastIndex = this._parent._order.length;
  return null;
};
