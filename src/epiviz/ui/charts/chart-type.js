/**
 * Created by: Florin Chelaru
 * Date: 10/3/13
 * Time: 11:02 PM
 */

goog.provide('epiviz.ui.charts.ChartType');

goog.require('epiviz.ui.charts.Chart');


/**
 * Abstract class
 * @param {epiviz.Config} config
 * @constructor
 * @extends {epiviz.ui.charts.VisualizationType}
 */
epiviz.ui.charts.ChartType = function(config) {
  epiviz.ui.charts.VisualizationType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.ChartType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisualizationType.prototype);
epiviz.ui.charts.ChartType.constructor = epiviz.ui.charts.ChartType;

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @returns {epiviz.ui.charts.Chart}
 */
epiviz.ui.charts.ChartType.prototype.createNew = function(id, container, properties) { throw Error('unimplemented abstract method'); };
