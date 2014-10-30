/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:24 PM
 */

goog.provide('epiviz.ui.charts.decoration.RemoveChartButton');

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @param {epiviz.ui.charts.decoration.ChartDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartOptionButton}
 * @constructor
 */
epiviz.ui.charts.decoration.RemoveChartButton = function(chart, otherDecoration) {
  epiviz.ui.charts.decoration.ChartOptionButton.call(this, chart, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.RemoveChartButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartOptionButton.prototype);
epiviz.ui.charts.decoration.RemoveChartButton.constructor = epiviz.ui.charts.decoration.RemoveChartButton;

/**
 * @returns {Function}
 * @protected
 */
epiviz.ui.charts.decoration.RemoveChartButton.prototype._click = function() {
  var self = this;
  return function(){
    self.chart().onRemove().notify(self.chart().id());
  };
};

/**
 * @returns {*} jQuery button render options
 * @protected
 */
epiviz.ui.charts.decoration.RemoveChartButton.prototype._renderOptions = function() {
  return {
    icons:{ primary:'ui-icon ui-icon-cancel' },
    text:false
  };
};

/**
 * @returns {string}
 * @protected
 */
epiviz.ui.charts.decoration.RemoveChartButton.prototype._text = function() { return 'Remove'; };
