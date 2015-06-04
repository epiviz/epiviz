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
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.StackedLinePlot.prototype.draw = function(range, data, slide, zoom) {
  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data, slide, zoom);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  var rowLabel = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL];

  var interpolation = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.INTERPOLATION];
  var xBound = interpolation.indexOf('step') == 0 ? data.measurements().length : data.measurements().length - 1;

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale.linear()
    .domain([0, xBound])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);

  this._clearAxes();
  this._drawAxes(xScale, undefined, data.measurements().length, 5,
    undefined, undefined, undefined, undefined, undefined, undefined,
    data.measurements().map(function(m) {
      if (rowLabel == 'name') { return m.name(); }
      var anno = m.annotation();
      if (!anno || !(rowLabel in anno)) { return '<NA>'; }
      return anno[rowLabel];
    }), undefined, interpolation.indexOf('step') == 0);

  var linesGroup = this._svg.selectAll('.lines');

  if (linesGroup.empty()) {
    linesGroup = this._svg.append('g')
      .attr('class', 'lines items');

    var selectedGroup = linesGroup.append('g').attr('class', 'selected');
    linesGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }
  linesGroup
    .attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');
  return this._drawLines(range, data, xScale);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {function} xScale D3 linear scale
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.StackedLinePlot.prototype._drawLines = function(range, data, xScale) {
  var Axis = epiviz.ui.charts.Axis;

  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  var interpolation = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.INTERPOLATION];

  var colLabel = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.COL_LABEL];

  /** @type {string} */
  var offset = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.OFFSET];

  /** @type {boolean} */
  var scaleToPercent = this.customSettingsValues()[epiviz.plugins.charts.StackedLinePlotType.CustomSettings.SCALE_TO_PERCENT];

  var self = this;

  var graph = this._svg.select('.lines');

  var firstGlobalIndex = data.firstSeries().globalStartIndex();
  var lastGlobalIndex = data.firstSeries().globalEndIndex();

  data.foreach(function(measurement, series) {
    var firstIndex = series.globalStartIndex();
    var lastIndex = series.globalEndIndex();

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
    var item = data.firstSeries().getRowByGlobalIndex(globalIndex);
    if (!item) { continue; }
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

  /** @type {epiviz.measurements.MeasurementHashtable.<number>} */
  var msSums = null;
  if (scaleToPercent) {
    msSums = new epiviz.measurements.MeasurementHashtable();

    data.measurements().forEach(function(m) {
      var sum = indices
        .filter(function(i) {
          return data.getByGlobalIndex(m, i); // filter out undefined items
        })
        .map(function(i) { return data.getByGlobalIndex(m, i).value; })
        .reduce(function(v1, v2) { return v1 + v2; });
      msSums.put(m, sum);
    });
  }

  /**
   * @param {epiviz.datatypes.GenomicData.RowItem} row
   * @returns {string|number}
   */
  var colorBy = function(row) {
    return self._globalIndexColorLabels ? self._globalIndexColorLabels[row.globalIndex()] : row.metadata(colLabel);
  };

  var valuesForIndex = function(index) {
    var ret = [];
    if (interpolation == 'step-before') {
      ret.push({ x: 0, y: 0 })
    }
    var ms = data.measurements();
    ret = ret.concat(ms.map(function(m, i) {
      var div = scaleToPercent ? msSums.get(m) : 1;
      div = div || 1; // Prevent division by 0
      var item = data.getByGlobalIndex(m, index);
      return { x: ret.length + i, y: item ? item.value / div : null };
    }));

    if (interpolation == 'step-after') {
      ret.push({ x: ret.length, y: 0 });
    }
    return ret.filter(function(o) {
      return o.y !== null;
    });
  };

  var lineItems;

  lineItems = indices
    .filter(function(index) { return data.firstSeries().getRowByGlobalIndex(index); })
    .map(function(index) {
    var rowItem = data.firstSeries().getRowByGlobalIndex(index);
    var measurements = data.measurements();
    return new epiviz.ui.charts.ChartObject(
      sprintf('line-series-%s', index),
      rowItem.start(),
      rowItem.end(),
      valuesForIndex(index),
      index,
      measurements.map(function(m, i) { return [data.getByGlobalIndex(m, index)]; }), // valueItems one for each measurement
      measurements, // measurements
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
    .style('fill', function(d, i) { return colors.getByKey(colorBy(data.firstSeries().getRowByGlobalIndex(d.seriesIndex))); })
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
    .style('fill', function(d, i) { return colors.getByKey(colorBy(data.firstSeries().getRowByGlobalIndex(d.seriesIndex))); });

  lines
    .exit()
    .transition()
    .duration(500)
    .style('opacity', '0')
    .remove();

  // Draw legend
  var title = '';

  var labels = {};
  indices.forEach(function(index) {
    if (!data.firstSeries().getByGlobalIndex(index)) { return; }
    var label = colorBy(data.firstSeries().getRowByGlobalIndex(index));
    labels[label] = label;
  });

  this._svg.selectAll('.chart-title').remove();
  this._svg.selectAll('.chart-title-color ').remove();
  var titleEntries = this._svg
    .selectAll('.chart-title')
    .data(Object.keys(labels));
  titleEntries
    .enter()
    .append('text')
    .attr('class', 'chart-title')
    .attr('font-weight', 'bold')
    .attr('y', self.margins().top() - 5);
  titleEntries
    .attr('fill', function(label) { return colors.getByKey(label); })
    .text(function(label) { return label; });
  var textLength = 0;
  var titleEntriesStartPosition = [];

  $('#' + this.id() + ' .chart-title')
    .each(function(i) {
      titleEntriesStartPosition.push(textLength);
      textLength += this.getBBox().width + 15;
    });

  titleEntries.attr('x', function(column, i) {
    return self.margins().left() + 10 + titleEntriesStartPosition[i];
  });

  var colorEntries = this._svg
    .selectAll('.chart-title-color')
    .data(Object.keys(labels))
    .enter()
    .append('circle')
    .attr('class', 'chart-title-color')
    .attr('cx', function(column, i) { return self.margins().left() + 4 + titleEntriesStartPosition[i]; })
    .attr('cy', self.margins().top() - 9)
    .attr('r', 4)
    .style('shape-rendering', 'auto')
    .style('stroke-width', '0')
    .attr('fill', function(label) { return colors.getByKey(label); });

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
