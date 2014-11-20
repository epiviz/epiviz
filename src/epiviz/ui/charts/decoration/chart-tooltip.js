/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:31 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartTooltip');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartTooltip = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.VisualizationDecoration.call(this, visualization, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartTooltip.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.decoration.ChartTooltip.constructor = epiviz.ui.charts.decoration.ChartTooltip;

/**
 */
epiviz.ui.charts.decoration.ChartTooltip.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  /** @type {epiviz.ui.charts.decoration.ToggleTooltipButton} */
  var tooltipButtonDecoration = undefined;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.constructor == epiviz.ui.charts.decoration.ToggleTooltipButton) {
      tooltipButtonDecoration = decoration;
      break;
    }
  }

  var self = this;
  this.visualization().container().tooltip({
    items: '.item',
    content:function () {
      //if (!self.visualization().showTooltip()) { return false; }
      if (!tooltipButtonDecoration.checked()) { return false; }

      /** @type {epiviz.ui.charts.ChartObject} */
      var uiObj = d3.select(this).data()[0];

      var maxMetadataValueLength = 15;

      var metadataCols = uiObj.measurements[0].metadata();
      var colsHeader = sprintf('<th><b>Start</b></th><th><b>End</b></th>%s%s',
        metadataCols ? '<th><b>' + metadataCols.join('</b></th><th><b>') + '</b></th>' : '',
        uiObj.values ? '<th><b>' + uiObj.measurements.join('</b></th><th><b>') + '</b></th>': '');

      var rows = '';
      for (var j = 0; j < uiObj.valueItems[0].length && j < 10; ++j) {
        var row = '';
        var rowItem = uiObj.valueItems[0][j].rowItem;
        var start = Globalize.format(rowItem.start(), 'n0');
        if (start == undefined) { start = ''; }
        var end = Globalize.format(rowItem.end(), 'n0');
        if (end == undefined) { end = ''; }
        row += sprintf('<td>%s</td><td>%s</td>', start, end);
        var rowMetadata = rowItem.rowMetadata();
        if (metadataCols && rowMetadata) {
          for (var k = 0; k < metadataCols.length; ++k) {
            var metadataCol = metadataCols[k];
            var metadataValue = rowMetadata[metadataCol] || '';
            row += sprintf('<td>%s</td>', metadataValue.length <= maxMetadataValueLength ? metadataValue : metadataValue.substr(0, maxMetadataValueLength) + '...');
          }
        }

        if (uiObj.values) {
          for (var i = 0; i < uiObj.measurements.length; ++i) {
            row += sprintf('<td>%s</td>', Globalize.format(uiObj.valueItems[i][j].value, 'n3'));
          }
        }

        rows += sprintf('<tr>%s</tr>', row);
      }
      if (j < uiObj.valueItems[0].length) {
        var colspan = 2 + (metadataCols ? metadataCols.length : 0) + (uiObj.values ? uiObj.measurements.length : 0);
        rows += sprintf('<tr><td colspan="%s" style="text-align: center;">...</td></tr>', colspan)
      }

      return sprintf('<table class="tooltip-table"><thead><tr>%s</tr></thead><tbody>%s</tbody></table>', colsHeader, rows);
    },
    track: true,
    show: false
  });
};
