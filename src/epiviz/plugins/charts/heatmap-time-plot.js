/**
 * Created by Jayaram Kancherla ( jkanche [at] umiacs [dot] umd [dot] edu )
 */

goog.provide('epiviz.plugins.charts.HeatmapTimePlot');

goog.require('epiviz.plugins.charts.HeatmapPlot');

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.HeatmapTimePlot = function(id, container, properties) {
  // Call superclass constructor
  epiviz.plugins.charts.HeatmapPlot.call(this, id, container, properties);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.HeatmapTimePlot.prototype = epiviz.utils.mapCopy(epiviz.plugins.charts.HeatmapPlot.prototype);
epiviz.plugins.charts.HeatmapTimePlot.constructor = epiviz.plugins.charts.HeatmapTimePlot;


/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {Array.<number>} [colOrder]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.HeatmapTimePlot.prototype._drawCells = function(range, data, colOrder) {
  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  var maxColumns = this.customSettingsValues()[epiviz.plugins.charts.HeatmapTimePlotType.CustomSettings.MAX_COLUMNS];

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

  //var dendrogramRatio = this.customSettingsValues()[epiviz.plugins.charts.HeatmapTimePlotType.CustomSettings.DENDROGRAM_RATIO];
  var cluster = this.customSettingsValues()[epiviz.plugins.charts.HeatmapTimePlotType.CustomSettings.CLUSTER];
  var clusterRows = (cluster == epiviz.plugins.charts.HeatmapTimePlotType.Cluster.ROWS || cluster == epiviz.plugins.charts.HeatmapTimePlotType.Cluster.BOTH);
  var clusterCols = ((cluster == epiviz.plugins.charts.HeatmapTimePlotType.Cluster.COLS || cluster == epiviz.plugins.charts.HeatmapTimePlotType.Cluster.BOTH)
                     && maxColumns >= nEntries);

  var dendrogramRatio = this.customSettingsValues()[epiviz.plugins.charts.HeatmapTimePlotType.CustomSettings.SHOW_DENDROGRAM] * this._dendrogramRatio;
  var rowLabelsAsColors = this.customSettingsValues()[epiviz.plugins.charts.HeatmapTimePlotType.CustomSettings.SHOW_COLORS_FOR_ROW_LABELS];
  var rowLabelColorWidth = rowLabelsAsColors ? 20 : 0; // TODO: Customize


  var width = this.width() * (1 - dendrogramRatio * clusterRows) - rowLabelColorWidth;
  var height = this.height() * (1 - dendrogramRatio * clusterCols);

  var globalIndices = [];
  var colnames = [];
  var colids = [];
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
      globalIndices.push(globalIndex);
      var label = item.metadata(colLabel) || '' + item.id();
      colnames.push(label);
      colids.push(item.metadata("id"));
    }
  }

  if (colOrder) {
    var unorderedGlobalIndices = globalIndices;
    var unorderedColnames = colnames;
    globalIndices = new Array(globalIndices.length);
    colnames = new Array(colnames.length);
    for (i = 0; i < globalIndices.length; ++i) {
      globalIndices[i] = unorderedGlobalIndices[colOrder[i]];
      colnames[i] = unorderedColnames[colOrder[i]];
      // TODO: Columnmap seems to have same functionality as globalIndices!
      //columnMap[i] = globalIndices[i];
    }
  }

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];
  var colIndex = {};
  data.foreach(function(m, series, seriesIndex) {
    var nextCellsPerCol = Math.ceil(colnames.length / maxColumns), cellsPerCol = 0;
    var colsLeft = maxColumns;
    for (var i = 0; i < colnames.length; ++i) {
      globalIndex = globalIndices[i];

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
  this._min = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MIN];
  this._max = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MAX];
  var CustomSetting = epiviz.ui.charts.CustomSetting;

  var dataMin = 100000, dataMax = -100000;
  var numTimePoints = 0;
  data.foreach(function(m, series) {
    var featureValues = series._container.values(m);
    featureValues._values.forEach(function(valData){
      valData = JSON.parse(valData);
      numTimePoints = valData.length;
      var fMin = Math.min.apply(null, valData), fMax = Math.max.apply(null, valData);

      if (fMin < dataMin) { dataMin = fMin;} 
      if (fMax > dataMax) { dataMax = fMax;}
    });
  });
  if (this._min == CustomSetting.DEFAULT) { this._min = dataMin; }
  if (this._max == CustomSetting.DEFAULT) { this._max = dataMax; }
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
    this._colorScale = epiviz.utils.colorizeBinary(this._min, this._max, '#ffffff', this.colors().getByKey('Max'));
  }

  var nCols = Math.min(colnames.length, maxColumns);
  var cellWidth = nCols ? (width - this.margins().sumAxis(Axis.X)) / nCols : 0;
  var cellHeight = (height - this.margins().sumAxis(Axis.Y)) / data.measurements().length;

  var itemsGroup = this._chartContent.select('.items');
  // itemsGroup.remove();
  
  if (itemsGroup.empty()) {
    itemsGroup = this._chartContent.append('g')
      .attr('class', 'items');
    var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
    itemsGroup.append('g').attr('class', 'hovered');
    selectedGroup.append('g').attr('class', 'hovered');
  }

  itemsGroup.attr('transform', 'translate(' + this.margins().left() + ', ' + this.margins().top() + ')');

  var selection = itemsGroup.selectAll('.spline-container').data(items, function(d) { return d.id; });
  self._uiItems = items;

  // selection
  //   .enter()
  //   .append('rect')
  //   .attr('id', function (d) {
  //     return sprintf('%s-item-%s-%s', self.id(), d.seriesIndex, d.valueItems[0][0].globalIndex);
  //   })
  //   .attr('class', function(d) { return d.cssClasses; })
  //   .style('opacity', 0)
  //   .style('fill-opacity', 0)
  //   .attr('x', function(d) { return cellWidth * colIndex[d.valueItems[0][0].globalIndex]; })
  //   .attr('y', function(d) { return cellHeight * d.seriesIndex; })
  //   .attr('width', cellWidth)
  //   .attr('height', cellHeight)
  //   .style('fill', function(d, i) {
  //     if (!self._globalIndexColorLabels) { return self._colorScale(d.values[0]); }
  //     return colorScales[self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]](d.values[0]);
  //   });



    // var xaxis = d3.scale.linear().domain(d3.extent([0, numTimePoints]))
    //   .range([0, cellWidth-10]);
    // var yaxis = d3.scale.linear().domain(d3.extent([dataMin,dataMax]))
    //   .range([cellHeight, 0]);

  // selection.selectAll(".splinecurve").remove();

  selection
    .enter()
    .append("g")
    .attr("class", "spline-container")
    .style("fill-opacity", 0)
    .style("opacity", 0)
    // .attr('x', function(d) {margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX)})
    .attr('x', function(d) { return cellWidth * colIndex[d.valueItems[0][0].globalIndex]; })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .attr('transform', function(d) {return 'translate(' +  (cellWidth * colIndex[d.valueItems[0][0].globalIndex]) + ',' + (cellHeight * d.seriesIndex) + ')';})
    .append("path")
    .attr("d", function(d, i) {

        var valuesAsArray = JSON.parse(d.values[0]);
        var lineData = [];
        
        var xData = [];
        var yData = [];
        valuesAsArray.forEach(function(valueElement, j){ 
          lineData.push({x:j, y:valueElement});
          xData.push(j);
          yData.push(valueElement);
        });

        
    var xaxis = d3.scale.linear().domain(d3.extent([0, numTimePoints]))
      .range([0, cellWidth-10]);
    var yaxis = d3.scale.linear().domain(d3.extent([dataMin,dataMax]))
      .range([cellHeight, 0]);

        var lineFunction = d3.svg.line()
                          .x(function(d) { return xaxis(d.x); })
                          .y(function(d) { return yaxis(d.y); })
                      .interpolate("linear");
        return lineFunction(lineData);
    })
    .style("stroke", "black")
    // .attr("stroke-width", "10")
    .style("stroke-width", "3")
    .attr("class", "splinecurve");

  selection
    .transition()
    .duration(1000)
    .style('fill-opacity', null)
    .style('opacity', null)
    .attr('x', function(d) { return cellWidth * colIndex[d.valueItems[0][0].globalIndex]; })
    .attr('y', function(d) { return cellHeight * d.seriesIndex; })
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .attr('transform', function(d) {return 'translate(' +  (cellWidth * colIndex[d.valueItems[0][0].globalIndex]) + ',' + (cellHeight * d.seriesIndex) + ')';});

  selection.selectAll(".splinecurve").transition().duration(1000)    
  .attr("d", function(d, i) {

        var valuesAsArray = JSON.parse(d.values[0]);
        var lineData = [];
        
        var xData = [];
        var yData = [];
        valuesAsArray.forEach(function(valueElement, j){ 
          lineData.push({x:j, y:valueElement});
          xData.push(j);
          yData.push(valueElement);
        });

        
    var xaxis = d3.scale.linear().domain(d3.extent([0, numTimePoints]))
      .range([0, cellWidth-10]);
    var yaxis = d3.scale.linear().domain(d3.extent([dataMin,dataMax]))
      .range([cellHeight, 0]);

        var lineFunction = d3.svg.line()
                          .x(function(d) { return xaxis(d.x); })
                          .y(function(d) { return yaxis(d.y); })
                      .interpolate("linear");
        return lineFunction(lineData);
    })
    .style("stroke", "black")
    .attr("stroke-width", "10")
    .attr("class", "splinecurve");


  selection
    .exit()
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .style('fill-opacity', 0)
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

  this._drawLabels(itemsGroup, colnames, colids, globalIndices, nCols, rows, cellWidth, cellHeight, firstGlobalIndex, width);

  return items;
};

epiviz.plugins.charts.HeatmapTimePlot.prototype.transformData = function(range, data) {
 var lastRange = this._lastRange;

 if (range != undefined) {
   this._lastRange = range;
 }
 if (data != undefined) {
   this._lastData = data;
   this._unalteredData = data;
 }

 var deferred = new epiviz.deferred.Deferred();
 deferred.resolve();
 return deferred;
};

epiviz.plugins.charts.HeatmapTimePlot.prototype._applyLogTransformation = function(lData, callback) {

  callback(lData);
};

/**
 * @param itemsGroup D3 selection
 * @param {Array.<string>} colnames
 * @param {Object.<number, number>} columnMap
 * @param {number} nCols
 * @param {Array.<epiviz.measurements.Measurement>} rows
 * @param {number} cellWidth
 * @param {number} cellHeight
 * @param {number} firstGlobalIndex
 * @param {number} width
 * @private
 */
epiviz.plugins.charts.HeatmapTimePlot.prototype._drawLabels = function(itemsGroup, colnames, colids, columnMap, nCols, rows, cellWidth, cellHeight, firstGlobalIndex, width) {

  var self = this;

  var mapCol = function(i, centered) {
    return i * cellWidth + ((centered) ? 0.5 * cellWidth : 0);
  };

  var mapRow = function(i, centered) {
    return i * cellHeight + ((centered) ? cellHeight * 0.5 : 0);
  };

  var measurementLabel = function(m) {
    var label;
    if (rowLabel == 'name') { label = m.name(); }
    else {
      var anno = m.annotation();
      if (!anno || !(rowLabel in anno)) { label = '<NA>'; }
      else { label = anno[rowLabel]; }
    }
    rowLabelMap[label] = label;
    return label;
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
      .text(function(d){ return d; })
      .style("text-decoration", "underline")
      .on("mouseover", function(d) {d3.select(this).style("cursor", "pointer");})
      .on("mouseout", function(d) {d3.select(this).style("cursor", "default");})
      .on('click', function(d,i) {
        console.log(self._uiItems);

        var colData = [];

        self._uiItems.forEach(function(cellxy) {

          // need to write a regular expression with heatmap_%d_i to get all colData for that i, append cellxy to column data

          //if(cellxy.id.)
        });

        self._addFeaturePlot.notify({
          featureName: colnames[i],
          featureId: colids[i],
          measurements: self.measurements(),
          rowLabel: self.customSettingsValues()['rowLabel'],
          data: colData
        });
      });

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

  var rowLabel = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL];
  var rowLabelsAsColors = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_COLORS_FOR_ROW_LABELS];

  if (!rowLabelsAsColors) {
    itemsGroup.selectAll('.row-color-label').remove();
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
  }

  var rowLabelCat;
  if (rowLabelsAsColors) {
    itemsGroup.selectAll('.row-text').remove();
    var rowLabelMap = {};
    rows.forEach(function(m) {
      var label = measurementLabel(m);
      rowLabelMap[label] = label;
    });
    rowLabelCat = Object.keys(rowLabelMap);

    var rowColorLabels = itemsGroup.selectAll('.row-color-label')
      .data(rows, function(m) { return m.id(); });

    rowColorLabels
      .enter()
      .append('rect')
      .attr('class', 'row-color-label')
      .attr('x', width - self.margins().sumAxis(epiviz.ui.charts.Axis.X))
      .attr('y', -cellHeight*0.5)
      .attr('width', 20)// TODO: Use a custom variable
      .attr('height', cellHeight)
      .attr('transform', function(d, i){
        return 'translate(' + (0) + ',' + (mapRow(i, true)) + ')';
      });

    rowColorLabels
      .style('fill', function(m) {
        var label = measurementLabel(m);
        return self.colors().getByKey(label);
      });

    rowColorLabels
      .transition()
      .duration(500)
      .attr('x', width - self.margins().sumAxis(epiviz.ui.charts.Axis.X))
      .attr('y', -cellHeight*0.5)
      .attr('height', cellHeight)
      .attr('transform', function(d, i){
        return 'translate(' + (0) + ',' + (mapRow(i, true)) + ')';
      });

    rowColorLabels.exit().remove();
  }

  // Legend
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
      return self.colors().getByKey(label);
    })
    .style('stroke-width', function(label, i) { return i ? 0 : 1; })
    .style('stroke', '#000000');

  // Row labels legend

  this._svg.selectAll('.row-legend').remove();
  this._svg.selectAll('.row-legend-color').remove();
  if (rowLabelsAsColors) {
    // TODO: Make this optional
    //rowLabelCat.sort();
    var textEntries = this._svg
      .selectAll('.row-legend')
      .data(rowLabelCat);
    textEntries
      .enter()
      .append('text')
      .attr('class', 'row-legend')
      .attr('font-weight', 'bold')
      .attr('x', -20);
    textEntries
      .attr('fill', function(label) {
        return self.colors().getByKey(label);
      })
      .text(function(label) { return label; })
      .attr('transform', function(d, i){
        return 'translate(' + (self.margins().left()) + ',' + (self.margins().top()) + ')';
      });

    textEntries.attr('y', function(label, i) {
      return 10 + i * 15;
    });

    this._svg
      .selectAll('.row-legend-color')
      .data(rowLabelCat)
      .enter()
      .append('rect')
      .attr('class', 'chart-title-color')
      .attr('x', -18)
      .attr('y', function(label, i) { return 2 + i * 15})
      .attr('width', 10)
      .attr('height', 10)
      .style('shape-rendering', 'auto')
      .style('stroke-width', '0')
      .attr('fill', function(label) { return self.colors().getByKey(label); })
      .style('stroke-width', 0)
      .attr('transform', function(d, i){
        return 'translate(' + (self.margins().left()) + ',' + (self.margins().top()) + ')';
      });

    this._colorLabels = this._colorLabels.concat(rowLabelCat)
  }
};