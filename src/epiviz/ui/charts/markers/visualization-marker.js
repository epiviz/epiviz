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
 * @param {function(Data): InitialVars} [preMark]
 * @param {function(Item, Data, InitialVars): MarkResult} [mark]
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
   * @type {function(Data): InitialVars}
   * @protected
   */
  this._preMark = preMark || function() {};

  /**
   * @type {function(Item, Data, InitialVars): MarkResult}
   * @private
   */
  this._mark = mark || function() {};
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
 * @returns {function(Data): InitialVars}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.preMark = function() { return this._preMark; };

/**
 * @returns {function(Item, Data, InitialVars): MarkResult}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.mark = function() { return this._mark; };

/**
 * @enum {string}
 */
epiviz.ui.charts.markers.VisualizationMarker.Type = {
  FILTER: 'filter'
};

/**
 * @returns {{type: string, id: string, name: string, preMark: string, mark: string}}
 */
epiviz.ui.charts.markers.VisualizationMarker.prototype.raw = function() {
  return {
    type: this._type,
    id: this._id,
    name: this._name,
    preMark: this._preMark.toString(),
    mark: this._mark.toString()
  };
};

/**
 * @param {{type: string, id: string, name: string, preMark: string, mark: string}} o
 * @returns {epiviz.ui.charts.markers.VisualizationMarker}
 */
epiviz.ui.charts.markers.VisualizationMarker.fromRawObject = function(o) {
  return new epiviz.ui.charts.markers.VisualizationMarker(
    o.type,
    o.id,
    o.name,
    eval('(' + o.preMark + ')'),
    eval('(' + o.mark + ')'));
};
