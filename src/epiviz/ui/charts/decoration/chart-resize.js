/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:31 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartResize');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartResize = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.VisualizationDecoration.call(this, visualization, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartResize.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.decoration.ChartResize.constructor = epiviz.ui.charts.decoration.ChartResize;

/**
 */
epiviz.ui.charts.decoration.ChartResize.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  var self = this;
  var resizeHandler = function(event, ui) { self.visualization().updateSize(); };
  this.visualization().container().resizable({
    //resize: resizeHandler,
    stop: resizeHandler
  });
};
