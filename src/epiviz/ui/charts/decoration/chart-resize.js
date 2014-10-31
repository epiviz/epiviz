/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:31 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartResize');

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @param {epiviz.ui.charts.decoration.ChartDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartResize = function(chart, otherDecoration) {
  epiviz.ui.charts.decoration.ChartDecoration.call(this, chart, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartResize.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartDecoration.prototype);
epiviz.ui.charts.decoration.ChartResize.constructor = epiviz.ui.charts.decoration.ChartResize;

/**
 */
epiviz.ui.charts.decoration.ChartResize.prototype.decorate = function() {
  epiviz.ui.charts.decoration.ChartDecoration.prototype.decorate.call(this);

  var self = this;
  var resizeHandler = function(event, ui) { self.chart().containerResize(); };
  this.chart().container().resizable({
    //resize: resizeHandler,
    stop: resizeHandler
  });
};
