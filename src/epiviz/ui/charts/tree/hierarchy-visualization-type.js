/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/2/2014
 * Time: 7:13 PM
 */

goog.provide('epiviz.ui.charts.tree.HierarchyVisualizationType');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.DataStructureVisualizationType}
 * @constructor
 */
epiviz.ui.charts.tree.HierarchyVisualizationType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.DataStructureVisualizationType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.HierarchyVisualizationType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.DataStructureVisualizationType.prototype);
epiviz.ui.charts.tree.HierarchyVisualizationType.constructor = epiviz.ui.charts.tree.HierarchyVisualizationType;
