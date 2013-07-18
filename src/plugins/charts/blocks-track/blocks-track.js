/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 11/5/12
 * Time: 1:39 PM
 * To change this template use File | Settings | File Templates.
 */

BlocksTrack.prototype = new GenomeTrack();
BlocksTrack.prototype.constructor = BlocksTrack;

// Inherit SelectableChart (multiple inheritance)
Inheritance.add(BlocksTrack, SelectableChart);

function BlocksTrack() {
  // Call the constructors of superclasses:
  SelectableChart.call(this);
}

BlocksTrack.prototype.initialize = function(parentId, width, height, margin, workspaceData) {
  // Call super
  GenomeTrack.prototype.initialize.call(this, parentId, width, height, margin, workspaceData);

  SelectableChart.prototype.initialize.call(this);

  this._measurements = workspaceData[1];

  this._addStyles();

  var bg = this._svg
    .append('rect')
    .attr('class', 'chart-background')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', '#ffffff');

  var measurementNames = this.getChartHandler().getDataTypeHandler().getMeasurementsStore().getMeasurements();
  if (measurementNames) {
    this._drawTitle(measurementNames);
  }

  this._data = null;

  EventManager.instance.addEventListener(EventManager.eventTypes.BEGIN_UPDATE_CHART_DATA, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_DATA_UPDATED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, this);
};

BlocksTrack.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style = sprintf('%s .items { shape-rendering: crispEdges; fill-opacity: 0.6; stroke: #555555; stroke-opacity: 0.5; stroke-width: 1; }\n', svgId) +
    sprintf('%s .items .selected { stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.7; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .items .hovered { stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.7; fill-opacity: 1; }\n', svgId);

  var jSvg = this._jParent.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

BlocksTrack.prototype.draw = function(data, slide, zoom){

  BaseChart.prototype.draw.call(this, data);

  var d;
  if (data) {
    d = data;
    this._data = data;
  } else {
    if (!this._data) {
      return;
    }

    d = this._data;
  }

  this._svg
    .attr('width', this._width - this._parentMargins.x)
    .attr('height', this._height - this._parentMargins.y);

  this._drawBlocks(d, slide, zoom);

  this.refreshSelection();
};

BlocksTrack.prototype._drawBlocks = function(d, slide, zoom) {
  var start = d.start;
  var end = d.end;
  var xScale = d3.scale.linear()
    .domain([start, end])
    .range([0, this._width-2*this._margin]);
  var delta = (!slide) ? 0 : slide * (this._width - 2*this._margin) / (end - start);

  this._svg.selectAll('.xAxis').remove();
  this._svg.selectAll('.yAxis').remove();
  this._drawAxes(xScale, null, 10, 5);

  var self = this;
  var nSeries = this._measurements.length;
  var data = [];

  var i, j;
  for (i = 0; i < nSeries; ++i) {
    var series = d.data[this._measurements[i]];
    for (j = 0; j < series.start.length; ++j) {
      var classes = sprintf('item data-series-%s', i);
      var s = Math.floor(series.start[j] / this._binSize);
      var e = Math.floor(series.end[j] / this._binSize);

      for (var p = s; p <= e; ++p) {
        classes += sprintf(' bin-%s', p);
      }

      data.push({
        start: series.start[j],
        end: series.end[j],
        seriesIndex: i,
        classes: classes
      });
    }
  }

  var items = this._svg.select('.items');
  var selected = items.select('.selected');

  if (items.empty()) {

    var defs = this._svg.select('defs');
    defs.append('clipPath')
      .attr('id', 'clip-' + this._id)
      .append('rect')
      .attr('class', 'clip-path-rect');

    items = this._svg.append('g')
      .attr('class', 'items')
      .attr('transform', 'translate(' + this._margin + ', ' + this._margin + ')')
      .attr('id', this._id + '-gene-content')
      .attr('clip-path', 'url(#clip-' + this._id + ')');

    selected = items.append('g').attr('class', 'selected');
    items.append('g').attr('class', 'hovered');
    selected.append('g').attr('class', 'hovered');
  }

  this._svg.select('.clip-path-rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', this._width - 2*this._margin)
    .attr('height', this._height - 2*this._margin);

  var selection = items.selectAll('.item')
    .data(data, function(d) { return sprintf('b-%s-%s-%s', d.seriesIndex, d.start, d.end); });

  selection
    .enter()
    .insert('rect', ':first-child')
    .attr('class', function(d) { return d.classes; })
    .style('fill', function(d) { return self._colors[d.seriesIndex]; })
    .attr('x', function(d) {
      var coef = zoom || 1;
      return xScale(d.start) / coef + delta;
    })
    .attr('width', function(d) {
      var coef = zoom || 1;
      return coef * (xScale(d.end) - xScale(d.start));
    })
    .on('mouseout', function (d) {
      EventManager.instance.blockUnhovered();
    })
    .on('mouseover', function (d) {
      var o = { start: d.start, end: d.end };
      EventManager.instance.blockHovered(o);
    })
    .on('click', function(d) {
      var o = { start: d.start, end: d.end };
      EventManager.instance.blockDeselected();
      EventManager.instance.blockSelected(o);
      d3.event.stopPropagation();
    });

  selection
    .attr('class', function(d) { return d.classes; })
    .attr('height', self._height - 2 * self._margin)
    .attr('y', 0)
    .transition()
    .duration(500)
    .attr('x', function(d) { return xScale(d.start); })
    .attr('width', function(d) { return xScale(d.end) - xScale(d.start); });

  selection
    .exit()
    .transition()
    .duration(500)
    .attr('x', function(d) { return xScale(d.start); })
    .remove();
};


BlocksTrack.prototype.onMeasurementsLoaded = function (event) {
  this._drawTitle(event.detail.blockMeasurements);
};

BlocksTrack.prototype.onBeginUpdateChartData = function(event) {
  if (event.detail.chartId == this._id) {
    this._addLoader();
  }
};

BlocksTrack.prototype.onChartDataUpdated = function(event) {
  if (event.detail.chartId != this._id) {
    return;
  }

  this._removeLoader();

  var data = event.detail.data.blockData;
  var lastLocation = event.detail.lastLocation;

  if (data.chr != lastLocation.chr
    || data.start != lastLocation.start
    || data.end != lastLocation.end) {
    return;
  }

  var slide = 0;
  if (this.lastLocation &&
    data.chr == this.lastLocation.chr &&
    data.end - data.start == this.lastLocation.end - this.lastLocation.start &&
    Math.abs(data.start - this.lastLocation.start) < data.end - data.start) {
    slide = data.start - this.lastLocation.start;
  }

  var zoom = 0;
  if (this.lastLocation &&
    data.chr == this.lastLocation.chr &&
    data.start == this.lastLocation.start && data.end != this.lastLocation.end) {

    zoom = (this.lastLocation.end - this.lastLocation.start) / (data.end - data.start);
  }

  this.lastLocation = lastLocation;

  this.draw(data, slide, zoom);
};

BlocksTrack.prototype._findItems = function() {
  return this._jParent.find('> svg > .items');
};

BlocksTrack.prototype.setColors = function(colors) {
  BaseChart.prototype.setColors.call(this, colors);

  var items = this._svg.selectAll('.item');
  items.style('fill', function(d) { return colors[d.seriesIndex]; });
};
