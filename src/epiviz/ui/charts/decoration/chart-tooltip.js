/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:31 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartTooltip');

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @param {epiviz.ui.charts.decoration.ChartDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartTooltip = function(chart, otherDecoration) {
  epiviz.ui.charts.decoration.ChartDecoration.call(this, chart, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartTooltip.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartDecoration.prototype);
epiviz.ui.charts.decoration.ChartTooltip.constructor = epiviz.ui.charts.decoration.ChartTooltip;

/**
 */
epiviz.ui.charts.decoration.ChartTooltip.prototype.decorate = function() {
  epiviz.ui.charts.decoration.ChartDecoration.prototype.decorate.call(this);

  /** @type {epiviz.ui.charts.decoration.ToggleTooltipButton} */
  var tooltipButtonDecoration = undefined;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.constructor == epiviz.ui.charts.decoration.ToggleTooltipButton) {
      tooltipButtonDecoration = decoration;
      break;
    }
  }

  var self = this;
  this.chart().container().tooltip({
    items: '.item',
    content:function () {
      //if (!self.chart().showTooltip()) { return false; }
      if (!tooltipButtonDecoration.checked()) { return false; }

      /** @type {epiviz.ui.charts.UiObject} */
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
        row += sprintf('<td>%s</td><td>%s</td>', Globalize.format(rowItem.start(), 'n0'), Globalize.format(rowItem.end(), 'n0'));
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
