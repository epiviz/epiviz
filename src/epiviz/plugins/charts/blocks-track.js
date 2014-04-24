/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/16/13
 * Time: 9:35 AM
 */

goog.provide('epiviz.plugins.charts.BlocksTrack');

/**
 * @param id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.BlocksTrack = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.BlocksTrack.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Track.prototype);
epiviz.plugins.charts.BlocksTrack.constructor = epiviz.plugins.charts.BlocksTrack;

/**
 * @protected
 */
epiviz.plugins.charts.BlocksTrack.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);
};

/**
 * @protected
 */
epiviz.plugins.charts.BlocksTrack.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style = sprintf('%s .items { shape-rendering: crispEdges; fill-opacity: 0.6; stroke: #555555; stroke-opacity: 0.5; stroke-width: 1; }\n', svgId) +
    sprintf('%s .items .selected { stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.7; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .items .hovered { stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.7; fill-opacity: 1; }\n', svgId);

  var jSvg = this._container.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 */
epiviz.plugins.charts.BlocksTrack.prototype.draw = function(range, data, slide, zoom) {

  epiviz.ui.charts.Track.prototype.draw.call(this, range, data, slide, zoom);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  return this._drawBlocks(range, data, slide || 0, zoom || 1);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @param {number} slide
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.BlocksTrack.prototype._drawBlocks = function(range, data, slide, zoom) {
  var Axis = epiviz.ui.charts.Axis;

  /** @type {number} */
  var start = range.start();

  /** @type {number} */
  var end = range.end();

  /** @type {number} */
  var width = this.width();

  /** @type {number} */
  var height = this.height();

  /** @type {epiviz.ui.charts.Margins} */
  var margins = this.margins();

  /** @type {epiviz.measurements.MeasurementSet} */
  var measurements = this.measurements();

  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  var minBlockDistance = this._customSettingsValues[epiviz.plugins.charts.BlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE];

  var xScale = d3.scale.linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X)]);
  var delta = slide * (width - margins.sumAxis(Axis.X)) / (end - start);

  this._clearAxes();
  this._drawAxes(xScale, null, 10, 5);

  var self = this;
  /** @type {Array.<epiviz.ui.charts.UiObject>} */
  var blocks = [];

  var i = 0;

  measurements.foreach(function(m) {
    /** @type {epiviz.datatypes.GenomicDataMeasurementWrapper} */
    var series = data.get(m);
    var seriesBlocks = [];

    for (var j = 0; j < series.size(); ++j) {
      /** @type {epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem} */
      var cell = series.get(j);

      if (cell.rowItem.start() > range.end() || cell.rowItem.end() < range.start()) { continue; }

      var classes = sprintf('item data-series-%s', i);


      if (minBlockDistance !== null && seriesBlocks.length > 0) {
        var lastBlock = seriesBlocks[seriesBlocks.length - 1];
        var start = xScale(cell.rowItem.start());
        var lastEnd = xScale(lastBlock.end);

        if (start - lastEnd < minBlockDistance) {
          lastBlock.end = Math.max(lastBlock.end, cell.rowItem.end());
          lastBlock.valueItems[0].push(cell);
          lastBlock.id = sprintf('b-%s-%s-%s', i, lastBlock.start, lastBlock.end);
          continue;
        }
      }

      seriesBlocks.push(new epiviz.ui.charts.UiObject(
        sprintf('b-%s-%s-%s', i, cell.rowItem.start(), cell.rowItem.end()),
        cell.rowItem.start(),
        cell.rowItem.end(),
        null,
        i, // seriesIndex
        [[cell]], // valueItems
        [m], // measurements
        classes));
    }

    blocks = blocks.concat(seriesBlocks);
    ++i;
  });

  var items = this._svg.select('.items');
  var selected = items.select('.selected');
  var clipPath = this._svg.select('#clip-' + this._id);

  if (items.empty()) {
    if (clipPath.empty()) {
      this._svg.select('defs')
        .append('clipPath')
        .attr('id', 'clip-' + this._id)
        .append('rect')
        .attr('class', 'clip-path-rect');
    }

    items = this._svg.append('g')
      .attr('class', 'items')
      .attr('id', this._id + '-gene-content')
      .attr('clip-path', 'url(#clip-' + this._id + ')');

    selected = items.append('g').attr('class', 'selected');
    items.append('g').attr('class', 'hovered');
    selected.append('g').attr('class', 'hovered');
  }

  items.attr('transform', 'translate(' + margins.left() + ', ' + margins.top() + ')');

  this._svg.select('.clip-path-rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width - margins.sumAxis(Axis.X))
    .attr('height', height - margins.sumAxis(Axis.Y));

  var selection = items.selectAll('.item')
    .data(blocks, function(b) { return b.id; });

  selection
    .enter()
    .insert('rect', ':first-child')
    .attr('class', function(b) { return b.cssClasses; })
    .style('fill', function(b) { return colors.get(b.seriesIndex); })
    .attr('x', function(b) {
      return xScale(b.start) / zoom + delta;
    })
    .attr('width', function(b) {
      // We're using b.end + 1 since b.end is the index of the last covered bp
      return zoom * (xScale(b.end + 1) - xScale(b.start));
    })
    .on('mouseout', function (b) {
      self._unhover.notify();
    })
    .on('mouseover', function (b) {
      self._hover.notify(b);
    })
    .on('click', function(b) {
      self._deselect.notify();
      self._select.notify(b);
      d3.event.stopPropagation();
    });

  selection
    .attr('class', function(b) { return b.cssClasses; })
    .attr('height', height - margins.sumAxis(Axis.Y))
    .attr('y', 0)
    .transition()
    .duration(500)
    .attr('x', function(b) { return xScale(b.start); })
    .attr('width', function(b) { return xScale(b.end + 1) - xScale(b.start); });

  selection
    .exit()
    .transition()
    .duration(500)
    .attr('x', function(b) { return xScale(b.start); })
    .remove();

  return blocks;
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.BlocksTrack.prototype.chartTypeName = function() { return 'epiviz.plugins.charts.BlocksTrack'; };

/**
 * @param {Array.<{name: string, color: string}>} colorMap
 */
epiviz.plugins.charts.BlocksTrack.prototype.setColorMap = function(colorMap) {
  this._container.find('.items').remove();
  epiviz.ui.charts.Chart.prototype.setColorMap.call(this, colorMap);
};

