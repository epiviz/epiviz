/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/10/2015
 * Time: 10:19 AM
 */

goog.provide('epiviz.ui.charts.markers.VisualizationMarker');

/**
 * @param {epiviz.ui.charts.markers.VisualizationMarker.Type} type
 * @param {string} [id]
 * @param {string} [name]
 * @param {string} [preMark]
 * @param {string} [mark]
 * @constructor
 * @template Data, InitialVars, Item, MarkResult
 */
epiviz.ui.charts.markers.VisualizationMarker = function(type, id, name, preMark, mark) {

  /**
   * @type {epiviz.ui.charts.markers.VisualizationMarker.Type}
   * @private
   */
  this._type = type;

  /**
   * @type {string}
   * @protected
   */
  this._id = id || epiviz.utils.generatePseudoGUID(6);

  /**
   * @type {string}
   * @protected
   */
  this._name = name || 'Custom Marker ' + this._id;

  /**
   * @type {string}
   * @private
   */
  this._preMarkStr = preMark || '';

  /**
   * @type {string}
   * @private
   */
  this._markStr = mark || '';

  var deferredPreMark = new epiviz.deferred.Deferred();
  var cajoledPreMark = null;
  epiviz.caja.cajole(this._preMarkStr).done(function(preMarkFunc) {
    cajoledPreMark = preMarkFunc;
    deferredPreMark.resolve();
  });

  /**
   * @type {function(Data): epiviz.deferred.Deferred.<InitialVars>}
   * @private
   */
  this._preMark = function(data) {
    var d = new epiviz.deferred.Deferred();
    deferredPreMark.done(function(){
      var initialVars = cajoledPreMark(data);
      d.resolve(initialVars);
    });
    return d;
  };

  var deferredMark = new epiviz.deferred.Deferred();
  var cajoledMark = null;
  epiviz.caja.cajole(this._markStr).done(function(markFunc) {
    cajoledMark = markFunc;
    deferredMark.resolve();
  });

  /**
   * @type {function(Item, Data, InitialVars): epiviz.deferred.Deferred.<MarkResult>}
   * @private
   */
  this._mark = function(item, data, preMarkResult) {
    var d = new epiviz.deferred.Deferred();
    deferredMark.done(function() {
      var markResult = cajoledMark(item, data, preMarkResult);
      d.resolve(markResult);
    });
    return d;
  };
};

/**
 * @returns {epiviz.ui.charts.markers.VisualizationMarker.Type}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.type = function() { return this._type; };

/**
 * @returns {string}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.id = function() { return this._id; };

/**
 * @returns {string}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.name = function() { return this._name; };

/**
 * @returns {function(Data, function(InitialVars))}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.preMark = function() { return this._preMark; };

/**
 * @returns {function(Item, Data, InitialVars, function(MarkResult))}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.mark = function() { return this._mark; };

/**
 * @returns {string}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.preMarkStr = function() { return this._preMarkStr; };

/**
 * @returns {string}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.markStr = function() { return this._markStr; };

/**
 * @enum {string}
 */
epiviz.ui.charts.markers.VisualizationMarker.Type = {
  FILTER: 'filter',
  COLOR_BY_ROW: 'colorByRow',
  ORDER_BY_MEASUREMENTS: 'orderByMeasurements',
  COLOR_BY_MEASUREMENTS: 'colorByMeasurements',
  GROUP_BY_MEASUREMENTS: 'groupByMeasurements'
};

/**
 * @returns {{type: string, id: string, name: string, preMark: string, mark: string}}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.raw = function() {
  return {
    type: this._type,
    id: this._id,
    name: this._name,
    preMark: this._preMarkStr,
    mark: this._markStr
  };
};

/**
 * @param {{type: string, id: string, name: string, preMark: string, mark: string}} o
 * @returns {epiviz.ui.charts.markers.VisualizationMarker}
 */
epiviz.ui.charts.markers.VisualizationMarker.fromRawObject = function(o) {
  return new epiviz.ui.charts.markers.VisualizationMarker(o.type, o.id, o.name, o.preMark, o.mark);
};
