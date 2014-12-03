/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/20/2014
 * Time: 4:00 PM
 */

goog.provide('epiviz.ui.charts.tree.decoration.PropagateSelectionButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartOptionButton}
 * @constructor
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.ChartOptionButton.call(this, visualization, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartOptionButton.prototype);
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.constructor = epiviz.ui.charts.tree.decoration.PropagateSelectionButton;

/**
 * @returns {Function}
 * @protected
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.prototype._click = function() {
  var self = this;
  return function(){
    self.visualization().firePropagateHierarchySelection();
  };
};

/**
 * @returns {*} jQuery button render options
 * @protected
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.prototype._renderOptions = function() {
  return {
    icons:{ primary:'ui-icon ui-icon-refresh' },
    text:false
  };
};

/**
 * @returns {string}
 * @protected
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.prototype._text = function() { return 'Update selection'; };
