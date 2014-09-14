/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 5:56 PM
 */

goog.provide('epiviz.plugins.charts.HeatmapPlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.ChartProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.HeatmapPlot = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Plot.call(this, id, container, properties);

  /**
   * D3 chart container
   * @type {*}
   * @private
   */
  this._chartContent = null;

  /**
   * @type {jQuery}
   * @private
   */
  this._jChartContent = null;

  /**
   * @type {number}
   * @private
   */
  this._min = this.measurements().first().minValue();

  /**
   * @type {number}
   * @private
   */
  this._max = this.measurements().first().maxValue();

  /**
   * @type {function(number): string}
   * @private
   */
  this._colorScale = epiviz.utils.colorizeBinary(this._min, this._max, this.colors().get(0), this.colors().get(1));

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.HeatmapPlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.HeatmapPlot.constructor = epiviz.plugins.charts.HeatmapPlot;

/**
 * @protected
 */
epiviz.plugins.charts.HeatmapPlot.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Plot.prototype._initialize.call(this);

  this._chartContent = this._svg.append('g').attr('class', 'chart-content');
  this._jChartContent = this._container.find('.chart-content');
};

/**
 * @protected
 */
epiviz.plugins.charts.HeatmapPlot.prototype._addStyles = function() {
  var svgId = '#' + this._svgId;
  var style = sprintf('%s .items { stroke: #efefef; stroke-opacity: 0.3; shape-rendering: \'crispEdges\'; }\n', svgId) +
    sprintf('%s .selected .item { stroke: #ffc600; stroke-width: 2; stroke-opacity: 1.0; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .hovered .item { stroke: #ffc600; stroke-width: 2; stroke-opacity: 1.0; fill-opacity: 1; }\n', svgId) +
    sprintf('%s .col-text { text-anchor: start; font-size: 10px; }\n', svgId) +
    sprintf('%s .row-text { text-anchor: end; font-size: 9px; }\n', svgId) +
    sprintf('%s .selected .col-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .hovered .col-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .selected .row-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId) +
    sprintf('%s .hovered .row-text { font-weight: bold; fill-opacity: 1; font-size: 10px; }\n', svgId);

  var jSvg = this._container.find('svg');
  jSvg.append(sprintf('<style type="text/css">%s</style>', style));
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} [data]
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 */
epiviz.plugins.charts.HeatmapPlot.prototype.draw = function(range, data) {

  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  var orderedData = this._applyClustering(range, data);

  return this._drawCells(range, orderedData);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @returns {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>}
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._applyClustering = function(range, data) {
  // Apply clustering
  var clusteringAlgFactory = epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.instance();
  var clusterer = clusteringAlgFactory.algorithm(
    this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_ALG]);
  var metric = clusteringAlgFactory.metric(
    this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_METRIC]);
  var linkage = clusteringAlgFactory.linkage(
    this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_LINKAGE]);

  var population = [];
  data.foreach(function(measurement, series, i) {
    var row = [];
    for (var j = 0; j < series.size(); ++j) {
      var item = series.get(j).rowItem;
      if (item.start() < range.end() && item.end() > range.start()) {
        row.push(series.get(j).value);
      }
    }
    population.push(row);
  });
  var dendrogram = clusterer.cluster(population, metric, linkage);
  var indexOrder = dendrogram.root().data();
  var measurements = [];
  data.foreach(function(measurement) { measurements.push(measurement); });
  var orderedMs = [];
  var i;
  for (i = 0; i < indexOrder.length; ++i) {
    orderedMs[i] = measurements[indexOrder[i]];
  }

  var orderedData = new epiviz.measurements.MeasurementHashtable();
  for (i = 0; i < orderedMs.length; ++i) {
    orderedData.put(orderedMs[i], data.get(orderedMs[i]));
  }

  this._drawDendrogram(dendrogram);

  return orderedData;
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>} data
 * @returns {Array.<epiviz.ui.charts.UiObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawCells = function(range, data) {
  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  var maxColumns = this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS];

  var firstGlobalIndex = data.first().value.globalStartIndex();
  var lastGlobalIndex = data.first().value.size() + firstGlobalIndex;
  var rownames = [];
  data.foreach(function(measurement, series) {

    var firstIndex = series.globalStartIndex();
    var lastIndex = series.size() + firstIndex;

    if (firstIndex > firstGlobalIndex) { firstGlobalIndex = firstIndex; }
    if (lastIndex < lastGlobalIndex) { lastGlobalIndex = lastIndex; }

    rownames.push(measurement.name());
  });

  var nEntries = lastGlobalIndex - firstGlobalIndex;

  var label = this._customSettingsValues[epiviz.ui.charts.ChartType.CustomSettings.LABEL];

  var dendrogramRatio = this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO];
  var width = this.width() * (1 - dendrogramRatio);
  var height = this.height();

  var colnames = [], columnMap = {};
  var i, globalIndex;

  for (i = 0; i < nEntries; ++i) {
    globalIndex = i + firstGlobalIndex;
    var item = data.get(this.measurements().first()).getByGlobalIndex(globalIndex).rowItem;
    if (item.start() < range.end() && item.end() > range.start()) {
      var colLabel = item.metadata(label) || '' + item.id();
      columnMap[colnames.length] = globalIndex;
      colnames.push(colLabel);
    }
  }

  /** @type {Array.<epiviz.ui.charts.UiObject>} */
  var items = [];
  var colIndex = {};
  data.foreach(function(m, series, seriesIndex) {
    var nextCellsPerCol = Math.ceil(colnames.length / maxColumns), cellsPerCol = 0;
    var colsLeft = maxColumns;
    for (var i = 0; i < colnames.length; ++i) {
      globalIndex = columnMap[i];

      var cell = series.getByGlobalIndex(globalIndex);
      var uiObj = null;
      if (cellsPerCol == 0) {
        var classes = sprintf('item data-series-%s', seriesIndex);

        uiObj = new epiviz.ui.charts.UiObject(
          sprintf('heatmap_%s_%s', seriesIndex, globalIndex),
          cell.rowItem.start(),
          cell.rowItem.end(),
          [cell.value],
          seriesIndex,
          [[cell]], // valueItems one for each measurement
          [m], // measurements
          classes);
        items.push(uiObj);

        nextCellsPerCol = Math.ceil((colnames.length - i) / colsLeft);
        cellsPerCol = nextCellsPerCol;
        --colsLeft;
      } else {
        uiObj = items[items.length - 1];
        uiObj.id += '_' + globalIndex;
        uiObj.start = Math.min(uiObj.start, cell.rowItem.start());
        uiObj.end = Math.max(uiObj.end, cell.rowItem.end());
        uiObj.values[0] = (uiObj.values[0] * uiObj.valueItems[0].length + cell.value) / (uiObj.valueItems[0].length + 1);
        uiObj.valueItems[0].push(cell);
      }

      if (seriesIndex == 0) {
        colIndex[globalIndex] = items.length - 1;
      }

      --cellsPerCol;
    }
  });

  var nCols = Math.min(colnames.length, maxColumns);
  var cellWidth = nCols ? (width - this.margins().sumAxis(Axis.X)) / nCols : 0;
  var cellHeight = (this.height() - this.margins().sumAxis(Axis.Y)) / this.measurements().size();
  this._colorScale = epiviz.utils.colorizeBinary(this._min, this._max, this.colors().get(0), this.colors().get(1));

  var itemsGroup = this._chartContent.select('.items');

  if (itemsGroup.empty()) {
    itemsGroup = this._chartContent.append('g')
      .attr('class', 'items');
    var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
    itemsGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }

  itemsGroup.attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');

  var selection = itemsGroup.selectAll('rect').data(items, function(d) { return d.id; });

  selection
    .enter()
    .append('rect')
    .attr('id', function (d) {
      return sprintf('%s-item-%s-%s', self._id, d.seriesIndex, d.valueItems[0][0].globalIndex);
    })
    .attr('class', function(d) { return d.cssClasses; })
    .style('opacity', 0)
    .style('fill-opacity', 0)
    .attr('x', function(d, i) { return cellWidth * colIndex[d.valueItems[0][0].globalIndex]; })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('fill', function(d) { return self._colorScale(d.values[0]); });

  selection
    .transition()
    .duration(1000)
    .style('fill-opacity', null)
    .style('opacity', null)
    .attr('x', function(d, i) {
      return cellWidth * colIndex[d.valueItems[0][0].globalIndex];
    })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('fill', function(d) { return self._colorScale(d.values[0]); });

  selection
    .exit()
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .remove();

  selection
    .on('mouseover', function (d) {
      self._hover.notify(d);
    })
    .on('mouseout', function (d) {
      self._unhover.notify();
    })
    .on('click', function (d) {
      self._deselect.notify();
      self._select.notify(d);

      d3.event.stopPropagation();
    });

  var mapCol = function(i, centered) {
    return i * cellWidth + ((centered) ? 0.5 * cellWidth : 0);
  };

  var mapRow = function(i, centered) {
    return i * cellHeight + ((centered) ? cellHeight * 0.5 : 0);
  };

  // Column names

  var colSelection = itemsGroup.selectAll('.col-text');

  if (colnames.length > nCols) {
    colSelection
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
  } else {
    colSelection = colSelection
      .data(colnames, function(d, i) { return d + columnMap[i]; });

    colSelection
      .enter()
      .append('text')
      .attr('class', 'col-text')
      .style('opacity', '0')
      .attr('x', 0)
      .attr('y', 0)
      .attr('transform', function(d, i){
        return 'translate(' + (mapCol(i, true))  + ',' + (-5) + ')rotate(-60)';
      })
      .text(function(d){ return d; });

    colSelection
      .transition()
      .duration(500)
      .attr('x', 0)
      .attr('y', 0)
      .attr('transform', function(d, i){
        return 'translate(' + (mapCol(i, true))  + ',' + (-5) + ')rotate(-60)';
      })
      .style('opacity', null);

    colSelection
      .exit()
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
  }

  // Row names

  var rowSelection = itemsGroup.selectAll('.row-text')
    .data(rownames, String);

  rowSelection
    .enter()
    .append('text')
    .attr('class', function(d) { return 'row-text'; })
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d, i){
      return 'translate(' + (-5) + ',' + (mapRow(i, true)) + ')rotate(30)';
    })
    .text(function(d){ return d; });

  rowSelection
    .transition()
    .duration(500)
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d, i){
      return 'translate(' + (-5) + ',' + (mapRow(i, true)) + ')rotate(30)';
    });

  return items;
};

/**
 * @param {epiviz.ui.charts.transform.clustering.ClusterTree} dendrogram
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawDendrogram = function(dendrogram) {
  this._svg.select('.dendrogram').remove();

  var dendrogramRatio = this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO];
  var showDendrogram = dendrogramRatio > 0;
  var showLabels = this._customSettingsValues[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM_LABELS];

  if (!showDendrogram) { return; }

  this._svg.append('g').attr('class', 'dendrogram');

  var width = (this.width()) * dendrogramRatio;
  var height = this.height() - this.margins().sumAxis(epiviz.ui.charts.Axis.Y);
  var top = this.margins().top();
  var left = this.width() - width - this.margins().right();

  this._drawSubDendrogram(this._svg.select('.dendrogram'), dendrogram.root(), top, left, width, height, showLabels);
};

/**
 * @param svg
 * @param {epiviz.ui.charts.transform.clustering.ClusterNode} node
 * @param {number} top
 * @param {number} left
 * @param {number} width
 * @param {number} height
 * @param {boolean} showLabels
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawSubDendrogram = function(svg, node, top, left, width, height, showLabels) {
  var children = node.children();
  if (children.length == 0) {
    return top + height * 0.5;
  }

  var xScale = d3.scale.linear()
    .domain([0, node.distance()])
    .range([0, width]);
  var nextTop = 0;
  var firstY, lastY;
  for (var i = 0; i < children.length; ++i) {
    var childTop = top + nextTop;
    var childHeight = (height / node.weight()) * children[i].weight();
    var childWidth = xScale(children[i].distance());
    var childLeft = left;

    var yCenter = this._drawSubDendrogram(
      svg,
      children[i],
      childTop,
      childLeft,
      childWidth,
      childHeight,
      showLabels);

    svg.append('line')
      .attr('x1', left + childWidth)
      .attr('x2', left + width)
      .attr('y1', yCenter)
      .attr('y2', yCenter)
      .style('stroke', '#555555')
      .style('stroke-width', 1)
      .style('shape-rendering', 'crispEdges');

    if (i == 0 && showLabels) {
      svg.append('text')
        .attr('class', 'row-text')
        .attr('x', Math.max(left + 10, left + (childWidth + width) * 0.5))
        .attr('y', yCenter - 10)
        .style('text-anchor', 'middle')
        .text(Globalize.format(node.distance(), 'n2'));
    }

    if (firstY == undefined || firstY > yCenter) {
      firstY = yCenter;
    }

    if (lastY == undefined || lastY < yCenter) {
      lastY = yCenter;
    }

    nextTop += (height / node.weight()) * children[i].weight();
  }

  svg.append('line')
    .attr('x1', left + width)
    .attr('x2', left + width)
    .attr('y1', firstY)
    .attr('y2', lastY)
    .style('stroke', '#555555')
    .style('stroke-width', 1)
    .style('shape-rendering', 'crispEdges');

  return (firstY + lastY) * 0.5;
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.HeatmapPlot.prototype.chartTypeName = function() { return 'epiviz.plugins.charts.HeatmapPlot'; };

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.HeatmapPlot.prototype.colorMap = function() {
  return [
    { name: 'Min', color: this.colors().get(0) },
    { name: 'Max', color: this.colors().get(1) }
  ];
};
