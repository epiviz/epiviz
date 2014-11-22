/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/22/2014
 * Time: 12:56 PM
 */

goog.provide('epiviz.ui.charts.tree.FacetzoomType');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.VisualizationType}
 * @constructor
 */
epiviz.ui.charts.tree.FacetzoomType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.VisualizationType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.FacetzoomType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.VisualizationType.prototype);
epiviz.ui.charts.tree.FacetzoomType.constructor = epiviz.ui.charts.tree.FacetzoomType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.ui.charts.tree.Facetzoom}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.createNew = function(id, container, properties) {
  return new epiviz.ui.charts.tree.Facetzoom(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.typeName = function() {
  return 'epiviz.ui.charts.tree.Facetzoom';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.chartName = function() {
  return 'Facetzoom';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.chartHtmlAttributeName = function() {
  return 'facetzoom';
};

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.measurementsFilter = function() { return function(m) { return !epiviz.measurements.Measurement.Type.isOrdered(m.type()); }; };

/**
 * If true, this flag indicates that the corresponding chart can only show measurements that belong to the same
 * data source group
 * @returns {boolean}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.isRestrictedToSameDatasourceGroup = function() { return true; };

/**
 * If false, then this visualization doesn't display measurements, but metadata, or other kinds of data
 * @returns {boolean}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.hasMeasurements = function() { return false; };

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.chartDisplayType = function() { return epiviz.ui.charts.VisualizationType.DisplayType.METADATA; };

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.FacetzoomType.prototype.cssClass = function() {
  return 'facetzoom-container ui-widget-content';
};
