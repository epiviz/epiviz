/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/1/2014
 * Time: 6:52 PM
 */

goog.provide('epiviz.ui.charts.DataStructureVisualizationType');

goog.require('epiviz.ui.charts.VisualizationType');


/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.VisualizationType}
 * @constructor
 */
epiviz.ui.charts.DataStructureVisualizationType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.VisualizationType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.DataStructureVisualizationType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisualizationType.prototype);
epiviz.ui.charts.DataStructureVisualizationType.constructor = epiviz.ui.charts.DataStructureVisualizationType;

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.DataStructureVisualizationType.prototype.chartDisplayType = function() { return epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE; };

/**
 * @returns {string}
 */
epiviz.ui.charts.DataStructureVisualizationType.prototype.cssClass = function() {
  return 'data-structure-container ui-widget-content';
};

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.ui.charts.DataStructureVisualizationType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * @returns {boolean}
 */
epiviz.ui.charts.DataStructureVisualizationType.prototype.hasMeasurements = function() { return false; };


epiviz.ui.charts.DataStructureVisualizationType.prototype.customSettingsDefs = function() {
  var defs = epiviz.ui.charts.VisualizationType.prototype.customSettingsDefs.call(this);
  return defs;
};