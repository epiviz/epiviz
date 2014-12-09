/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/9/2014
 * Time: 1:09 AM
 */

goog.provide('epiviz.plugins.charts.LinePlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.LinePlot = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Plot.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.LinePlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.LinePlot.constructor = epiviz.plugins.charts.LinePlot;

/**
 * @protected
 */
epiviz.plugins.charts.LinePlot.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Plot.prototype._initialize.call(this);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.LinePlot.prototype.draw = function(range, data, slide, zoom) {

  var lastRange = this._lastRange;

  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data, slide, zoom);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  if (lastRange && range && lastRange.overlapsWith(range) && lastRange.width() == range.width()) {
    slide = range.start() - lastRange.start();
  }

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  var CustomSetting = epiviz.ui.charts.CustomSetting;
  var minY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MIN];
  var maxY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MAX];

  if (minY == CustomSetting.DEFAULT) {
    minY = null;
    this.measurements().foreach(function(m) {
      if (m === null) { return; }
      if (minY === null || m.minValue() < minY) { minY = m.minValue(); }
    });
  }

  if (maxY == CustomSetting.DEFAULT) {
    maxY = null;
    this.measurements().foreach(function(m) {
      if (m === null) { return; }
      if (maxY === null || m.maxValue() > maxY) { maxY = m.maxValue(); }
    });
  }

  if (minY === null && maxY === null) { minY = -1; maxY = 1; }
  if (minY === null) { minY = maxY - 1; }
  if (maxY === null) { maxY = minY + 1; }

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale.linear()
    .domain([0, this.measurements().size() - 1])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);
  var yScale = d3.scale.linear()
    .domain([minY, maxY])
    .range([this.height() - this.margins().sumAxis(Axis.Y), 0]);

  this._clearAxes();
  this._drawAxes(xScale, yScale, 10, 5);

  var linesGroup = this._svg.selectAll('.lines');

  if (linesGroup.empty()) {
    var graph = this._svg.append('g')
      .attr('class', 'lines')
      .attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');
    /*this.measurements().foreach(function(m, i) {
      graph.append('g').attr('class', 'line-series-index-' + i);
      graph.append('g').attr('class', 'point-series-index-' + i);
    });*/
  }
  return this._drawLines(range, data, xScale, yScale);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @param {function} xScale D3 linear scale
 * @param {function} yScale D3 linear scale
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.LinePlot.prototype._drawLines = function(range, data, xScale, yScale) {
  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  /** @type {boolean} */
  var showPoints = this.customSettingsValues()[epiviz.plugins.charts.LinePlotType.CustomSettings.SHOW_POINTS];

  /** @type {boolean} */
  var showLines = this.customSettingsValues()[epiviz.plugins.charts.LinePlotType.CustomSettings.SHOW_LINES];

  /** @type {number} */
  var pointRadius = this.customSettingsValues()[epiviz.plugins.charts.LinePlotType.CustomSettings.POINT_RADIUS];

  /** @type {number} */
  var lineThickness = this.customSettingsValues()[epiviz.plugins.charts.LinePlotType.CustomSettings.LINE_THICKNESS];

  var interpolation = this.customSettingsValues()[epiviz.plugins.charts.LinePlotType.CustomSettings.INTERPOLATION];

  var self = this;

  var graph = this._svg.select('.lines');

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];

  var firstGlobalIndex = data.first().value.globalStartIndex();
  var lastGlobalIndex = data.first().value.size() + firstGlobalIndex;

  data.foreach(function(measurement, series) {
    var firstIndex = series.globalStartIndex();
    var lastIndex = series.size() + firstIndex;

    if (firstIndex > firstGlobalIndex) { firstGlobalIndex = firstIndex; }
    if (lastIndex < lastGlobalIndex) { lastGlobalIndex = lastIndex; }
  });

  var nEntries = lastGlobalIndex - firstGlobalIndex;

  // TODO: This might not be needed anymore
  // TODO: Search for all usages of this method
  var dataHasGenomicLocation = epiviz.measurements.Measurement.Type.isOrdered(this.measurements().first().type());
  var firstIndex, lastIndex;
  for (var i = 0; i < nEntries; ++i) {
    var globalIndex = i + firstGlobalIndex;
    var item = data.get(this.measurements().first()).getByGlobalIndex(globalIndex).rowItem;
    if (!dataHasGenomicLocation ||
      (range.start() == undefined || range.end() == undefined) ||
      item.start() < range.end() && item.end() >= range.start()) {
      if (firstIndex == undefined) { firstIndex = globalIndex; }
      lastIndex = globalIndex + 1;
    }
  }

  firstGlobalIndex = firstIndex;
  lastGlobalIndex = lastIndex;
  nEntries = lastIndex - firstIndex;

  // TODO
  var label = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.LABEL];

  var width = this.width();

  var lineFunc = d3.svg.line()
    .x(function(d) {
      return xScale(d.x);
    })
    .y(function(d) {
      return yScale(d.y);
    })
    .interpolate(interpolation);

  var lineData = function(index) {
    var ret = self.measurements().toArray().map(function(m, i) {
      return { x: i, y: data.get(m).getByGlobalIndex(index).value };
    });
    return lineFunc(ret);
  };

  var lines = graph.selectAll('.line-series')
    .data(epiviz.utils.range(nEntries, firstGlobalIndex));



  lines
    .enter()
    .append('path')
    .attr('d', lineData)
    .attr('class', 'line-series')
    .style('shape-rendering', 'auto')
    .style('stroke-opacity', '0')
    //.on('mouseover', function() { self._captureMouseHover(); })
    //.on('mousemove', function() { self._captureMouseHover(); })
    //.on('mouseout', function () { self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id())); })
    .transition()
    .duration(500)
    .style('stroke-opacity', '0.7')

    /*.attr('d', lineData)
    .style('stroke', function(index) { return colors.get(index); })
    .style('stroke-width', lineThickness);*/

  lines
    .attr('d', lineData)
    .style('stroke', function(index) { return colors.get(index); })
    .style('stroke-width', lineThickness);

  lines
    .exit()
    .transition()
    .duration(500)
    .style('stroke-opacity', '0')
    .remove();

  return items; // TODO: Put something in this array
};

