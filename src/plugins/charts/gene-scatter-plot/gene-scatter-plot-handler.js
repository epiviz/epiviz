/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/8/13
 * Time: 1:25 PM
 * To change this template use File | Settings | File Templates.
 */

GeneScatterPlotHandler.prototype = new ChartTypeHandler({
  dataTypeHandler: new ProbeDataHandler(),
  chartType: 'geneScatterPlot',
  chartTypeName: 'Gene Scatter Plot',
  chartDisplayType: ChartDisplayType.PLOT,
  cssClass: 'plot-chart',
  defaultHeight: 400,
  defaultWidth: 420,
  defaultMargin: 20
});

GeneScatterPlotHandler.prototype.constructor = GeneScatterPlotHandler;

function GeneScatterPlotHandler() {
  this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerChartType(new GeneScatterPlotHandler());
});

GeneScatterPlotHandler.prototype.initializeControls = function() {
  ChartTypeHandler.prototype.initializeControls.call(this);

  var xSelector = $('#xAxis-selector');
  xSelector.multiselect({
    sortable:true,
    searchable:true
  });
  var ySelector = $('#yAxis-selector');
  ySelector.multiselect({
    sortable:true,
    searchable:true
  });
};

GeneScatterPlotHandler.prototype.getDialogContents = function() {
  return '<label class="dialog-label">X axis:</label> ' +
    '<br/> ' +
    '<div id="xAxis-select-container"> ' +
      '<select id="xAxis-selector" class="multiselect" multiple="multiple" name="x-measurement[]" style="min-height: 150px;"> ' +
      '</select> ' +
    '</div> ' +
    '<br/> ' +
    '<label class="dialog-label">Y axis:</label> ' +
    '<br/> ' +
    '<div id="yAxis-select-container"> ' +
      '<select id="yAxis-selector" class="multiselect" multiple="multiple" name="y-measurement[]" style="min-height: 150px;"> ' +
      '</select> ' +
    '</div>';
};

/*
 * Returns an object containing the properties of the dialog as defined in the
 * dialog JQuery UI control.
 */
GeneScatterPlotHandler.prototype.getDialogProperties = function() {
  var self = this;
  return {
    autoOpen: false,
    width: '450',
    height: '440',
    resizable: false,
    buttons:{
      "Ok":function () {
        var xAxisSelector = $('#xAxis-selector');
        var yAxisSelector = $('#yAxis-selector');

        var xm = xAxisSelector.multiselect('selectedValues');
        var ym = yAxisSelector.multiselect('selectedValues');

        if (xm.length > 0 && ym.length > 0) {
          ChartManager.instance.addChart(['geneScatterPlot', [xm, ym]]);
          UILocation.change();

          $(this).dialog("close");
        }
      },
      "Cancel":function () {
        $(this).dialog("close");
      }
    },
    open: function(event, ui) {

      var xAxisSelector = $('#xAxis-selector');
      xAxisSelector.empty();
      var yAxisSelector = $('#yAxis-selector');
      yAxisSelector.empty();
      var optionFormat = '<option value="%s">%s</option>';

      //var geneMeasurements = self._measurementsStore.getMeasurements();
      var geneMeasurements = self.getDataTypeHandler().getMeasurementsStore().getMeasurements();
      for (var key in geneMeasurements) {
        var option = sprintf(optionFormat, key, geneMeasurements[key]);
        xAxisSelector.append(option);
        yAxisSelector.append(option);
      }
      xAxisSelector.multiselect('destroy').multiselect({sortable:true, searchable:true});
      yAxisSelector.multiselect('destroy').multiselect({sortable:true, searchable:true});
    },
    modal:true
  }
};

/*
 * Constructor method: it creates a chart of the specified type
 *
 * Used in ChartManager._addChart()
 */
GeneScatterPlotHandler.prototype.createChart = function() {
  return new GeneScatterPlot();
};

/*
 * Puts the chart measurements in standard format, for example:
 * { geneMeasurements: [...], genes: true, etc. }
 */
GeneScatterPlotHandler.prototype.workspaceDataToMeasurementsMap = function(workspaceData) {
  return {
    geneMeasurements: workspaceData[1][0].concat(workspaceData[1][1])
  };
};
