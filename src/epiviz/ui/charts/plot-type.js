/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/28/13
 * Time: 10:26 AM
 */

goog.provide('epiviz.ui.charts.PlotType');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.ChartType}
 * @constructor
 */
epiviz.ui.charts.PlotType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.ChartType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.PlotType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.ChartType.prototype);
epiviz.ui.charts.PlotType.constructor = epiviz.ui.charts.PlotType;

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.PlotType.prototype.chartDisplayType = function() { return epiviz.ui.charts.VisualizationType.DisplayType.PLOT; };

/**
 * @returns {string}
 */
epiviz.ui.charts.PlotType.prototype.cssClass = function() {
  return 'plot-container ui-widget-content';
};
