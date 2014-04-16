/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/28/13
 * Time: 10:25 AM
 */

goog.provide('epiviz.ui.charts.Plot');

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @extends {epiviz.ui.charts.Chart}
 * @constructor
 */
epiviz.ui.charts.Plot = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Chart.call(this, id, container, properties);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.Plot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Chart.prototype);
epiviz.ui.charts.Plot.constructor = epiviz.ui.charts.Plot;

/**
 * @returns {epiviz.ui.charts.ChartType.DisplayType}
 */
epiviz.ui.charts.Plot.prototype.displayType = function() { return epiviz.ui.charts.ChartType.DisplayType.PLOT; };
