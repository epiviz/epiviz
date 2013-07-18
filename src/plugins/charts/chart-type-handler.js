/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/8/13
 * Time: 11:37 AM
 * To change this template use File | Settings | File Templates.
 */

/*
 * A base class for all chart handlers (geneData, bpData, etc.)
 *
 * This will be used by all chart plugins for new chart data types
 */
function ChartTypeHandler(args) {
  this._dataTypeHandler = args.dataTypeHandler;
  this._chartType = args.chartType; // for example, 'geneScatterPlot', 'barcode', 'gene', 'block', etc.
  this._chartTypeName = args.chartTypeName; // for example, 'Scatter Plot', 'Gene Expression Barcode', etc.
  this._chartDisplayType = args.chartDisplayType; // TRACK or PLOT

  this._cssClass = args.cssClass; // the css class associated with this chart type

  // The default dimensions of a chart of this type
  this._defaultHeight = args.defaultHeight;
  this._defaultWidth = args.defaultWidth;
  this._defaultMargin = args.defaultMargin;

  // Default colors of chart
  this._defaultColors = args.defaultColors || DataSeriesPalette.colors;

  this._jDialog = null;
}

ChartTypeHandler.prototype.getDataTypeHandler = function() {
  return this._dataTypeHandler;
};

ChartTypeHandler.prototype.getChartType = function() {
  return this._chartType;
};

ChartTypeHandler.prototype.getChartTypeName = function() {
  return this._chartTypeName;
};

ChartTypeHandler.prototype.getChartDisplayType = function() {
  return this._chartDisplayType;
};

ChartTypeHandler.prototype.getCssClass = function() {
  return this._cssClass;
};

ChartTypeHandler.prototype.getDefaultHeight = function() {
  return this._defaultHeight;
};

ChartTypeHandler.prototype.getDefaultWidth = function() {
  return this._defaultWidth;
};

ChartTypeHandler.prototype.getDefaultMargin = function() {
  return this._defaultMargin;
};

ChartTypeHandler.prototype.getDefaultColors = function() {
  return this._defaultColors;
};

ChartTypeHandler.prototype.initializeControls = function() {
  this._jDialog = this.getAddDialog();
};

ChartTypeHandler.prototype.getAddDialog = function() {
  if (this._jDialog != null) { return this._jDialog; }

  var id = sprintf('add-%s-dialog', this._chartType);
  var title = sprintf('Add %s', this._chartTypeName);

  $('#dialogs').append(
    sprintf('<div id="%s" title="%s"></div>', id, title)
  );

  this._jDialog = $('#' + id);
  this._jDialog.append(this.getDialogContents());

  this._jDialog.dialog(this.getDialogProperties());

  return this._jDialog;
};

ChartTypeHandler.prototype.getDialogContents = function() {
  return '';
};

/*
 * Returns an object containing the properties of the dialog as defined in the
 * dialog JQuery UI control.
 */
ChartTypeHandler.prototype.getDialogProperties = function() {
  return {
    autoOpen: false,
    width: '450',
    height: '440',
    resizable: false,
    buttons:{
      "Ok":function () { $(this).dialog("close"); },
      "Cancel":function () { $(this).dialog("close"); }
    },
    modal:true
  };
};

/*
 * Constructor method: it creates a chart of the specified type
 *
 * Used in ChartManager._addChart()
 */
ChartTypeHandler.prototype.createChart = function() {};


/*
 * Puts the chart measurements in standard format, for example:
 * { geneMeasurements: [...], genes: true, etc. }
 */
ChartTypeHandler.prototype.workspaceDataToMeasurementsMap = function(workspaceData) {
  var result = {};
  result[this.getDataTypeHandler().getMeasurementsType()] = workspaceData[1];
  return result;
};
