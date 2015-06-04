/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 5:56 PM
 */

goog.provide('epiviz.plugins.charts.HeatmapPlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
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
  this._colorScale = epiviz.utils.colorizeBinary(this._min, this._max, '#ffffff', this.colors().get(0));

  /**
   * @type {Array.<string>}
   * @private
   */
  this._colorLabels = [];

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
  this._svg.classed('heatmap-plot', true);
  this._chartContent = this._svg.append('g').attr('class', 'chart-content');
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.datatypes.GenomicData} [data]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.HeatmapPlot.prototype.draw = function(range, data) {

  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) { return []; }

  /** @type {epiviz.datatypes.GenomicData} */
  var orderedData = this._applyClustering(range, data);

  return this._drawCells(range, orderedData);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {epiviz.datatypes.GenomicData}
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._applyClustering = function(range, data) {
  // TODO: This might not be needed anymore
  // TODO: Search for all usages of this method
  var dataHasGenomicLocation = epiviz.measurements.Measurement.Type.isOrdered(this.measurements().first().type());

  // Apply clustering
  var clusteringAlgFactory = epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.instance();
  var clusterer = clusteringAlgFactory.algorithm(
    this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_ALG]);
  var metric = clusteringAlgFactory.metric(
    this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_METRIC]);
  var linkage = clusteringAlgFactory.linkage(
    this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_LINKAGE]);

  var population = [];
  data.foreach(function(measurement, series) {
    var row = [];
    for (var j = 0; j < series.size(); ++j) {
      var item = series.get(j).rowItem;
      if (!dataHasGenomicLocation ||
        (range.start() == undefined || range.end() == undefined) ||
        item.start() < range.end() && item.end() >= range.start()) {
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
    orderedData.put(orderedMs[i], data.getSeries(orderedMs[i]));
  }

  this._drawDendrogram(dendrogram);

  return new epiviz.datatypes.MapGenomicData(orderedData);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawCells = function(range, data) {
  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  var maxColumns = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS];

  var firstGlobalIndex = data.firstSeries().globalStartIndex();
  var lastGlobalIndex = data.firstSeries().size() + firstGlobalIndex;
  var rows = [];

  // TODO: This might not be needed anymore
  // TODO: Search for all usages of this method
  var dataHasGenomicLocation = epiviz.measurements.Measurement.Type.isOrdered(this.measurements().first().type());

  data.foreach(function(measurement, series) {
    var firstIndex = series.globalStartIndex();
    var lastIndex = series.globalEndIndex();

    if (firstIndex > firstGlobalIndex) { firstGlobalIndex = firstIndex; }
    if (lastIndex < lastGlobalIndex) { lastGlobalIndex = lastIndex; }

    rows.push(measurement);
  });

  var nEntries = lastGlobalIndex - firstGlobalIndex;

  var colLabel = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.COL_LABEL];
  var rowLabel = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL];

  var dendrogramRatio = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO];
  var width = this.width() * (1 - dendrogramRatio);
  var height = this.height();

  var colnames = [], columnMap = {};
  var i, globalIndex;

  for (i = 0; i < nEntries; ++i) {
    globalIndex = i + firstGlobalIndex;

    // Find a defined row item for the data
    var item;
    data.foreach(function(m, series) {
      item = series.getRowByGlobalIndex(globalIndex);
      return item; // break if item is defined
    });

    if (!item) { continue; }

    if (!dataHasGenomicLocation ||
      (range.start() == undefined || range.end() == undefined) ||
      item.start() < range.end() && item.end() >= range.start()) {
      var label = item.metadata(colLabel) || '' + item.id();
      columnMap[colnames.length] = globalIndex;
      colnames.push(label);
    }
  }

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];
  var colIndex = {};
  data.foreach(function(m, series, seriesIndex) {
    var nextCellsPerCol = Math.ceil(colnames.length / maxColumns), cellsPerCol = 0;
    var colsLeft = maxColumns;
    for (var i = 0; i < colnames.length; ++i) {
      globalIndex = columnMap[i];

      var cell = series.getByGlobalIndex(globalIndex);
      if (!cell) { continue; }
      var uiObj = null;
      if (cellsPerCol == 0) {
        var classes = sprintf('item data-series-%s', seriesIndex);

        uiObj = new epiviz.ui.charts.ChartObject(
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
        if (epiviz.measurements.Measurement.Type.isOrdered(series.measurement().type())) {
          uiObj.start = Math.min(uiObj.start, cell.rowItem.start());
          uiObj.end = Math.max(uiObj.end, cell.rowItem.end());
        }
        uiObj.values[0] = (uiObj.values[0] * uiObj.valueItems[0].length + cell.value) / (uiObj.valueItems[0].length + 1);
        uiObj.valueItems[0].push(cell);
      }

      if (seriesIndex == 0) {
        colIndex[globalIndex] = items.length - 1;
      }

      --cellsPerCol;
    }
  });

  var colorLabelsMap;
  var colorScales;
  this._min = data.measurements()[0].minValue();
  this._max = data.measurements()[0].maxValue();
  if (this._globalIndexColorLabels) {
    colorLabelsMap = {};
    for (var j = firstGlobalIndex; j < lastGlobalIndex; ++j) {
      colorLabelsMap[this._globalIndexColorLabels[j]] = this._globalIndexColorLabels[j];
    }
    this._colorLabels = Object.keys(colorLabelsMap);
    colorScales = {};
    this._colorLabels.forEach(function(label, i) {
      var color = self.colors().getByKey(label);
      colorScales[label] = epiviz.utils.colorizeBinary(self._min, self._max, '#ffffff', color);
    });
  } else {
    this._colorLabels = [
      sprintf('Max', data.firstSeries().measurement().maxValue())
    ];
    this._colorScale = epiviz.utils.colorizeBinary(this._min, this._max, '#ffffff', this.colors().get(0));
  }

  var nCols = Math.min(colnames.length, maxColumns);
  var cellWidth = nCols ? (width - this.margins().sumAxis(Axis.X)) / nCols : 0;
  var cellHeight = (this.height() - this.margins().sumAxis(Axis.Y)) / data.measurements().length;

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
      return sprintf('%s-item-%s-%s', self.id(), d.seriesIndex, d.valueItems[0][0].globalIndex);
    })
    .attr('class', function(d) { return d.cssClasses; })
    .style('opacity', 0)
    .style('fill-opacity', 0)
    .attr('x', function(d) { return cellWidth * colIndex[d.valueItems[0][0].globalIndex]; })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('fill', function(d, i) {
      if (!self._globalIndexColorLabels) { return self._colorScale(d.values[0]); }
      return colorScales[self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]](d.values[0]);
    });

  selection
    .transition()
    .duration(1000)
    .style('fill-opacity', null)
    .style('opacity', null)
    .attr('x', function(d) {
      return cellWidth * colIndex[d.valueItems[0][0].globalIndex];
    })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('fill', function(d) {
      if (!self._globalIndexColorLabels) { return self._colorScale(d.values[0]); }
      return colorScales[self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]](d.values[0]);
    });

  selection
    .exit()
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .remove();

  selection
    .on('mouseover', function (d) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
    })
    .on('mouseout', function () {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .on('click', function (d) {
      self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));

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

  var maxColSize = 0;
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
      .style('opacity', null)
      .attr('fill', function(colName, i) {
        var globalIndex = i + firstGlobalIndex;
        if (!self._globalIndexColorLabels) { return '#000000'; }
        return self.colors().getByKey(self._globalIndexColorLabels[globalIndex]);
      });

    colSelection
      .exit()
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();

    $('#' + this.id() + ' .col-text')
      .each(function(i) {
        var textWidth = this.getBBox().width;
        if (maxColSize < textWidth) { maxColSize = textWidth; }
      });
  }

  // Row names

  var rowSelection = itemsGroup.selectAll('.row-text')
    .data(rows, function(m) { return m.id(); });

  rowSelection
    .enter()
    .append('text')
    .attr('class', 'row-text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d, i){
      return 'translate(' + (-5) + ',' + (mapRow(i, true)) + ')rotate(30)';
    });

  rowSelection
    .text(function(m){
      if (rowLabel == 'name') { return m.name(); }
      var anno = m.annotation();
      if (!anno || !(rowLabel in anno)) { return '<NA>'; }
      return anno[rowLabel];
    });

  rowSelection
    .transition()
    .duration(500)
    .attr('x', 0)
    .attr('y', 0)
    .attr('transform', function(d, i){
      return 'translate(' + (-5) + ',' + (mapRow(i, true)) + ')rotate(30)';
    });

  rowSelection.exit().remove();

  // Draw legend
  var title = '';

  this._svg.selectAll('.chart-title').remove();
  this._svg.selectAll('.chart-title-color ').remove();
  var titleEntries = this._svg
    .selectAll('.chart-title')
    .data(['Min'].concat(this._colorLabels));
  titleEntries
    .enter()
    .append('text')
    .attr('class', 'chart-title')
    .attr('font-weight', 'bold')
    .attr('y', self.margins().top() - 5 - maxColSize);
  titleEntries
    .attr('fill', function(label, i) {
      if (i == 0) { return '#000000'; }
      if (!self._globalIndexColorLabels) { return self.colors().get(0); }
      return self.colors().getByKey(label);
    })
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
    .data(['Min'].concat(this._colorLabels))
    .enter()
    .append('circle')
    .attr('class', 'chart-title-color')
    .attr('cx', function(column, i) { return self.margins().left() + 4 + titleEntriesStartPosition[i]; })
    .attr('cy', self.margins().top() - 9 - maxColSize)
    .attr('r', 4)
    .style('shape-rendering', 'auto')
    .style('stroke-width', '0')
    .attr('fill', function(label, i) {
      if (i == 0) { return '#ffffff'; }
      if (!self._globalIndexColorLabels) { return self.colors().get(0); }
      return self.colors().getByKey(label);
    })
    .style('stroke-width', function(label, i) { return i ? 0 : 1; })
    .style('stroke', '#000000');

  return items;
};

/**
 * @param {epiviz.ui.charts.transform.clustering.ClusterTree} dendrogram
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawDendrogram = function(dendrogram) {
  this._svg.select('.dendrogram').remove();

  var dendrogramRatio = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO];
  var showDendrogram = dendrogramRatio > 0;
  var showLabels = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM_LABELS];

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

    var yCenter = this._drawSubDendrogram(
      svg,
      children[i],
      childTop,
      left,
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
      .style('shape-rendering', 'auto');

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
    .style('shape-rendering', 'auto');

  return (firstY + lastY) * 0.5;
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.HeatmapPlot.prototype.colorLabels = function() {
  return this._colorLabels;
};
