/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/18/13
 * Time: 7:33 PM
 */

goog.provide('epiviz.plugins.charts.GenesTrack');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.GenesTrack = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.GenesTrack.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Track.prototype);
epiviz.plugins.charts.GenesTrack.constructor = epiviz.plugins.charts.GenesTrack;

/**
 * @protected
 */
epiviz.plugins.charts.GenesTrack.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);

  this._svg.classed('genes-track', true);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.GenesTrack.prototype.draw = function(range, data, slide, zoom) {
  epiviz.ui.charts.Track.prototype.draw.call(this, range, data, slide, zoom);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  slide = slide || this._slide;
  zoom = zoom || this._zoom;
  this._slide = 0;
  this._zoom = 1;

  return this._drawGenes(range, data, slide || 0, zoom || 1);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} slide
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.GenesTrack.prototype._drawGenes = function(range, data, slide, zoom) {
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

  var xScale = d3.scale.linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X)]);
  var delta = slide * (width - margins.sumAxis(Axis.X)) / (end - start);

  this._clearAxes();
  this._drawAxes(xScale, null, 10, 5);

  var self = this;
  /** @type {epiviz.datatypes.MeasurementGenomicData} */
  var series = data.firstSeries();

  var indices = epiviz.utils.range(series.size());

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var dataItems = indices
    .map(function(i) {
    var cell = series.get(i);
    var item = cell.rowItem;
    var classes = sprintf('item gene-%s', item.metadata('gene'));

    return new epiviz.ui.charts.ChartObject(
      item.metadata('gene'),
      item.start(),
      item.end(),
      null,
      0,
      [[cell]],
      [series.measurement()],
      classes);
  });

  if (zoom) {
    this._svg.select('.items').remove();
    this._svg.select('defs').select('#clip-' + this.id()).remove();
  }

  var items = this._svg.select('.items');
  var selected = items.select('.selected');

  if (items.empty()) {
    var defs = this._svg.select('defs');
    defs.append('clipPath')
      .attr('id', 'clip-' + this.id())
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width - margins.sumAxis(Axis.X))
      .attr('height', height - margins.sumAxis(Axis.Y));

    items = this._svg.append('g')
      .attr('class', 'items')
      .attr('transform', 'translate(' + margins.left() + ', ' + margins.top() + ')')
      .attr('id', this.id() + '-gene-content')
      .attr('clip-path', 'url(#clip-' + this.id() + ')');

    selected = items.append('g').attr('class', 'selected');
    items.append('g').attr('class', 'hovered');
    selected.append('g').attr('class', 'hovered');
  }

  var selection = items.selectAll('.item')
    .data(dataItems, function(d) { return d.id; });

  selection
    .enter()
    .insert('g', ':first-child')
    .on('mouseout', function () {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .on('mouseover', function (d) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
    })
    .on('click', function(d) {
      self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
      d3.event.stopPropagation();
    })
    .attr('transform', 'translate(' + (delta) + ', 0) scale(1, 1)')
    .each(function(d) {
      self._drawGene(this, d, xScale);
    });

  if (delta) {
    selection.each(function(d) {
      self._translateGene(this, d, delta);
    });
  }

  selection
    .exit()
    .transition()
    .duration(500)
    .style('opacity', 0)
    .remove();

  return dataItems;
};

/**
 * @param elem
 * @param {epiviz.ui.charts.ChartObject} d
 * @param delta
 * @private
 */
epiviz.plugins.charts.GenesTrack.prototype._translateGene = function(elem, d, delta) {
  var gene = d3.select(elem);
  var transform = gene.attr('transform');
  var translateRx = new RegExp('translate\\\([\\\d\\\.\\\-]+[\\\,\\\s]+[\\\d\\\.\\\-]+\\\)', 'g');
  var numberRx = new RegExp('[\\\d\\\.\\\-]+', 'g');
  var translate = transform.match(translateRx)[0];
  var x = parseFloat(translate.match(numberRx)[0]);

  transform = transform.replace(translateRx, 'translate(' + (x-delta) + ', 0)');
  gene
    .transition()
    .duration(500)
    .attr('transform', transform);
};

/**
 * @param elem
 * @param {epiviz.ui.charts.ChartObject} d
 * @param {function(number): number} xScale
 * @private
 */
epiviz.plugins.charts.GenesTrack.prototype._drawGene = function(elem, d, xScale) {
  var Axis = epiviz.ui.charts.Axis;
  var self = this;
  var rowItem = d.valueItems[0][0].rowItem;
  var geneStart = xScale(d.start);
  var geneEnd = xScale(d.end);
  var or = (rowItem.strand() == '+') ? 1 : -1;
  var offset = - or * (this.height() - this.margins().sumAxis(Axis.Y)) * 0.25;

  var exonStarts = rowItem.metadata('exon_starts').split(',').map(function(s) { return parseInt(s); });
  var exonEnds = rowItem.metadata('exon_ends').split(',').map(function(s) { return parseInt(s); });
  var exonCount = exonStarts.length;
  var exonIndices = d3.range(0, exonCount);

  var geneHeight = this.height() * 0.08;
  var exonHeight = this.height() * 0.16;
  var h = geneHeight * Math.sqrt(3) * 0.5;

  var gene = d3.select(elem);
  gene.attr('class', d.cssClasses);

  gene.append('polygon')
    .attr('class', 'gene-body')
    .style('fill', this.colors().get(0))
    .attr('points', function() {
      var xs = null, ys;
      var y0 = (self.height() - self.margins().sumAxis(Axis.Y) - geneHeight) * 0.5 + offset;
      ys = [y0, y0, y0 + geneHeight * 0.5, y0 + geneHeight, y0 + geneHeight];
      if (rowItem.strand() == '+') {
        xs = [geneStart, geneEnd, geneEnd + h, geneEnd, geneStart];
      } else {
        xs = [geneEnd, geneStart, geneStart - h, geneStart, geneEnd];
      }

      return sprintf('%s,%s %s,%s %s,%s %s,%s %s,%s', xs[0], ys[0], xs[1], ys[1], xs[2], ys[2], xs[3], ys[3], xs[4], ys[4]);
    });

  var exons = gene.append('g')
    .attr('class', 'exons')
    .style('fill', this.colors().get(1));

  exons.selectAll('rect')
    .data(exonIndices)
    .enter()
    .append('rect')
    .attr('x', function(j) {
      return xScale(exonStarts[j]);
    })
    .attr('y', (self.height() - exonHeight - self.margins().sumAxis(Axis.Y)) * 0.5 + offset)
    .attr('width', function(j) {
      return xScale(exonEnds[j]) - xScale(exonStarts[j]);
    })
    .attr('height', exonHeight);

  gene
    .append('text')
    .attr('class', 'gene-name')
    .attr('x', geneStart + 2)
    .attr('y', (self.height() - self.margins().sumAxis(Axis.Y)) * 0.5 + offset - or * (geneHeight + 2))
    .style('dominant-baseline', 'central')
    .text(d.id); //Gene
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.GenesTrack.prototype.colorLabels = function() {
  return ['Genes', 'Exons'];
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
epiviz.plugins.charts.GenesTrack.prototype._drawAxes = function(xScale, yScale, xTicks, yTicks, svg, width, height, margins) {
  epiviz.ui.charts.Track.prototype._drawAxes.call(this, xScale, yScale, xTicks, yTicks, svg, width, height, margins);

  var Axis = epiviz.ui.charts.Axis;
  var axesGroup = this._svg.select('.axes');
  axesGroup
    .append('g')
    .attr('class', 'xAxis')
    .append('line')
    .attr('x1', this.margins().left())
    .attr('x2', this.width() - this.margins().left())
    .attr('y1', this.margins().top() + (this.height() - this.margins().sumAxis(Axis.Y)) * 0.5)
    .attr('y2', this.margins().top() + (this.height() - this.margins().sumAxis(Axis.Y)) * 0.5)
    .style('stroke', '#555555')
    .style('shape-rendering', 'crispEdges');
};
