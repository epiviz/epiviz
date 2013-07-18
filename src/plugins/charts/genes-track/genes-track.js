/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/3/13
 * Time: 1:39 PM
 * To change this template use File | Settings | File Templates.
 */

// Inherit GenomeTrack
GenesTrack.prototype = new GenomeTrack();

// Inherit SelectableChart (multiple inheritance)
Inheritance.add(GenesTrack, SelectableChart);

GenesTrack.prototype.constructor = GenesTrack;

function GenesTrack() {
  // Call the constructors of superclasses:
  SelectableChart.call(this);

  this._data = null;
  this._showTextThreshold = 20;
}

GenesTrack.prototype.initialize = function(parentId, width, height, margin, workspaceData) {
  // Call super
  GenomeTrack.prototype.initialize.call(this, parentId, width, height, margin, workspaceData);

  SelectableChart.prototype.initialize.call(this);

  this._addStyles();

  var measurementNames = this.getChartHandler().getDataTypeHandler().getMeasurementsStore().getMeasurements();
  if (measurementNames) {
    this._drawTitle(measurementNames);
  }

  this._data = null;

  EventManager.instance.addEventListener(EventManager.eventTypes.BEGIN_UPDATE_CHART_DATA, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_DATA_UPDATED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, this);
};

GenesTrack.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style = sprintf('%s .items { shape-rendering: auto; /* fill: %s; */ stroke: #555555; fill-opacity: 0.6; }\n', svgId, DataSeriesPalette.colors[5]) +
    sprintf('%s .exons { /* fill: %s; */ stroke: none; }\n', svgId, DataSeriesPalette.colors[0]) +
    sprintf('%s .gene-name { font-weight: bold; font-size: 12; fill: #000000; stroke: none; fill-opacity: 0; }\n', svgId) +
    sprintf('%s .selected { /*filter: url(#%s-dropshadow);*/ fill-opacity: 1; stroke: #555555; }\n', svgId, this._id) +
    sprintf('%s .selected .gene-body { /* fill: #ffc600; */ stroke: %s; stroke-width: 3; stroke-opacity: 0.7; }\n', svgId, DataSeriesPalette.colors[0]) +
    sprintf('%s .hovered { /*filter: url(#%s-dropshadow);*/ fill-opacity: 1; stroke: #555555; }\n', svgId, this._id) +
    sprintf('%s .hovered .gene-body { /* fill: #ffc600; */ stroke: %s; stroke-width: 3; stroke-opacity: 0.7; }\n', svgId, DataSeriesPalette.colors[0]) +
    sprintf('%s .hovered .gene-name { fill-opacity: 1; }\n', svgId) +
    sprintf('%s .selected .gene-name { fill-opacity: 1; }\n', svgId);

  var jSvg = this._jParent.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

GenesTrack.prototype.draw = function(data, slide, zoom, force) {

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

  this._drawGenes(d, slide, zoom, force);

  this.refreshSelection();
};

GenesTrack.prototype._drawGenes = function(d, slide, zoom, force) {
  var start = d.start;
  var end = d.end;
  var xScale = d3.scale.linear()
    .domain([start, end])
    .range([0, this._width-2*this._margin]);
  var delta = (!slide) ? 0 : slide * (this._width - 2*this._margin) / (end - start);

  this._svg.selectAll('.xAxis').remove();
  this._svg.selectAll('.yAxis').remove();
  this._drawAxes(xScale, null, 10, 5);
  var axesGroup = this._svg.select('.axes');
  axesGroup
    .append('g')
    .attr('class', 'xAxis')
    .append('line')
    .attr('x1', this._margin)
    .attr('x2', this._width - this._margin)
    .attr('y1', this._height / 2)
    .attr('y2', this._height / 2)
    .style('stroke', '#555555')
    .style('shape-rendering', 'crispEdges');

  var self = this;
  var indices = d3.range(0, d['row_count']);

  var data = indices.map(function (i) {
    var classes = sprintf('item gene-%s', d.data.gene[i]);
    var s = Math.floor(d.data.start[i] / self._binSize);
    var e = Math.floor(d.data.end[i] / self._binSize);

    for (var j = s; j <= e; ++j) {
      classes += sprintf(' bin-%s', j);
    }
    return {
      index: i,
      start: d['data']['start'][i],
      end: d['data']['end'][i],
      strand: d['data']['strand'][i],
      exonStarts: d['data']['exon_starts'][i],
      exonEnds: d['data']['exon_ends'][i],
      gene: d['data']['gene'][i],
      fill: DataSeriesPalette.colors[5],
      classes: classes
    }
  });

  if (zoom || force) {
    this._svg.select('.items').remove();
    this._svg.select('defs').select('#clip-' + this._id).remove();
  }

  var items = this._svg.select('.items');
  var selected = items.select('.selected');

  if (items.empty()) {

    var defs = this._svg.select('defs');
    defs.append('clipPath')
      .attr('id', 'clip-' + this._id)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this._width - 2*this._margin)
      .attr('height', this._height - 2*this._margin);

    items = this._svg.append('g')
      .attr('class', 'items')
      .attr('transform', 'translate(' + this._margin + ', ' + this._margin + ')')
      .attr('id', this._id + '-gene-content')
      .attr('clip-path', 'url(#clip-' + this._id + ')');

    selected = items.append('g').attr('class', 'selected');
    items.append('g').attr('class', 'hovered');
    selected.append('g').attr('class', 'hovered');
  }

  var selection = items.selectAll('.item')
    .data(data, function(d) { return d.gene; });

  selection
    .enter()
    .insert('g', ':first-child')
    .on('mouseout', function (d) {
      EventManager.instance.blockUnhovered();
    })
    .on('mouseover', function (d) {
      var o = { gene:d.gene, start: d.start, end: d.end };
      EventManager.instance.blockHovered(o);
    })
    .on('click', function(d) {
      var o = { gene: d.gene, start: d.start, end: d.end };
      EventManager.instance.blockDeselected();
      EventManager.instance.blockSelected(o);
      d3.event.stopPropagation();
    })
    .attr('transform', 'translate(' + (delta) + ', 0) scale(1, 1)')
    .each(function(d) {
      self._drawGene(this, d, xScale, indices.length <= self._showTextThreshold);
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
};

GenesTrack.prototype._translateGene = function(elem, d, delta) {
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

/*
GenesTrackV3.prototype._zoomGene = function(elem, d, zoom) {
  var gene = d3.select(elem);
  var transform = gene.attr('transform');
  var scaleRx = new RegExp('scale\\\([\\\d\\\.\\\-]+[\\\,\\\s]+[\\\d\\\.\\\-]+\\\)', 'g');
  var numberRx = new RegExp('[\\\d\\\.\\\-]+', 'g');
  var scale = transform.match(scaleRx)[0];
  var x = parseFloat(scale.match(numberRx)[0]);

  transform = transform.replace(scaleRx, 'scale(' + (x * zoom) + ', 1)');
  gene
    .transition()
    .duration(500)
    .attr('transform', transform);
};
*/

GenesTrack.prototype._drawGene = function(elem, d, xScale, showText) {
  var self = this;
  var geneStart = xScale(d.start);
  var geneEnd = xScale(d.end);
  var or = (d.strand == '+') ? 1 : -1;
  var offset = - or * this._height * 0.1;

  var exonStarts = d.exonStarts.split(',').map(function(s) { return parseInt(s); });
  var exonEnds = d.exonEnds.split(',').map(function(s) { return parseInt(s); });
  var exonCount = exonStarts.length;
  var exonIndices = d3.range(0, exonCount);

  var geneHeight = this._height * 0.08;
  var exonHeight = this._height * 0.16;
  var h = geneHeight * Math.sqrt(3) * 0.5;

  var gene = d3.select(elem);
  gene.attr('class', d.classes);

  gene.append('polygon')
    .attr('class', 'gene-body')
    .style('fill', this._colors[0])
    .attr('points', function() {
      var xs = null, ys = null;
      var y0 = self._height / 2 - self._margin + offset - geneHeight / 2;
      ys = [y0, y0, y0 + geneHeight * 0.5, y0 + geneHeight, y0 + geneHeight];
      if (d.strand == '+') {
        xs = [geneStart, geneEnd, geneEnd + h, geneEnd, geneStart];
      } else {
        xs = [geneEnd, geneStart, geneStart - h, geneStart, geneEnd];
      }

      return sprintf('%s,%s %s,%s %s,%s %s,%s %s,%s', xs[0], ys[0], xs[1], ys[1], xs[2], ys[2], xs[3], ys[3], xs[4], ys[4]);
    });

  var exons = gene.append('g')
    .attr('class', 'exons')
    .style('fill', this._colors[1]);

  exons.selectAll('rect')
    .data(exonIndices)
    .enter()
    .append('rect')
    .attr('x', function(j) {
      return xScale(exonStarts[j]);
    })
    .attr('y', (self._height - exonHeight) * 0.5 - self._margin + offset)
    .attr('width', function(j) {
      return xScale(exonEnds[j]) - xScale(exonStarts[j]);
    })
    .attr('height', exonHeight);

  /* Background for gene text
  gene.append('rect')
    .attr('x', geneStart + 2)
    .attr('y', (self._height - geneHeight) * 0.5 - self._margin - or * 20 - 2)
    .attr('width', d.gene.length * 9)
    .attr('height', 11)
    .attr('fill', '#ffffff')
    .attr('stroke', 'none')
    .style('fill-opacity', '1');
  */
  gene
    .append('text')
    .attr('class', 'gene-name')
    .attr('x', geneStart + 2)
    .attr('y', (self._height - geneHeight) * 0.5 - self._margin - or * 20 + 8)
    .text(d.gene);
};

GenesTrack.prototype.onBeginUpdateChartData = function(event) {
  if (event.detail.chartId == this._id) {
    this._addLoader();
  }
};

GenesTrack.prototype.onChartDataUpdated = function(event) {
  if (event.detail.chartId != this._id) {
    return;
  }

  this._removeLoader();

  var data = event.detail.data.genes;
  var lastRequestLocation = event.detail.lastLocation;

  if (data.chr != lastRequestLocation.chr
    || data.start != lastRequestLocation.start
    || data.end != lastRequestLocation.end) {
    // This means that the data corresponds to an older request,
    // and not the latest, in which case we won't draw anything.
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
    //data.start == this.lastLocation.start && data.end != this.lastLocation.end) {
    Math.abs(data.end - data.start + this.lastLocation.start - this.lastLocation.end) > 1) {

    zoom = (this.lastLocation.end - this.lastLocation.start) / (data.end - data.start);
  }

  this.lastLocation = lastRequestLocation;

  this.draw(data, slide, zoom);
};

GenesTrack.prototype.onMeasurementsLoaded = function (event) {
  this._drawTitle(event.detail.genes);
};

GenesTrack.prototype.onContainerResize = function(width, height) {
  if (width) { this._width = width; }
  if (height) { this._height = height; }

  if (width || height) {
    if (this._workspaceData.length <= 4) {
      while (this._workspaceData.length <= 4) {
        this._workspaceData.push(null);
      }
    }
    this._workspaceData[3] = [this._width, this._height];
    Workspace.instance.changed();
  }

  // Force redraw
  this.draw(null, null, null, true);
};

GenesTrack.prototype._filterClassSelection = function(selectionData) {
  if (selectionData.gene) {
    return sprintf('> .gene-%s', selectionData.gene);
  }

  return null;
};

GenesTrack.prototype._findItems = function() {
  return this._jParent.find('> svg > .items');
};

GenesTrack.prototype.getDisplayInformation = function(objects) {
  var result = '';

  var tableLocation = '<tr><td><b>Gene</b></td><td><b>Start</b></td><td><b>End</b></td></tr>';

  for (var i = 0; i < objects.length; ++i) {
    var d = d3.select(objects[i]).data()[0];
    tableLocation += sprintf('<tr><td>%s</td><td style="text-align: right">%s</td><td style="text-align: right">%s</td></tr>',
      d.gene, Globalize.format(d.start, 'n0'), Globalize.format(d.end, 'n0'));
  }
  tableLocation = sprintf('<table class="info-panel-table">%s</table>', tableLocation);

  result += tableLocation;

  return result;
};

GenesTrack.prototype.getMeasurementColorMap = function() {
  return {
    'Genes': this._colors[0],
    'Exons': this._colors[1]
  };
};

GenesTrack.prototype.setColors = function(colors) {
  BaseChart.prototype.setColors.call(this, colors);

  this._svg.selectAll('.gene-body').style('fill', colors[0]);
  this._svg.selectAll('.exons').style('fill', colors[1]);

};
