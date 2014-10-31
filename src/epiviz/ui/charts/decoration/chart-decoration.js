/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:11 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartDecoration');

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @param {epiviz.ui.charts.decoration.ChartDecoration} [otherDecoration]
 * @constructor
 */
epiviz.ui.charts.decoration.ChartDecoration = function(chart, otherDecoration) {
  /**
   * @type {epiviz.ui.charts.Chart}
   * @private
   */
  this._chart = chart;

  /**
   * @type {epiviz.ui.charts.decoration.ChartDecoration}
   * @private
   */
  this._otherDecoration = otherDecoration;
};

/**
 */
epiviz.ui.charts.decoration.ChartDecoration.prototype.decorate = function() {
  if (this._otherDecoration) { this._otherDecoration.decorate(); }
};

/**
 * @returns {epiviz.ui.charts.Chart}
 */
epiviz.ui.charts.decoration.ChartDecoration.prototype.chart = function() { return this._chart; };

/**
 * @returns {epiviz.ui.charts.decoration.ChartDecoration}
 */
epiviz.ui.charts.decoration.ChartDecoration.prototype.otherDecoration = function() { return this._otherDecoration; };
