/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/10/13
 * Time: 9:05 AM
 * To change this template use File | Settings | File Templates.
 */

BlocksTrackHandler.prototype = new TrackTypeHandler({
  dataTypeHandler: new BlocksDataHandler(),
  chartType: 'blocksTrack',
  chartTypeName: 'Blocks Track',
  defaultHeight: 70
});

BlocksTrackHandler.prototype.constructor = BlocksTrackHandler;

function BlocksTrackHandler() {
  this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerChartType(new BlocksTrackHandler());
});

/*
 * Constructor method: it creates a chart of the specified type
 *
 * Used in ChartManager._addChart()
 */
BlocksTrackHandler.prototype.createChart = function() {
  return new BlocksTrack();
};

