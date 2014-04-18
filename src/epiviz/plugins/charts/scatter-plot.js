/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 11:55 PM
 */

goog.provide('epiviz.plugins.charts.ScatterPlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.ScatterPlot = function(id, container, properties) {
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
   * D3 legend container
   * @type {*}
   * @private
   */
  this._legend = null;

  /**
   * @type {Array.<epiviz.measurements.Measurement>}
   * @private
   */
  this._measurementsX = [];

  /**
   * @type {Array.<epiviz.measurements.Measurement>}
   * @private
   */
  this._measurementsY = [];

  var self = this;
  this.measurements().foreach(function(m, i) {
    if (i % 2 == 0) { self._measurementsX.push(m); }
    else { self._measurementsY.push(m); }
  });

  /**
   * @type {string}
   * @private
   */
  this._xLabel = '';

  /**
   * @type {string}
   * @private
   */
  this._yLabel = '';

  for (var i = 0; i < Math.min(this._measurementsX.length, this._measurementsY.length); ++i) {
    if (i > 0) {
      this._xLabel += ', ';
      this._yLabel += ', ';
    }
    this._xLabel += this._measurementsX[i].name();
    this._yLabel += this._measurementsY[i].name();
  }

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.ScatterPlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.ScatterPlot.constructor = epiviz.plugins.charts.ScatterPlot;

/**
 * @protected
 */
epiviz.plugins.charts.ScatterPlot.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Plot.prototype._initialize.call(this);

  this._chartContent = this._svg.append('g').attr('class', 'chart-content');
  this._jChartContent = this._container.find('.chart-content');
  this._legend = this._svg.append('g').attr('class', 'chart-legend');
};

/**
 * @protected
 */
epiviz.plugins.charts.ScatterPlot.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style =
    sprintf('%s .items {}\n', svgId) +
      sprintf('%s .items .selected { fill: #1a6d00; stroke: #ffc600; stroke-width: 2; stroke-opacity: 1.0; opacity: 1; }\n', svgId) +
      sprintf('%s .items .hovered { fill: #1a6d00; stroke: #ffc600; stroke-width: 2; stroke-opacity: 1.0; opacity: 1; }\n', svgId);
  var nSeries = Math.min(this._measurementsX.length, this._measurementsY.length);
  for (var i = 0; i < nSeries; ++i) {
    style += sprintf('%s .data-series-%s { opacity: 1.0; }\n', svgId, i);
  }

  var jSvg = this._container.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 */
epiviz.plugins.charts.ScatterPlot.prototype.draw = function(range, data) {

  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  return this._drawCircles(range, data);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.ScatterPlot.prototype._drawCircles = function(range, data) {
  var self = this;
  var Axis = epiviz.ui.charts.Axis;
  var circleRadius = Math.max(1,this._customSettingsValues[epiviz.plugins.charts.ScatterPlotType.CustomSettings.CIRCLE_RADIUS_RATIO] * Math.min(this.width(), this.height()));
  var gridSquareSize = Math.max(Math.floor(circleRadius), 1);
  var nSeries = Math.min(this._measurementsX.length, this._measurementsY.length);

  var firstGlobalIndex = data.first().value.globalStartIndex();
  var lastGlobalIndex = data.first().value.size() + firstGlobalIndex;
  data.foreach(function(measurement, series) {

    var firstIndex = series.globalStartIndex();
    var lastIndex = series.size() + firstIndex;

    if (firstIndex > firstGlobalIndex) { firstGlobalIndex = firstIndex; }
    if (lastIndex < lastGlobalIndex) { lastGlobalIndex = lastIndex; }
  });

  var nGenes = lastGlobalIndex - firstGlobalIndex;

  var margins = this.margins();
  var width = this.width();
  var height = this.height();

  var CustomSetting = epiviz.ui.charts.CustomSetting;
  var minY = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.Y_MIN];
  var maxY = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.Y_MAX];
  var minX = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.X_MIN];
  var maxX = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.X_MAX];

  if (minX == CustomSetting.DEFAULT) { minX = this._measurementsX[0].minValue(); }
  if (minY == CustomSetting.DEFAULT) { minY = this._measurementsY[0].minValue(); }
  if (maxX == CustomSetting.DEFAULT) { maxX = this._measurementsX[0].maxValue(); }
  if (maxY == CustomSetting.DEFAULT) { maxY = this._measurementsY[0].maxValue(); }

  var xScale = d3.scale.linear()
    .domain([minX, maxX])
    .range([0, width - margins.sumAxis(Axis.X)]);
  var yScale = d3.scale.linear()
    .domain([minY, maxY])
    .range([height - margins.sumAxis(Axis.Y), 0]);

  this._clearAxes(this._chartContent);
  this._drawAxes(xScale, yScale, 15, 15, this._chartContent);

  var i, index;
  var indices = []; //epiviz.utils.range(nSeries * nGenes);
  for (i = 0; i < nGenes; ++i) {
    index = i + firstGlobalIndex;
    var item = data.get(this._measurementsX[0]).getByGlobalIndex(index).rowItem;
    if (item.start() < range.end() && item.end() > range.start()) {
      for (var j = 0; j < nSeries; ++j) {
        indices.push(j * nGenes + i);
      }
    }
  }

  var grid = {};
  var items = [];
  var maxGroupItems = 1;
  for (i = 0; i < indices.length; ++i) {
    index = indices[i] % nGenes;
    var globalIndex = index + firstGlobalIndex;
    var seriesIndex = Math.floor(index / nGenes);
    var mX = self._measurementsX[seriesIndex];
    var mY = self._measurementsY[seriesIndex];
    var cellX = data.get(mX).getByGlobalIndex(globalIndex);
    var cellY = data.get(mY).getByGlobalIndex(globalIndex);
    var classes = sprintf('item data-series-%s', seriesIndex);

    var x = xScale(cellX.value);
    var y = yScale(cellY.value);
    var gridX = Math.floor(x / gridSquareSize) * gridSquareSize;
    var gridY = Math.floor(y / gridSquareSize) * gridSquareSize;

    var uiObj = null;
    if (grid[gridY] && grid[gridY][gridX]) {
      uiObj = grid[gridY][gridX];
      uiObj.id += '_' + cellX.globalIndex;
      uiObj.start = Math.min(uiObj.start, cellX.rowItem.start());
      uiObj.end = Math.max(uiObj.end, cellX.rowItem.end());
      uiObj.values[0] = (uiObj.values[0] * uiObj.valueItems[0].length + cellX.value) / (uiObj.valueItems[0].length + 1);
      uiObj.values[1] = (uiObj.values[1] * uiObj.valueItems[1].length + cellY.value) / (uiObj.valueItems[1].length + 1);
      uiObj.valueItems[0].push(cellX);
      uiObj.valueItems[1].push(cellY);

      if (uiObj.valueItems[0].length > maxGroupItems) {
        maxGroupItems = uiObj.valueItems[0].length;
      }

      continue;
    }

    uiObj = new epiviz.ui.charts.UiObject(
      sprintf('scatter_%s_%s', seriesIndex, cellX.globalIndex),
      cellX.rowItem.start(),
      cellX.rowItem.end(),
      [cellX.value, cellY.value],
      seriesIndex,
      [[cellX], [cellY]], // valueItems one for each measurement
      [mX, mY], // measurements
      classes);

    if (!grid[gridY]) { grid[gridY] = {}; }
    grid[gridY][gridX] = uiObj;

    items.push(uiObj);
  }

  var itemsGroup = this._chartContent.select('.items');

  if (itemsGroup.empty()) {
    itemsGroup = this._chartContent.append('g').attr('class', 'items');
    var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
    itemsGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }

  //itemsGroup.selectAll('circle').remove();
  var selection = itemsGroup.selectAll('circle').data(items, function(d) { return d.id; });

  selection
    .enter()
    .insert('circle', ':first-child')
    .attr('id', function (d) {
      return sprintf('%s-item-%s-%s', self._id, d.seriesIndex, d.valueItems[0][0].globalIndex);
    })
    .style('opacity', 0)
    .style('fill-opacity', 0)
    .attr('r', 0);
  selection
    .each(
      /**
       * @param {epiviz.ui.charts.UiObject} d
       */
      function(d) {
        var circle = d3.select(this);
        circle
          .attr('cx', margins.left() + (d.values[0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
          .attr('cy', height - margins.bottom() - ((d.values[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
          .attr('class', d.cssClasses)
          .style('fill', self.colors().get(d.seriesIndex));
      });

  selection
    .transition()
    .duration(1000)
    .style('fill-opacity', function(d) {
      return Math.max(0.3, d.valueItems[0].length / maxGroupItems);
    })
    .style('opacity', null)
    .attr('r', circleRadius);

  selection
    .exit()
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .attr('r', 0)
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

  return items;
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.ScatterPlot.prototype.chartTypeName = function() { return 'epiviz.plugins.charts.ScatterPlot'; };

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.ScatterPlot.prototype.colorMap = function() {
  var self = this;
  var n = Math.min(this._measurementsX.length, this._measurementsY.length);
  var colors = new Array(n);

  for (var i = 0; i < n; ++i) {
    colors[i] = {
      name: sprintf('%s vs %s', this._measurementsX[i].name(), this._measurementsY[i].name()),
      color: this._properties.colors.get(i)
    };
  }

  return colors;
};

/**
 * @param xScale D3 linear scale for the x axis
 * @param yScale D3 linear scale for the y axis
 * @param {number} [xTicks]
 * @param {number} [yTicks]
 * @param [svg] D3 svg container for the axes
 * @param {number} [width]
 * @param {number} [height]
 * @param {epiviz.ui.charts.Margins} [margins]
 * @protected
 */
epiviz.plugins.charts.ScatterPlot.prototype._drawAxes = function(xScale, yScale, xTicks, yTicks, svg, width, height, margins) {
  epiviz.ui.charts.Plot.prototype._drawAxes.call(this, xScale, yScale, xTicks, yTicks, svg, width, height, margins);

  this._legend.selectAll('text').remove();

  var xWidth = this._xLabel.length * 7;
  var yWidth = this._yLabel.length * 7;
  this._legend.append('text')
    .attr('x', (this.width() - xWidth) * 0.5)
    .attr('y', (this.height() - this.margins().bottom() + 35))
    .attr('style', 'font-weight: regular; font-size: 12;')
    .attr('fill', '#000000')
    .attr('stroke', 'none')
    .style('fill-opacity', 1)
    .text(this._xLabel);

  this._legend.append('text')
    .attr('x', - this.height() + (this.height() - yWidth) * 0.5 + this.margins().top())
    .attr('y', this.margins().left() - 25)
    .attr('transform', 'rotate(-90)')
    .attr('style', 'font-weight: regular; font-size: 12;')
    .attr('fill', '#000000')
    .attr('stroke', 'none')
    .style('fill-opacity', 1)
    .text(this._yLabel);
};
