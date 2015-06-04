/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/8/2014
 * Time: 1:32 PM
 */


goog.provide('epiviz.plugins.charts.StackedLineTrack');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.StackedLineTrack = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.StackedLineTrack.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Track.prototype);
epiviz.plugins.charts.StackedLineTrack.constructor = epiviz.plugins.charts.StackedLineTrack;

/**
 * @protected
 */
epiviz.plugins.charts.StackedLineTrack.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.StackedLineTrack.prototype.draw = function(range, data, slide, zoom) {
  epiviz.ui.charts.Track.prototype.draw.call(this, range, data, slide, zoom);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;
  slide = slide || this._slide;
  zoom = zoom || this._zoom;
  this._slide = 0;
  this._zoom = 1;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  var Axis = epiviz.ui.charts.Axis;
  slide = slide || 0;
  var delta = slide * (this.width() - this.margins().sumAxis(Axis.X)) / range.width();
  return this._drawLines(range, data, delta, zoom || 1);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} delta
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.StackedLineTrack.prototype._drawLines = function(range, data, delta, zoom) {
  var Axis = epiviz.ui.charts.Axis;

  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  /** @type {number} */
  var step = this.customSettingsValues()[epiviz.plugins.charts.StackedLineTrackType.CustomSettings.STEP];

  /** @type {string} */
  var interpolation = this.customSettingsValues()[epiviz.plugins.charts.StackedLineTrackType.CustomSettings.INTERPOLATION];

  /** @type {string} */
  var offset = this.customSettingsValues()[epiviz.plugins.charts.StackedLineTrackType.CustomSettings.OFFSET];

  var self = this;

  var invXScale = d3.scale.linear()
    .domain([0, this.width() - this.margins().sumAxis(Axis.X)])
    .range([range.start(), range.end()]);
  var deltaInBp = invXScale(delta) - range.start();

  // TODO: Re-introduce extendedRange (this is what we need to draw to make the track look continuous on navigation transition)
  var extendedRange = epiviz.datatypes.GenomicRange.fromStartEnd(
    range.seqName(),
    Math.min(range.start(), range.start() + deltaInBp),
    Math.max(range.end(), range.end() + deltaInBp));

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];

  var seriesAreas = [];

  var firstGlobalIndex = data.firstSeries().globalStartIndex();
  var lastGlobalIndex = data.firstSeries().globalEndIndex();

  data.foreach(function(measurement, series) {
    var firstIndex = series.globalStartIndex();
    var lastIndex = series.globalEndIndex();

    if (firstIndex > firstGlobalIndex) { firstGlobalIndex = firstIndex; }
    if (lastIndex < lastGlobalIndex) { lastGlobalIndex = lastIndex; }
  });

  firstGlobalIndex = Math.ceil(firstGlobalIndex / step) * step;
  lastGlobalIndex = Math.floor(lastGlobalIndex / step) * step;

  // TODO: Continue getting the labels on the x axis
  /** @type {Array.<string>} */
  var labels;

  data.foreach(function(m, series, i) {
    var indices = epiviz.utils.range((lastGlobalIndex - firstGlobalIndex) / step)
      .map(function(i) { return i * step + firstGlobalIndex; })
      .filter(function(globalIndex) {
        return series.getByGlobalIndex(globalIndex);
      });

    for (var k = 0; k < indices.length; ++k) {
      var cell = series.getByGlobalIndex(indices[k]);
      items.push(new epiviz.ui.charts.ChartObject(sprintf('line_%s_%s', i, cell.globalIndex), cell.rowItem.start(), cell.rowItem.end(), [cell.value], i, [[cell]], [m], sprintf('item data-series-%s', i)));
    }

    var x = function(j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.getByGlobalIndex(j);
      return cell.rowItem.start();
    };

    var y = function(j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.getByGlobalIndex(j);
      return cell.value;
    };

    var areas = [];
    indices.forEach(function(j) { areas.push({x: x(j), y: y(j)}); });
    seriesAreas.push(areas);
    if (!labels) {
      labels = [];
      indices.forEach(function(j) {
        /** @type {epiviz.datatypes.GenomicData.ValueItem} */
        var cell = series.getByGlobalIndex(j);
        labels.push(cell.rowItem.metadata('bacteria')); // TODO: Change to something more generic
      });
    }
  });

  var xScale = d3.scale.linear()
    .domain([range.start(), range.end()])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);

  this._clearAxes();

  this._drawAxes(xScale, undefined, 10);
  // TODO: Add option for labels on tracks
  /* this._drawAxes(
    xScale, undefined, // scales
    labels.length, undefined, // ticks
    undefined, undefined, undefined, undefined, undefined, undefined, labels, undefined);*/

  var graph = this._svg.select('.lines');
  if (graph.empty()) {
    graph = this._svg.append('g')
      .attr('class', 'lines')
      .attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');
  }

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
    .selectAll('path')
    .data(layers);

  lines.enter()
    .append('path')
    .attr('d', area)
    .style('shape-rendering', 'auto')
    .style('stroke-width', '0')
    .style('fill', function(d, i) { return colors.get(i); })
    .on('mouseover', function() { self._captureMouseHover(); })
    .on('mousemove', function() { self._captureMouseHover(); })
    .on('mouseout', function () { self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id())); });

  lines
    .attr('d', area)
    .style('fill', function(d, i) { return colors.get(i); })
    .attr('transform', 'translate(' + (+delta) + ')')
    .transition()
    .duration(500)
    .attr('transform', 'translate(' + (0) + ')');

  return items;
};

