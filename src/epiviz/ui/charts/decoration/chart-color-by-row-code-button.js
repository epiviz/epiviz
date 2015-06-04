/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/10/2015
 * Time: 11:00 AM
 */

goog.provide('epiviz.ui.charts.decoration.ChartColorByRowCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.CodeButton}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartColorByRowCodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.MarkerCodeButton.call(this, visualization, otherDecoration, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartColorByRowCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.MarkerCodeButton.prototype);
epiviz.ui.charts.decoration.ChartColorByRowCodeButton.constructor = epiviz.ui.charts.decoration.ChartColorByRowCodeButton;

/**
 * @returns {epiviz.ui.charts.markers.VisualizationMarker.Type}
 */
epiviz.ui.charts.decoration.ChartColorByRowCodeButton.prototype.markerType = function() { return epiviz.ui.charts.markers.VisualizationMarker.Type.COLOR_BY_ROW; };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.ChartColorByRowCodeButton.prototype.markerLabel = function() { return 'Color By' };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.ChartColorByRowCodeButton.prototype.markerId = function() { return 'color-by'; };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.ChartColorByRowCodeButton.prototype.preMarkTemplate = function() {
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
epiviz.ui.charts.decoration.ChartColorByRowCodeButton.prototype.markTemplate = function() {
  return '/**\n' +
  ' * This method is called for every data object. If it returns false, the object will not be drawn.\n' +
  ' * @param {epiviz.datatypes.GenomicData.RowItem} [row]\n' +
  ' * @param {epiviz.datatypes.GenomicData} [data]\n' +
  ' * @param {InitialVars} [preMarkResult]\n' +
  ' * @returns {string}\n' +
  ' * @template InitialVars\n' +
  ' */\n' +
  'function(row, data, preMarkResult) {\n' +
  '  // TODO: Your code here\n' +
  '  return row.metadata(\'colLabel\');\n' +
  '}\n'
};

