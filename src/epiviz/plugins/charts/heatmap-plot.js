/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 5:56 PM
 */

goog.provide('epiviz.plugins.charts.HeatmapPlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.HeatmapPlot = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Plot.call(this, id, container, properties);

  /**
   * D3 chart container
   * @type {*}
   * @private
   */
  this._chartContent = null;

  /**
   * @type {jQuery}
   * @private
   */
  this._jChartContent = null;

  /**
   * @type {number}
   * @private
   */
  this._min = this.measurements().first().minValue();

  /**
   * @type {number}
   * @private
   */
  this._max = this.measurements().first().maxValue();

  /**
   * @type {function(number): string}
   * @private
   */
  this._colorScale = epiviz.utils.colorizeBinary(this._min, this._max, this.colors().get(0), this.colors().get(1));

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.HeatmapPlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.HeatmapPlot.constructor = epiviz.plugins.charts.HeatmapPlot;

/**
 * @protected
 */
epiviz.plugins.charts.HeatmapPlot.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Plot.prototype._initialize.call(this);

  this._chartContent = this._svg.append('g').attr('class', 'chart-content');
  this._jChartContent = this._container.find('.chart-content');
};

/**
 * @protected
 */
epiviz.plugins.charts.HeatmapPlot.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style = sprintf('%s .items { stroke: #efefef; stroke-opacity: 0.3; shape-rendering: \'crispEdges\'; }\n', svgId) +
    sprintf('%s .selected .item { stroke: #ffc600; stroke-width: 2; stroke-opacity: 1.0; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .hovered .item { stroke: #ffc600; stroke-width: 2; stroke-opacity: 1.0; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .col-text { text-anchor: start; font-size: 10px; }\n', svgId) +
    sprintf('%s .row-text { text-anchor: end; font-size: 9px; }\n', svgId) +
    sprintf('%s .selected .col-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .hovered .col-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .selected .row-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .hovered .row-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId);

  var jSvg = this._container.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 */
epiviz.plugins.charts.HeatmapPlot.prototype.draw = function(range, data) {

  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  return this._drawCells(range, data);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawCells = function(range, data) {
  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  var maxColumns = this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS];

  var firstGlobalIndex = data.first().value.globalStartIndex();
  var lastGlobalIndex = data.first().value.size() + firstGlobalIndex;
  var rownames = [];
  data.foreach(function(measurement, series) {

    var firstIndex = series.globalStartIndex();
    var lastIndex = series.size() + firstIndex;

    if (firstIndex > firstGlobalIndex) { firstGlobalIndex = firstIndex; }
    if (lastIndex < lastGlobalIndex) { lastGlobalIndex = lastIndex; }

    rownames.push(measurement.name());
  });

  var nEntries = lastGlobalIndex - firstGlobalIndex;

  var label = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.LABEL];

  var width = this.width();
  var height = this.height();

  var colnames = [], columnMap = {};
  var i, globalIndex;

  for (i = 0; i < nEntries; ++i) {
    globalIndex = i + firstGlobalIndex;
    var item = data.get(this.measurements().first()).getByGlobalIndex(globalIndex).rowItem;
    if (item.start() < range.end() && item.end() > range.start()) {
      var colLabel = item.metadata(label) || '' + item.id();
      columnMap[colnames.length] = globalIndex;
      colnames.push(colLabel);
    }
  }

  /** @type {Array.<epiviz.ui.charts.UiObject>} */
  var items = [];
  var colIndex = {};
  this.measurements().foreach(function(m, seriesIndex) {
    var nextCellsPerCol = Math.ceil(colnames.length / maxColumns), cellsPerCol = 0;
    var colsLeft = maxColumns;
    for (var i = 0; i < colnames.length; ++i) {
      globalIndex = columnMap[i];

      var cell = data.get(m).getByGlobalIndex(globalIndex);
      var uiObj = null;
      if (cellsPerCol == 0) {
        var classes = sprintf('item data-series-%s', seriesIndex);

        uiObj = new epiviz.ui.charts.UiObject(
          sprintf('heatmap_%s_%s', seriesIndex, globalIndex),
          cell.rowItem.start(),
          cell.rowItem.end(),
          [cell.value],
          seriesIndex,
          [[cell]], // valueItems one for each measurement
          [m], // measurements
          classes);
        items.push(uiObj);

        nextCellsPerCol = Math.ceil((colnames.length - i) / colsLeft);
        cellsPerCol = nextCellsPerCol;
        --colsLeft;
      } else {
        //var lastRowIndex = Math.floor(i / cellsPerCol) * self.measurements().size() + seriesIndex;
        uiObj = items[items.length - 1];
        uiObj.id += '_' + globalIndex;
        uiObj.start = Math.min(uiObj.start, cell.rowItem.start());
        uiObj.end = Math.max(uiObj.end, cell.rowItem.end());
        uiObj.values[0] = (uiObj.values[0] * uiObj.valueItems[0].length + cell.value) / (uiObj.valueItems[0].length + 1);
        uiObj.valueItems[0].push(cell);
      }

      if (seriesIndex == 0) {
        colIndex[globalIndex] = items.length - 1;
      }

      --cellsPerCol;
    }
  });

  var nCols = Math.min(colnames.length, maxColumns);
  var cellWidth = nCols ? (this.width() - this.margins().sumAxis(Axis.X)) / nCols : 0;
  var cellHeight = (this.height() - this.margins().sumAxis(Axis.Y)) / this.measurements().size();
  this._colorScale = epiviz.utils.colorizeBinary(this._min, this._max, this.colors().get(0), this.colors().get(1));

  var itemsGroup = this._chartContent.select('.items');

  if (itemsGroup.empty()) {
    itemsGroup = this._chartContent.append('g')
      .attr('class', 'items');
    var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
    itemsGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }

  itemsGroup.attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');

  var selection = itemsGroup.selectAll('rect').data(items, function(d) { return d.id; });

  selection
    .enter()
    .append('rect')
    .attr('id', function (d) {
      return sprintf('%s-item-%s-%s', self._id, d.seriesIndex, d.valueItems[0][0].globalIndex);
    })
    .attr('class', function(d) { return d.cssClasses; })
    .style('opacity', 0)
    .style('fill-opacity', 0)
    .attr('x', function(d, i) { return cellWidth * colIndex[d.valueItems[0][0].globalIndex]; })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('fill', function(d) { return self._colorScale(d.values[0]); });

  selection
    .transition()
    .duration(1000)
    .style('fill-opacity', null)
    .style('opacity', null)
    .attr('x', function(d, i) {
      return cellWidth * colIndex[d.valueItems[0][0].globalIndex];
    })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('fill', function(d) { return self._colorScale(d.values[0]); });

  selection
    .exit()
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .remove();

  selection
    .on('mouseover', function (d) {
      self._hover.notify(d);
    })
    .on('mouseout', function (d) {
      self._unhover.notify();
    })
    .on('click', function (d) {
      self._deselect.notify();
      self._select.notify(d);

      d3.event.stopPropagation();
    });

  var mapCol = function(i, centered) {
    return i * cellWidth + ((centered) ? 0.5 * cellWidth : 0);
  };

  var mapRow = function(i, centered) {
    return i * cellHeight + ((centered) ? cellHeight * 0.5 : 0);
  };

  // Column names

  var colSelection = itemsGroup.selectAll('.col-text');

  if (colnames.length > nCols) {
    colSelection
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
  } else {
    colSelection = colSelection
      .data(colnames, function(d, i) { return d + columnMap[i]; });

    colSelection
      .enter()
      .append('text')
      .attr('class', 'col-text')
      .style('opacity', '0')
      .attr('x', 0)
      .attr('y', 0)
      .attr('transform', function(d, i){
        return 'translate(' + (mapCol(i, true))  + ',' + (-5) + ')rotate(-60)';
      })
      .text(function(d){ return d; });

    colSelection
      .transition()
      .duration(500)
      .attr('x', 0)
      .attr('y', 0)
      .attr('transform', function(d, i){
        return 'translate(' + (mapCol(i, true))  + ',' + (-5) + ')rotate(-60)';
      })
      .style('opacity', null);

    colSelection
      .exit()
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
  }

  // Row names

  var rowSelection = itemsGroup.selectAll('.row-text')
    .data(rownames, String);

  rowSelection
    .enter()
    .append('text')
    .attr('class', function(d) { return 'row-text'; })
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d, i){
      return 'translate(' + (-5) + ',' + (mapRow(i, true)) + ')rotate(30)';
    })
    .text(function(d){ return d; });

  rowSelection
    .transition()
    .duration(500)
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d, i){
      return 'translate(' + (-5) + ',' + (mapRow(i, true)) + ')rotate(30)';
    });

  return items;
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.HeatmapPlot.prototype.chartTypeName = function() { return 'epiviz.plugins.charts.HeatmapPlot'; };

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.HeatmapPlot.prototype.colorMap = function() {
  return [
    { name: 'Min', color: this.colors().get(0) },
    { name: 'Max', color: this.colors().get(1) }
  ];
};
