/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/22/13
 * Time: 6:49 PM
 */

goog.provide('epiviz.ui.charts.TrackType');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.ChartType}
 * @constructor
 */
epiviz.ui.charts.TrackType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.ChartType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.TrackType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.ChartType.prototype);
epiviz.ui.charts.TrackType.constructor = epiviz.ui.charts.TrackType;

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.TrackType.prototype.chartDisplayType = function() { return epiviz.ui.charts.VisualizationType.DisplayType.TRACK; };

/**
 * @returns {string}
 */
epiviz.ui.charts.TrackType.prototype.cssClass = function() {
  return 'track-container ui-widget-content';
};
