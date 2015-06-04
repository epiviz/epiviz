/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:31 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartOptionButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartOptionButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.VisualizationDecoration.call(this, visualization, otherDecoration, config);

  /**
   * @type {boolean}
   */
  this.isChartOptionButton = true;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartOptionButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.decoration.ChartOptionButton.constructor = epiviz.ui.charts.decoration.ChartOptionButton;

/**
 */
epiviz.ui.charts.decoration.ChartOptionButton.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  if (!this.isChartOptionButton) { return; }

  var buttonIndex = 0;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.isChartOptionButton) { ++buttonIndex; }
  }

  var button = $(sprintf('<button style="position: absolute; top: 5px; right: %spx">%s</button>',
    5 + buttonIndex * 30,
    this._text()))
    .appendTo(this.visualization().container())
    .button(this._renderOptions())
    .click(this._click());

  this.visualization().container()
    .mousemove(function () { button.show(); })
    .mouseleave(function () { button.hide(); });
};

/**
 * @returns {Function}
 * @protected
 */
epiviz.ui.charts.decoration.ChartOptionButton.prototype._click = function() { return function() {}; };

/**
 * @returns {*} jQuery button render options
 * @protected
 */
epiviz.ui.charts.decoration.ChartOptionButton.prototype._renderOptions = function() { return {}; };

/**
 * @returns {string}
 * @protected
 */
epiviz.ui.charts.decoration.ChartOptionButton.prototype._text = function() { return ''; };
