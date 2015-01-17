/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/16/2015
 * Time: 6:18 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.CodeButton}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.MarkerCodeButton.call(this, visualization, otherDecoration, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.MarkerCodeButton.prototype);
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton.constructor = epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton;

/**
 * @returns {epiviz.ui.charts.markers.VisualizationMarker.Type}
 */
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton.prototype.markerType = function() { return epiviz.ui.charts.markers.VisualizationMarker.Type.GROUP_BY_MEASUREMENTS; };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton.prototype.markerLabel = function() { return 'Group by' };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton.prototype.markerId = function() { return 'group-by-measurements'; };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton.prototype.preMarkTemplate = function() {
  return '/**\n' +
  ' * This method is called once before every draw, for all data available to the visualization,\n' +
  ' * for initialization. Its result can be used inside the filter method.\n' +
  ' * @param {epiviz.datatypes.GenomicData} [data]\n' +
  ' * @returns {InitialVars}\n' +
  ' * @template InitialVars\n' +
  ' */\n' +
  'function(data) {\n' +
  '  // TODO: Your code here\n' +
  '  return null;\n' +
  '}\n';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.ChartGroupByMeasurementsCodeButton.prototype.markTemplate = function() {
  return '/**\n' +
  ' * @param {epiviz.measurements.Measurement} m\n' +
  ' * @param {epiviz.datatypes.GenomicData} [data]\n' +
  ' * @param {InitialVars} [preMarkResult]\n' +
  ' * @returns {string}\n' +
  ' * @template InitialVars\n' +
  ' */\n' +
  'function(m, data, preMarkResult) {\n' +
  '  // TODO: Your code here\n' +
  '  return 0;\n' +
  '}\n';
};

