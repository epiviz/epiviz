/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/10/2015
 * Time: 10:28 AM
 */

goog.provide('epiviz.ui.charts.markers.HierarchyMarker');

/**
 * @param {epiviz.ui.charts.markers.VisualizationMarker.Type} type
 * @param {string} [id]
 * @param {string} [name]
 * @param {function(epiviz.ui.charts.tree.Node): InitialVars} [preMark]
 * @param {function(epiviz.ui.charts.tree.Node, epiviz.ui.charts.tree.Node, InitialVars): MarkResult} [mark]
 * @constructor
 * @template InitialVars, MarkResult
 * @extends {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.ui.charts.tree.Node, InitialVars, epiviz.ui.charts.tree.Node, MarkResult>}
 */
epiviz.ui.charts.markers.HierarchyMarker = function(type, id, name, preMark, mark) {
  epiviz.ui.charts.markers.VisualizationMarker.call(this, type, id, name, preMark, mark);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.markers.HierarchyMarker.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.markers.VisualizationMarker.prototype);
epiviz.ui.charts.markers.HierarchyMarker.constructor = epiviz.ui.charts.markers.HierarchyMarker;
