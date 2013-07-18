/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/4/13
 * Time: 7:22 PM
 * To change this template use File | Settings | File Templates.
 */
BarcodePlot.prototype = new BaseChart();

BarcodePlot.prototype.constructor = BarcodePlot;

// Inherit SelectableChart (multiple inheritance)
Inheritance.add(BarcodePlot, SelectableChart);

function BarcodePlot() {
  // Call the constructors of all the superclasses but the first:
  SelectableChart.call(this);
  this._colorScale = null;
}

BarcodePlot.prototype.initialize = function (parentId, width, height, margin, workspaceData) {
  // Call super
  BaseChart.prototype.initialize.call(this, parentId, width, height, margin, workspaceData);

  SelectableChart.prototype.initialize.call(this);

  this._addStyles();

  this._colorScale = BarcodePlot._colorizeBinary(0, 1, this._colors[0], this._colors[1]);

  EventManager.instance.addEventListener(EventManager.eventTypes.BEGIN_UPDATE_CHART_DATA, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_DATA_UPDATED, this);
};

BarcodePlot.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style = sprintf('%s .items { stroke: #efefef; stroke-opacity: 0.3; shape-rendering: \'crispEdges\'; }\n', svgId) +
    sprintf('%s .selected .item { stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.4; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .hovered .item { stroke: #ffc600; stroke-width: 5; stroke-opacity: 0.4; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .col-text { text-anchor: start; font-size: 8px; }\n', svgId) +
    sprintf('%s .row-text { text-anchor: end; font-size: 8px; }\n', svgId) +
    sprintf('%s .selected .col-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .hovered .col-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .selected .row-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .hovered .row-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId);

  var jSvg = this._jParent.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

BarcodePlot.prototype.draw = function(data) {
  // Call super
  BaseChart.prototype.draw.call(this, data);

  var self = this;
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

  var m = {
    top: this._margin + 50,
    right: this._margin,
    bottom: this._margin,
    left: this._margin + 60
  };

  var rownames = [];
  var rows = [];
  var i, j;

  var maxRowName = 0;
  var r;
  for (r in d.data.values) {
    rownames.push(r);
    rows.push(d.data.values[r]);

    if (r.length > maxRowName) { maxRowName = r.length; }
  }
  m.left = this._margin + maxRowName * 4;

  var colnames = d.data.probe;

  var ncols = colnames.length;
  var nrows = rownames.length;

  var cellw = (this._width - m.left - m.right) / ncols;
  var cellh = (this._height - m.top - m.bottom) / nrows;

  var columnClasses = [];
  var columnMap = {};
  var rowClasses = [];
  var rowMap = {};

  for (j = 0; j < ncols; ++j) {
    columnClasses.push(sprintf('col-%s probe-%s', j, colnames[j]));
    columnMap[colnames[j]] = j;
  }
  for (i = 0; i < nrows; ++i) {
    rowClasses.push(sprintf(' row-%s sample-%s', i, rownames[i]));
    rowMap[rownames[i]] = i;
  }

  var dataArray = [];
  for (j = 0; j < ncols; ++j) {
    var classes = 'item ' + columnClasses[j];
    var s = Math.floor(d.data.start[j] / this._binSize);
    var e = Math.floor(d.data.end[j] / this._binSize);

    for (var p = s; p <= e; ++p) {
      classes += sprintf(' bin-%s', p);
    }
    for (i = 0; i < nrows; ++i) {
      dataArray.push({
        row: i,
        col: j,
        val: rows[i][j],
        probe: d.data.probe[j],
        sample: rownames[i],
        start: d.data.start[j],
        end: d.data.end[j],
        classes: classes + rowClasses[i]
      });
    }
  }

  var mapCol = function(i, centered) {
    return m.left + i * cellw + ((centered) ? 0.5 * cellw : 0);
  };

  var mapRow = function(i, centered) {
    return m.top + i * cellh + ((centered) ? cellh * 0.5 : 0);
  };

  this._svg
    .attr('width', this._width - this._parentMargins.x)
    .attr('height', this._height - this._parentMargins.y);

  var itemsGroup = this._svg.select('.items');
  var selectedGroup = itemsGroup.select('.selected');

  if (itemsGroup.empty()) {
    itemsGroup = this._svg.append('g').attr('class', 'items');
    selectedGroup = itemsGroup.append('g').attr('class', 'selected');
    itemsGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }

  var selection = itemsGroup.selectAll('.item')
    .data(dataArray, function(d) { return sprintf('%s-%s', d.probe, d.sample); });

  selection
    .enter()
    .append('rect')
    .attr('class', function(d) { return d.classes; })
    .style('opacity', '0')
    .attr('x', function(d) { return mapCol(d.col); })
    .attr('y', function(d) { return mapRow(d.row); })
    .attr('width', cellw)
    .attr('height', cellh)
    .style('fill', function(d) {
      return self._colorScale(d.val);
    })
    .on('mouseout', function (d) {
      EventManager.instance.blockUnhovered();
    })
    .on('mouseover', function (d) {
      var o = { probe:d.probe, sample:d.sample, start: d.start, end: d.end };
      EventManager.instance.blockHovered(o);
    })
    .on('click', function(d) {
      var o = { probe:d.probe, sample:d.sample, start: d.start, end: d.end };
      EventManager.instance.blockDeselected();
      EventManager.instance.blockSelected(o);
      d3.event.stopPropagation();
    });

  selection
    .transition()
    .duration(500)
    .attr('x', function(d) { return mapCol(d.col); })
    .attr('y', function(d) { return mapRow(d.row); })
    .attr('width', cellw)
    .attr('height', cellh)
    .style('opacity', '1');

  selection
    .exit()
    .transition()
    .duration(500)
    .style('opacity', 0)
    .remove();

  // Add column names

  selection = itemsGroup.selectAll('.col-text')
    .data(colnames, String);

  selection
    .enter()
    .append('text')
    .attr('class', function(d) { return 'col-text ' + columnClasses[columnMap[d]]; })
    .style('opacity', '0')
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d){
      return 'translate(' + (mapCol(columnMap[d], true))  + ',' + (m.top-5) + ')rotate(-90)';
    })
    .text(function(d){ return d; });

  selection
    .transition()
    .duration(500)
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d){
      return 'translate(' + (mapCol(columnMap[d], true))  + ',' + (m.top-5) + ')rotate(-90)';
    })
    .style('opacity', null);

  selection
    .exit()
    .transition()
    .duration(500)
    .style('opacity', 0)
    .remove();

  // Add row names

  selection = itemsGroup.selectAll('.row-text')
    .data(rownames, String);

  selection
    .enter()
    .append('text')
    .attr('class', function(d) { return 'row-text ' + rowClasses[rowMap[d]]; })
    .attr('x', m.left - 5)
    .attr('y', function(d){ return mapRow(rowMap[d], true); })
    .text(function(d){ return rownames[rowMap[d]]; });

  selection
    .transition()
    .duration(500)
    .attr('y', function(d){ return mapRow(rowMap[d], true); });

  this.refreshSelection();
};

BarcodePlot.prototype.onBeginUpdateChartData = function(event) {
  if (event.detail.chartId == this._id) {
    this._addLoader();
  }
};

BarcodePlot.prototype.onChartDataUpdated = function(event) {
  if (event.detail.chartId != this._id) {
    return;
  }

  this._removeLoader();

  var data = event.detail.data.barcodeData;
  var lastLocation = event.detail.lastLocation;

  if (data.chr != lastLocation.chr
    || data.start != lastLocation.start
    || data.end != lastLocation.end) {
    return;
  }

  this.draw(data);
};

// This function will take a set of 3 "increasing" colors and
// return a color scale that fills in intensities between the
// colors. For use in turning each column of the observation
// matrix into a heatmap.
BarcodePlot._colorize = function(min, max, median, colorMin, colorMax, colorMedian){
  return d3.scale.linear()
    .domain([min, median, max])
    .range([colorMin, colorMedian, colorMax]);
};

BarcodePlot._colorizeBinary = function(min, max, colorMin, colorMax){
  return d3.scale.linear()
    .domain([min, max])
    .range([colorMin, colorMax]);
};

BarcodePlot.prototype._filterClassSelection = function(selectionData) {
  if (selectionData.probe && selectionData.probe != 'NA' && selectionData.sample) {
    return sprintf('> .probe-%s.sample-%s,> .col-text.probe-%s,> .row-text.sample-%s',
      selectionData.probe, selectionData.sample, selectionData.probe, selectionData.sample);
  }

  if (selectionData.probe && selectionData.probe != 'NA') {
    return sprintf('> .probe-%s', selectionData.probe);
  }

  return null;
};

BarcodePlot.prototype._childrenFilterClass = function() {
  return '> .item,> .col-text,> .row-text';
};

BarcodePlot.prototype._findItems = function() {
  return this._jParent.find('> svg > .items');
};

BarcodePlot.prototype.getMeasurementColorMap = function() {
  return {
    'Not Expressed': this._colors[0],
    'Expressed': this._colors[1]
  };
};

BarcodePlot.prototype.setColors = function(colors) {
  BaseChart.prototype.setColors.call(this, colors);

  this._colorScale = BarcodePlot._colorizeBinary(0, 1, this._colors[0], this._colors[1]);
  var self = this;
  this._svg.selectAll('.item').style('fill', function(d) {
    return self._colorScale(d.val);
  });
};
