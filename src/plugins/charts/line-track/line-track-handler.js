/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/10/13
 * Time: 10:32 AM
 * To change this template use File | Settings | File Templates.
 */

LineTrackHandler.prototype = new TrackTypeHandler({
  dataTypeHandler: new BpDataHandler(),
  chartType: 'lineTrack',
  chartTypeName: 'Line Track',
  defaultHeight: 100
});

LineTrackHandler.prototype.constructor = LineTrackHandler;

function LineTrackHandler() {
  this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerChartType(new LineTrackHandler());
});

/*
 * Constructor method: it creates a chart of the specified type
 *
 * Used in ChartManager._addChart()
 */
LineTrackHandler.prototype.createChart = function() {
  return new LineTrack();
};
