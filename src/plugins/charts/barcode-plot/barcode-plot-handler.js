/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/10/13
 * Time: 10:43 AM
 * To change this template use File | Settings | File Templates.
 */

BarcodePlotHandler.prototype = new ChartTypeHandler({
  dataTypeHandler: new BarcodeDataHandler(),
  chartType: 'barcodePlot',
  chartTypeName: 'Barcode Plot',
  chartDisplayType: ChartDisplayType.PLOT,
  cssClass: 'plot-chart',
  defaultHeight: 400,
  defaultWidth: 600,
  defaultMargin: 20,
  defaultColors: ['#ffffff', DataSeriesPalette.colors[0]]
});

BarcodePlotHandler.prototype.constructor = BarcodePlotHandler;

function BarcodePlotHandler() {
  this.initializeControls();
}

$(function() {
  ChartFactory.instance.registerChartType(new BarcodePlotHandler());
});

BarcodePlotHandler.prototype.initializeControls = function() {
  ChartTypeHandler.prototype.initializeControls.call(this);

  // This goes into BarcodePlotHandler
  var jTree = $("#barcode-tree");
  jTree.dynatree({
    checkbox: true,
    selectMode: 2,
    children: this._dataTypeHandler.getMeasurementsStore().getTree(),
    onSelect: function(select, node) {},
    onClick: function(node, event) {},
    onKeydown: function(node, event) {} // ,
    // The following options are only required, if we have more than one tree on one page:
    // cookieId: "dynatree-Cb2",
    // idPrefix: "dynatree-Cb2-"
  });
};

BarcodePlotHandler.prototype.getDialogContents = function() {
  return '<div id="barcode-tree"></div>';
};

/*
 * Returns an object containing the properties of the dialog as defined in the
 * dialog JQuery UI control.
 */
BarcodePlotHandler.prototype.getDialogProperties = function() {
  var self = this;
  return {
    autoOpen: false,
    width: '450',
    height: '440',
    resizable: false,
    buttons:{
      "Ok":function () {
        var barcodeMeasurements = [];
        var selectedNodes = $("#barcode-tree").dynatree('getTree').getSelectedNodes();

        if (selectedNodes.length > 0) {
          for (var i=0; i<selectedNodes.length; ++i) {
            barcodeMeasurements.push(selectedNodes[i].data.key);
          }

          ChartManager.instance.addChart([self._chartType, barcodeMeasurements]);
          UILocation.change();

          $(this).dialog("close");
        }
      },
      "Cancel":function () {
        $(this).dialog("close");
      }
    },
    open: function(event, ui) {
      var jTree = $("#barcode-tree");
      jTree.dynatree('option', 'children', self.getDataTypeHandler().getMeasurementsStore().getTree());
      jTree.dynatree('getTree').reload();
    },
    modal:true
  }
};

/*
 * Constructor method: it creates a chart of the specified type
 *
 * Used in ChartManager._addChart()
 */
BarcodePlotHandler.prototype.createChart = function() {
  return new BarcodePlot();
};
