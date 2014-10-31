/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:31 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartOptionButton');

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @param {epiviz.ui.charts.decoration.ChartDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartOptionButton = function(chart, otherDecoration) {
  epiviz.ui.charts.decoration.ChartDecoration.call(this, chart, otherDecoration);

  /**
   * @type {boolean}
   * @const
   */
  this.isChartOptionButton = true;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartOptionButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartDecoration.prototype);
epiviz.ui.charts.decoration.ChartOptionButton.constructor = epiviz.ui.charts.decoration.ChartOptionButton;

/**
 */
epiviz.ui.charts.decoration.ChartOptionButton.prototype.decorate = function() {
  epiviz.ui.charts.decoration.ChartDecoration.prototype.decorate.call(this);

  var buttonIndex = 0;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.isChartOptionButton) { ++buttonIndex; }
  }

  var button = $(sprintf('<button style="position: absolute; top: 5px; right: %spx">%s</button>',
    5 + buttonIndex * 30,
    this._text()))
    .appendTo(this.chart().container())
    .button(this._renderOptions())
    .click(this._click());

  this.chart().container()
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
