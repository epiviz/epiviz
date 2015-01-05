/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/2/2015
 * Time: 3:50 PM
 */

goog.provide('epiviz.plugins.charts.StackedLinePlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.StackedLinePlot = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Plot.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.StackedLinePlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.StackedLinePlot.constructor = epiviz.plugins.charts.StackedLinePlot;

/**
 * @protected
 */
epiviz.plugins.charts.StackedLinePlot.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Plot.prototype._initialize.call(this);

  this._svg.classed('stacked-line-plot', true);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.StackedLinePlot.prototype.draw = function(range, data, slide, zoom) {

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

  var interpolation = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.INTERPOLATION];
  var xBound = interpolation.indexOf('step') == 0 ? this.measurements().size() : this.measurements().size() - 1;

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale.linear()
    .domain([0, xBound])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);

  this._clearAxes();
  this._drawAxes(xScale, undefined, this.measurements().size(), 5,
    undefined, undefined, undefined, undefined, undefined, undefined,
    this.measurements().toArray().map(function(m) { return m.name(); }), undefined, interpolation.indexOf('step') == 0);

  var linesGroup = this._svg.selectAll('.lines');

  if (linesGroup.empty()) {
    var graph = this._svg.append('g')
      .attr('class', 'lines items')
      .attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');

    var selectedGroup = graph.append('g').attr('class', 'selected');
    graph.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }
  return this._drawLines(range, data, xScale);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @param {function} xScale D3 linear scale
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.StackedLinePlot.prototype._drawLines = function(range, data, xScale) {
  var Axis = epiviz.ui.charts.Axis;

  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  var interpolation = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.INTERPOLATION];

  var label = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.LABEL];

  /** @type {string} */
  var offset = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.OFFSET];

  /** @type {boolean} */
  var scaleToPercent = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.SCALE_TO_PERCENT];

  var self = this;

  var graph = this._svg.select('.lines');

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
  var indices = epiviz.utils.range(nEntries, firstGlobalIndex);

  if (indices.length == 0) { return []; }

  /** @type {epiviz.measurements.MeasurementHashtable} */
  var msSums = null;
  if (scaleToPercent) {
    msSums = new epiviz.measurements.MeasurementHashtable();

    this.measurements().foreach(function(m) {
      var sum = indices
        .map(function(i) { return data.get(m).getByGlobalIndex(i).value; })
        .reduce(function(v1, v2) { return v1 + v2; });
      msSums.put(m, sum);
    });
  }

  var valuesForIndex = function(index) {
    var ret = [];
    if (interpolation == 'step-before') {
      ret.push({ x: 0, y: 0 })
    }
    ret = ret.concat(self.measurements().toArray().map(function(m, i) {
      var div = scaleToPercent ? msSums.get(m) : 1;
      div = div || 1; // Prevent division by 0
      return { x: ret.length + i, y: data.get(m).getByGlobalIndex(index).value / div };
    }));

    if (interpolation == 'step-after') {
      ret.push({ x: ret.length, y: 0 });
    }
    return ret;
  };

  var lineItems;

  lineItems = indices.map(function(index) {
    var rowItem = data.first().value.getByGlobalIndex(index).rowItem;
    return new epiviz.ui.charts.ChartObject(
      sprintf('line-series-%s', index),
      rowItem.start(),
      rowItem.end(),
      valuesForIndex(index),
      index,
      self.measurements().toArray().map(function(m, i) { return [data.get(m).getByGlobalIndex(index)]; }), // valueItems one for each measurement
      self.measurements().toArray(), // measurements
      '');
  });

  var seriesAreas = indices.map(function(index) { return valuesForIndex(index); });
  var stack = d3.layout.stack().offset(offset);
  var layers = stack(seriesAreas);

  var yScale = d3.scale.linear()
    .domain([
      Math.min(0, d3.min(layers, function(layer) { return d3.min(layer, function(d) { return d.y0 + d.y; }); })),
      d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
    .range([this.height() - this.margins().sumAxis(Axis.Y), 0]);

  var area = d3.svg.area()
    .x(function(d) { return xScale(d.x); })
    .y0(function(d) { return yScale(d.y0); })
    .y1(function(d) { return yScale(d.y0 + d.y); })
    .interpolate(interpolation);

  var lines = graph
    .selectAll('.line-series')
    .data(lineItems, function(d) { return d.seriesIndex; });

  lines.enter()
    .insert('path', ':first-child').attr('class', 'line-series item')
    .attr('d', function(d, i) { return area(layers[i]); })
    .style('opacity', '0')
    .style('shape-rendering', 'auto')
    .style('fill', function(d, i) { return colors.get(d.seriesIndex); })
    .on('mouseover', function(d, i) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
    })
    .on('mouseout', function () {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    });

  lines
    .transition()
    .duration(500)
    .style('opacity', '0.7')
    .attr('d', function(d, i) { return area(layers[i]); })
    .style('fill', function(d, i) { return colors.get(d.seriesIndex); });

  lines
    .exit()
    .transition()
    .duration(500)
    .style('opacity', '0')
    .remove();

  // Draw legend
  var title = '';

  this._svg.selectAll('.chart-title').remove();
  var titleEntries = this._svg
    .selectAll('.chart-title')
    .data(indices)
    .enter()
    .append('text')
    .attr('class', 'chart-title')
    .attr('font-weight', 'bold')
    .attr('fill', function(index, i) { return colors.get(index); })
    .attr('y', self.margins().top() - 5)
    .text(function(index) { return data.first().value.getByGlobalIndex(index).rowItem.metadata(label); });

  var textLength = 0;
  var titleEntriesStartPosition = [];

  $('#' + this.id() + ' .chart-title')
    .each(function(i) {
      titleEntriesStartPosition.push(textLength);
      textLength += this.getBBox().width + 3;
    });

  titleEntries.attr('x', function(column, i) {
    return self.margins().left() + 3 + titleEntriesStartPosition[i];
  });

  return lineItems;
};

/**
 * @returns {Array.<string>}
 */
epiviz.plugins.charts.StackedLinePlot.prototype.colorLabels = function() {
  var labels = [];
  for (var i = 0; i < this.colors().size() && i < 20; ++i) {
    labels.push('Color ' + (i + 1));
  }
  return labels;
};
