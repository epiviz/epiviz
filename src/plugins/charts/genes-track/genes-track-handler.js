/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/9/13
 * Time: 2:45 PM
 * To change this template use File | Settings | File Templates.
 */

GenesTrackHandler.prototype = new TrackTypeHandler({
  dataTypeHandler: new GeneDataHandler(),
  chartType: 'genesTrack',
  chartTypeName: 'Genes Track',
  defaultHeight: 100,
  defaultColors: [DataSeriesPalette.colors[5], DataSeriesPalette.colors[0]]
});

GenesTrackHandler.prototype.constructor = GenesTrackHandler;

function GenesTrackHandler() {
  this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerChartType(new GenesTrackHandler());
});

/*
 * Constructor method: it creates a chart of the specified type
 *
 * Used in ChartManager._addChart()
 */
GenesTrackHandler.prototype.createChart = function() {
  return new GenesTrack();
};
