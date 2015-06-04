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
      if (!tooltipButtonDecoration.checked()) { return false; }

      /** @type {epiviz.ui.charts.ChartObject} */
      var item = d3.select(this).data()[0];
      if (item.valueItems[0].length > item.measurements.length + item.measurements[0].metadata().length) {
        return self._horizontalContent(item);
      } else {
        return self._verticalContent(item);
      }
    },
    track: true,
    show: false
    // TODO: Use a better tooltip
    /*,
    position: {
      my: 'left+10 bottom-10',
      of: event,
      collision: 'fit'
    }*/
  });
};

/**
 * @param {epiviz.ui.charts.ChartObject} item
 * @returns {*}
 * @private
 */
epiviz.ui.charts.decoration.ChartTooltip.prototype._horizontalContent = function(item) {
  var maxMetadataValueLength = 15;

  var metadataCols = item.measurements[0].metadata();
  var colsHeader = sprintf('%s%s%s',
    (item.start != undefined && item.end != undefined) ? '<th><b>Start</b></th><th><b>End</b></th>' : '',
    metadataCols ? '<th><b>' + metadataCols.join('</b></th><th><b>') + '</b></th>' : '',
    item.values ? '<th><b>' + item.measurements.join('</b></th><th><b>') + '</b></th>': '');

  var rows = '';
  for (var j = 0; j < item.valueItems[0].length && j < 10; ++j) {
    var row = '';
    var rowItem = item.valueItems[0][j].rowItem;
    var start = Globalize.format(rowItem.start(), 'n0');
    var end = Globalize.format(rowItem.end(), 'n0');
    if (start != undefined && end != undefined) {
      row += sprintf('<td>%s</td><td>%s</td>', start, end);
    }
    var rowMetadata = rowItem.rowMetadata();
    if (metadataCols && rowMetadata) {
      for (var k = 0; k < metadataCols.length; ++k) {
        var metadataCol = metadataCols[k];
        var metadataValue = rowMetadata[metadataCol] || '';
        row += sprintf('<td>%s</td>', metadataValue.length <= maxMetadataValueLength ? metadataValue : metadataValue.substr(0, maxMetadataValueLength) + '...');
      }
    }

    if (item.values) {
      for (var i = 0; i < item.measurements.length; ++i) {
        row += sprintf('<td>%s</td>', Globalize.format(item.valueItems[i][j].value, 'n3'));
      }
    }

    rows += sprintf('<tr>%s</tr>', row);
  }
  if (j < item.valueItems[0].length) {
    var colspan = 2 + (metadataCols ? metadataCols.length : 0) + (item.values ? item.measurements.length : 0);
    rows += sprintf('<tr><td colspan="%s" style="text-align: center;">...</td></tr>', colspan)
  }

  return sprintf('<table class="tooltip-table"><thead><tr>%s</tr></thead><tbody>%s</tbody></table>', colsHeader, rows);
};

/**
 * @param {epiviz.ui.charts.ChartObject} item
 * @returns {*}
 * @private
 */
epiviz.ui.charts.decoration.ChartTooltip.prototype._verticalContent = function(item) {
  var maxMetadataValueLength = 15;
  var maxRows = 10;
  var maxCols = 6;
  var condensedMetadata = 4;
  var condensedValues = 5;

  var table = [];
  var coordinates = [0, 0];
  if (item.start != undefined && item.end != undefined) {
    var start = ['Start'];
    var end = ['End'];
    item.valueItems[0].every(function(valueItem, j) {
      start.push(Globalize.format(valueItem.rowItem.start(), 'n0'));
      end.push(Globalize.format(valueItem.rowItem.end(), 'n0'));
      return j < (maxCols - 1);
    });
    table.push(start);
    table.push(end);
    coordinates = [0, 2];
  }

  var metadataCols = item.measurements[0].metadata();
  var metadata = [coordinates[1], coordinates[1] + metadataCols.length];
  metadataCols.forEach(function(metadata) {
    var row = [metadata];
    item.valueItems[0].every(function(valueItem, j) {
      var metadataVal = valueItem.rowItem.metadata(metadata);
      if (metadataVal.length > maxMetadataValueLength) {
        metadataVal = metadataVal.substr(0, maxMetadataValueLength) + '...';
      }
      row.push(metadataVal);
      return j < (maxCols - 1);
    });
    table.push(row);
  });

  var values = [metadata[1], metadata[1]];
  if (item.values) {
    values = [metadata[1], metadata[1] + item.measurements.length];
    item.measurements.forEach(function(m, i) {
      var row = [m.name()];
      item.valueItems[i].every(function(valueItem, j) {
        row.push(Globalize.format(valueItem.value, 'n3'));
        return j < (maxCols - 1);
      });
      table.push(row);
    });
  }

  var nRows = values[1];
  if (nRows > maxRows) {
    coordinates[1] = 1;
    metadata[1] = Math.min(metadata[1], metadata[0] + condensedMetadata);
    nRows = coordinates[1] - coordinates[0] + metadata[1] - metadata[0] + values[1] - values[0];
    if (nRows > maxRows) {
      values[1] -= (nRows - maxRows);
    }
  }

  var ret = '', i;
  for (i = coordinates[0]; i < coordinates[1]; ++i) {
    ret += '<tr><td><b>' + table[i][0] + '</b></td><td>' + table[i].slice(1).join('</td><td>') + '</td></tr>';
  }
  for (i = metadata[0]; i < metadata[1]; ++i) {
    ret += '<tr><td><b>' + table[i][0] + '</b></td><td>' + table[i].slice(1).join('</td><td>') + '</td></tr>';
  }
  for (i = values[0]; i < values[1]; ++i) {
    ret += '<tr><td><b>' + table[i][0] + '</b></td><td>' + table[i].slice(1).join('</td><td>') + '</td></tr>';
  }
  return '<table class="tooltip-table"><tbody>' + ret + '</tbody></table>';
};
