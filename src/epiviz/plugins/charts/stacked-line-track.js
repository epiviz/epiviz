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
 * @param {?epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.StackedLineTrack.prototype.draw = function(range, data, slide, zoom) {

  var lastRange = this._lastRange;

  epiviz.ui.charts.Track.prototype.draw.call(this, range, data, slide, zoom);

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

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale.linear()
    .domain([range.start(), range.end()])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);

  this._clearAxes();
  this._drawAxes(xScale, undefined, 10);

  slide = slide || 0;
  var delta = slide * (this.width() - this.margins().sumAxis(Axis.X)) / range.width();
  var linesGroup = this._svg.selectAll('.lines');

  if (linesGroup.empty()) {
    var graph = this._svg.append('g')
      .attr('class', 'lines')
      .attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');
  }
  return this._drawLines(range, data, delta, zoom || 1, xScale);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @param {number} delta
 * @param {number} zoom
 * @param {function} xScale D3 linear scale
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.StackedLineTrack.prototype._drawLines = function(range, data, delta, zoom, xScale) {
  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  /** @type {number} */
  var maxPoints = this.customSettingsValues()[epiviz.plugins.charts.StackedLineTrackType.CustomSettings.MAX_POINTS];

  var interpolation = this.customSettingsValues()[epiviz.plugins.charts.StackedLineTrackType.CustomSettings.INTERPOLATION];

  var self = this;

  var invXScale = d3.scale.linear()
    .domain([0, this.width() - this.margins().sumAxis(epiviz.ui.charts.Axis.X)])
    .range([range.start(), range.end()]);
  var deltaInBp = invXScale(delta) - range.start();
  var extendedRange = epiviz.datatypes.GenomicRange.fromStartEnd(
    range.seqName(),
    Math.min(range.start(), range.start() + deltaInBp),
    Math.max(range.end(), range.end() + deltaInBp));

  var graph = this._svg.select('.lines');

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];

  var seriesAreas = [];

  this.measurements().foreach(function(m, i) {
    /** @type {epiviz.datatypes.GenomicDataMeasurementWrapper} */
    var series = data.get(m);

    /** @type {{index: ?number, length: number}} */
    var drawBoundaries = series.binarySearchStarts(extendedRange);
    if (drawBoundaries.length == 0) { return; }

    // Also take the last point that won't be displayed on the left side
    if (drawBoundaries.index > 0) {
      --drawBoundaries.index;
      ++drawBoundaries.length;
    }

    // And the first point on the right side that won't be displayed
    if (drawBoundaries.index + drawBoundaries.length < series.size()) {
      ++drawBoundaries.length;
    }

    var indices = null;
    if (maxPoints === null || drawBoundaries.length <= maxPoints) {
      indices = epiviz.utils.range(drawBoundaries.length, drawBoundaries.index);
    } else {
      // TODO: Use global indices, binSize = range.width() / maxPoints as a constant, and set the first index to be the same over time
      var step = drawBoundaries.length / maxPoints;

      indices = [];
      for (var j = 0; Math.round(j) < drawBoundaries.length; j += step) {
        indices.push(drawBoundaries.index + Math.round(j));
      }
    }

    for (var k = 0; k < indices.length; ++k) {
      var cell = series.get(indices[k]);
      items.push(new epiviz.ui.charts.ChartObject(sprintf('line_%s_%s', i, cell.globalIndex), cell.rowItem.start(), cell.rowItem.end(), [cell.value], i, [[cell]], [m], sprintf('item data-series-%s', i)));
    }

    var x = function(j) {
      /** @type {epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem} */
      var cell = series.get(j);
      return cell.rowItem.start();
    };

    var y = function(j) {
      /** @type {epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem} */
      var cell = series.get(j);
      return cell.value;
    };

    var areas = [];
    indices.forEach(function(j) { areas.push({x: x(j), y: y(j)}); });
    seriesAreas.push(areas);
  });

  var stack = d3.layout.stack().offset('wiggle');
  var layers = stack(seriesAreas);

  var yScale = d3.scale.linear()
    .domain([0, d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
    .range([this.height() - this.margins().sumAxis(epiviz.ui.charts.Axis.Y), 0]);

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

