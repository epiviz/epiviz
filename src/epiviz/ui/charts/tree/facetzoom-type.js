/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/22/2014
 * Time: 12:56 PM
 */

goog.provide('epiviz.ui.charts.tree.FacetzoomType');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.tree.HierarchyVisualizationType}
 * @constructor
 */
epiviz.ui.charts.tree.FacetzoomType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.DataStructureVisualizationType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.FacetzoomType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.HierarchyVisualizationType.prototype);
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
 * TODO: Clean up code
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
//epiviz.ui.charts.tree.FacetzoomType.prototype.measurementsFilter = function() { return function(m) { return !epiviz.measurements.Measurement.Type.isOrdered(m.type()); }; };


