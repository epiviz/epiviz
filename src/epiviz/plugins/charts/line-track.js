/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 9:30 AM
 */

goog.provide('epiviz.plugins.charts.LineTrack');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.LineTrack = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.LineTrack.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Track.prototype);
epiviz.plugins.charts.LineTrack.constructor = epiviz.plugins.charts.LineTrack;

/**
 * @protected
 */
epiviz.plugins.charts.LineTrack.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 */
epiviz.plugins.charts.LineTrack.prototype.draw = function(range, data, slide, zoom) {

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
  var minY = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.Y_MIN];
  var maxY = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.Y_MAX];

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
    .domain([range.start(), range.end()])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);
  var yScale = d3.scale.linear()
    .domain([minY, maxY])
    .range([this.height() - this.margins().sumAxis(Axis.Y), 0]);

  this._clearAxes();
  this._drawAxes(xScale, yScale, 10, 5);

  slide = slide || 0;
  var delta = slide * (this.width() - this.margins().sumAxis(Axis.X)) / range.width();
  var linesGroup = this._svg.selectAll('.lines');

  if (linesGroup.empty()) {
    var graph = this._svg.append('g')
      .attr('class', 'lines')
      .attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');
    this.measurements().foreach(function(m, i) {
      graph.append('g').attr('class', 'line-series-index-' + i);
      graph.append('g').attr('class', 'point-series-index-' + i);
    });
  }
  return this._drawLines(range, data, delta, zoom || 1, xScale, yScale);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @param {number} delta
 * @param {number} zoom
 * @param {function} xScale D3 linear scale
 * @param {function} yScale D3 linear scale
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.LineTrack.prototype._drawLines = function(range, data, delta, zoom, xScale, yScale) {

  /** @type {epiviz.ui.charts.Margins} */
  var margins = this.margins();

  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  /** @type {number} */
  var maxPoints = this._customSettingsValues[epiviz.plugins.charts.LineTrackType.CustomSettings.MAX_POINTS];

  /** @type {boolean} */
  var showPoints = this._customSettingsValues[epiviz.plugins.charts.LineTrackType.CustomSettings.SHOW_POINTS];

  /** @type {boolean} */
  var showLines = this._customSettingsValues[epiviz.plugins.charts.LineTrackType.CustomSettings.SHOW_LINES];

  /** @type {number} */
  var pointRadius = this._customSettingsValues[epiviz.plugins.charts.LineTrackType.CustomSettings.POINT_RADIUS];

  /** @type {number} */
  var lineThickness = this._customSettingsValues[epiviz.plugins.charts.LineTrackType.CustomSettings.LINE_THICKNESS];

  var interpolation = this._customSettingsValues[epiviz.plugins.charts.LineTrackType.CustomSettings.INTERPOLATION];

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

  /** @type {Array.<epiviz.ui.charts.UiObject>} */
  var items = [];

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
      var step = drawBoundaries.length / maxPoints;

      indices = [];
      for (var j = 0; Math.round(j) < drawBoundaries.length; j += step) {
        indices.push(drawBoundaries.index + Math.round(j));
      }
    }

    for (var k = 0; k < indices.length; ++k) {
      var cell = series.get(indices[k]);
      items.push(new epiviz.ui.charts.UiObject(sprintf('line_%s_%s', i, cell.globalIndex), cell.rowItem.start(), cell.rowItem.end(), [cell.value], i, [[cell]], [m], sprintf('item data-series-%s', i)));
    }

    var x = function(j) {
      /** @type {epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem} */
      var cell = series.get(j);
      return xScale(cell.rowItem.start());
    };

    var y = function(j) {
      /** @type {epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem} */
      var cell = series.get(j);
      return yScale(cell.value);
    };

    if (showLines) {
      var line = d3.svg.line()
        .x(x).y(y)
        .interpolate(interpolation);

      var lines = graph.select('.line-series-index-' + i)
        .selectAll('path')
        .data([indices]);

      lines.enter()
        .append('path')
        .attr('d', line)
        .style('shape-rendering', 'auto')
        .style('stroke-opacity', '0.7')
        .on('mouseover', function() { self._captureMouseHover(); })
        .on('mousemove', function() { self._captureMouseHover(); })
        .on('mouseout', function () { self._unhover.notify(); });

      lines
        .attr('d', line)
        .style('stroke', colors.get(i))
        .style('stroke-width', lineThickness)
        .attr('transform', 'translate(' + (+delta) + ')')
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + (0) + ')');
    } else {
      graph.select('.line-series-index-' + i)
        .selectAll('path').remove();
    }

    graph.select('.point-series-index-' + i)
      .selectAll('circle').remove();
    if (showPoints) {
      var points = graph.select('.point-series-index-' + i)
        .selectAll('circle')
        .data(indices);
      points.enter()
        .append('circle')
        .attr('class', 'point-series-index-' + i)
        .attr('r', pointRadius)
        .attr('cx', x)
        .attr('cy', y)
        .attr('fill', 'none')
        .attr('stroke', colors.get(i))
        .attr('transform', 'translate(' + (+delta) + ')')
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + (0) + ')');

      points
        .on('mouseover', function() { self._captureMouseHover(); })
        .on('mousemove', function() { self._captureMouseHover(); })
        .on('mouseout', function () { self._unhover.notify(); });

      points.exit()
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove();
    }
  });

  return items;
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.LineTrack.prototype.chartTypeName = function() { return 'epiviz.plugins.charts.LineTrack'; };
