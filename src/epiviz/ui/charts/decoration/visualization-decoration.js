/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:11 PM
 */

goog.provide('epiviz.ui.charts.decoration.VisualizationDecoration');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @constructor
 */
epiviz.ui.charts.decoration.VisualizationDecoration = function(visualization, otherDecoration, config) {
  /**
   * @type {epiviz.ui.charts.Visualization}
   * @private
   */
  this._visualization = visualization;

  /**
   * @type {epiviz.ui.charts.decoration.VisualizationDecoration}
   * @private
   */
  this._otherDecoration = otherDecoration;

  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;
};

/**
 */
epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate = function() {
  if (this._otherDecoration) { this._otherDecoration.decorate(); }
};

/**
 * @returns {epiviz.ui.charts.Visualization}
 */
epiviz.ui.charts.decoration.VisualizationDecoration.prototype.visualization = function() { return this._visualization; };

/**
 * @returns {epiviz.ui.charts.decoration.VisualizationDecoration}
 */
epiviz.ui.charts.decoration.VisualizationDecoration.prototype.otherDecoration = function() { return this._otherDecoration; };

/**
 * @returns {epiviz.Config}
 */
epiviz.ui.charts.decoration.VisualizationDecoration.prototype.config = function() { return this._config; };
