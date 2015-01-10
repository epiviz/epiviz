/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/10/2015
 * Time: 11:04 AM
 */

goog.provide('epiviz.ui.charts.decoration.HierarchyFilterCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.CodeButton}
 * @constructor
 */
epiviz.ui.charts.decoration.HierarchyFilterCodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.FilterCodeButton.call(this, visualization, otherDecoration, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.HierarchyFilterCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.FilterCodeButton.prototype);
epiviz.ui.charts.decoration.HierarchyFilterCodeButton.constructor = epiviz.ui.charts.decoration.HierarchyFilterCodeButton;

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.HierarchyFilterCodeButton.prototype.preFilterTemplate = function() {
  return '/**\n' +
  ' * This method is called once before every draw, for all data available to the visualization,\n' +
  ' * for initialization. Its result can be used inside the filter method.\n' +
  ' * @param {epiviz.ui.charts.tree.Node} [root]\n' +
  ' * @returns {InitialVars}\n' +
  ' * @template InitialVars\n' +
  ' */\n' +
  'function(root) {\n' +
  '  // TODO: Your code here\n' +
  '  return null;\n' +
  '}\n';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.HierarchyFilterCodeButton.prototype.filterTemplate = function() {
  return '/**\n' +
  ' * This method is called for every data object. If it returns false, the object will not be drawn.\n' +
  ' * @param {epiviz.ui.charts.tree.Node} [node]\n' +
  ' * @param {epiviz.ui.charts.tree.Node} [root]\n' +
  ' * @param {InitialVars} [preMarkResult]\n' +
  ' * @returns {boolean}\n' +
  ' * @template InitialVars\n' +
  ' */\n' +
  'function(node, root, preMarkResult) {\n' +
  '  // TODO: Your code here\n' +
  '  return true;\n' +
  '}\n'
};


