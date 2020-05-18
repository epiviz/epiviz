/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/1/14
 * Time: 5:56 PM
 */

goog.provide("epiviz.plugins.charts.HeatmapPlot");

goog.require("epiviz.ui.charts.Plot");
goog.require("epiviz.ui.charts.Axis");
goog.require("epiviz.ui.charts.VisEventArgs");
goog.require("epiviz.utils");
goog.require("epiviz.ui.charts.CustomSetting");
goog.require("epiviz.ui.charts.ChartObject");
goog.require("epiviz.measurements.Measurement");
goog.require("epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory");
goog.require("epiviz.measurements.MeasurementHashtable");
goog.require("epiviz.datatypes.MapGenomicData");

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
  this._min = this.measurements()
    .first()
    .minValue();

  /**
   * @type {number}
   * @private
   */
  this._max = this.measurements()
    .first()
    .maxValue();

  /**
   * @type {function(number): string}
   * @private
   */
  this._colorScale = epiviz.utils.colorizeBinary(
    this._min,
    this._max,
    "#ffffff",
    this.colors().getByKey("Max")
  );

  /**
   * @type {Array.<string>}
   * @private
   */
  this._colorLabels = [];

  /**
   * @type {number}
   * @private
   */
  this._dendrogramRatio = 0.1;

  this._addFeaturePlot = new epiviz.events.Event();
  this._featureType = "heatmapPlot";
  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.HeatmapPlot.prototype = epiviz.utils.mapCopy(
  epiviz.ui.charts.Plot.prototype
);
epiviz.plugins.charts.HeatmapPlot.constructor =
  epiviz.plugins.charts.HeatmapPlot;

/**
 * @protected
 */
epiviz.plugins.charts.HeatmapPlot.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Plot.prototype._initialize.call(this);
  this._svg.classed("heatmap-plot", true);
  this._chartContent = this._svg.append("g").attr("class", "chart-content");
};

epiviz.plugins.charts.HeatmapPlot.prototype.draw = function(range, data) {
  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  var rows = data.measurements().length;
  var cols = data._map.first().value.size()

  if (rows * cols < 10000) {
    return this.drawSVG(range, data);
  } else {
    return this.drawCanvas(range, data);
  }
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.datatypes.GenomicData} [data]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.HeatmapPlot.prototype.drawSVG = function(range, data) {
  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) {
    return [];
  }

  var cluster = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTER
  ];

  var logTransform = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.LOG_TRANSFORM];

  var self = this;

  if(logTransform) {
    this._applyLogTransformation(data, function(transformed) {
        var pair = self._applyClustering(range, transformed);

        /** @type {epiviz.datatypes.GenomicData} */
        var orderedData = pair.data;
        var colOrder = pair.columnOrder;

        return self._drawCells(range, orderedData, colOrder);
    });
  }
  else {
    var pair = self._applyClustering(range, data);

    /** @type {epiviz.datatypes.GenomicData} */
    var orderedData = pair.data;
    var colOrder = pair.columnOrder;

    return self._drawCells(range, orderedData, colOrder);
  }
};

epiviz.plugins.charts.HeatmapPlot.prototype.drawCanvas = function(range, data) {
  epiviz.ui.charts.Plot.prototype.draw.call(this, range, data);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range) {
    return [];
  }

  var cluster = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTER
  ];

  this._container.find("#" + this.id() + "-canvas").remove();
  var canvas = document.createElement("canvas");
  this.chartDrawType = "canvas";
  this.canvas = canvas;
  canvas.id = this.id() + "-canvas";
  this._container.append(canvas);
  canvas.width = this.width();
  canvas.height = this.height();
  canvas.style = "position:absolute;top:0;left:0;width:" + this.width() + ";height:" +  this.height();

  this._container.find("#" + this.id() + "-hoverCanvas").remove();
  var hoverCanvas = document.createElement("canvas");
  this.hoverCanvas = hoverCanvas;
  hoverCanvas.id = this.id() + "-hoverCanvas";
  this._container.append(hoverCanvas);
  hoverCanvas.width = this.width();
  hoverCanvas.height = this.height();
  hoverCanvas.style =
    "position:absolute;top:0;left:0;width:" + this.width() + ";height:" +  this.height() + ";z-index:1";

  var pair = this._applyClustering(range, data, canvas);

  /** @type {epiviz.datatypes.GenomicData} */
  var orderedData = pair.data;
  var colOrder = pair.columnOrder;

  return this._drawCellsCanvas(range, orderedData, colOrder);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {{data:epiviz.datatypes.GenomicData, columnOrder:Array.<number>}}
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._applyClustering = function(
  range,
  data,
  canvas
) {
  // TODO: This might not be needed anymore
  // TODO: Search for all usages of this method
  var dataHasGenomicLocation = epiviz.measurements.Measurement.Type.isOrdered(
    this.measurements()
      .first()
      .type()
  );

  // Apply clustering
  var cluster = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTER
  ];
  var showDendrogram = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM
  ];
  var clusteringAlgFactory = epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.instance();
  var clusterer = clusteringAlgFactory.algorithm(
    this.customSettingsValues()[
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_ALG
    ]
  );
  var metric = clusteringAlgFactory.metric(
    this.customSettingsValues()[
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_METRIC
    ]
  );
  var linkage = clusteringAlgFactory.linkage(
    this.customSettingsValues()[
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTERING_LINKAGE
    ]
  );
  var maxColumns = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS
  ];

  var firstGlobalIndex = data.firstSeries().globalStartIndex();
  var lastGlobalIndex = data.firstSeries().size() + firstGlobalIndex;

  data.foreach(function(measurement, series) {
    var firstIndex = series.globalStartIndex();
    var lastIndex = series.globalEndIndex();

    if (firstIndex > firstGlobalIndex) {
      firstGlobalIndex = firstIndex;
    }
    if (lastIndex < lastGlobalIndex) {
      lastGlobalIndex = lastIndex;
    }
  });
  var nEntries = lastGlobalIndex - firstGlobalIndex;

  var clusterRows =
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.ROWS ||
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.BOTH;
  var clusterCols =
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.COLS ||
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.BOTH;
  var dendrogramRatio = showDendrogram * this._dendrogramRatio;
  var dendrogramCols = showDendrogram && clusterCols && maxColumns >= nEntries;

  var population, dendrogram, indexOrder, top, left, height, width;

  var svg = this._svg;
  ["dendrogram-horizontal", "dendrogram-vertical"].forEach(function(dendClass) {
    svg.select("." + dendClass).remove();
  });

  /** @type {epiviz.datatypes.GenomicData} */
  var orderedData = data;

  if (clusterRows) {
    population = [];
    data.foreach(function(measurement, series) {
      var row = [];
      for (var j = 0; j < nEntries; ++j) {
        var globalIndex = j + firstGlobalIndex;
        var item = series.getByGlobalIndex(globalIndex);
        var rowInfo = item.rowItem;

        if (
          !dataHasGenomicLocation ||
          (range.start() == undefined || range.end() == undefined) ||
          (rowInfo.start() < range.end() && rowInfo.end() >= range.start())
        ) {
          row.push(item.value);
        }
      }
      population.push(row);
    });
    dendrogram = clusterer.cluster(population, metric, linkage);
    indexOrder = dendrogram.root().data();
    var measurements = [];
    data.foreach(function(measurement) {
      measurements.push(measurement);
    });
    var orderedMs = [];
    var i;
    for (i = 0; i < indexOrder.length; ++i) {
      orderedMs[i] = measurements[indexOrder[i]];
    }

    var ordered = new epiviz.measurements.MeasurementHashtable();
    for (i = 0; i < orderedMs.length; ++i) {
      ordered.put(orderedMs[i], data.getSeries(orderedMs[i]));
    }
    orderedData = new epiviz.datatypes.MapGenomicData(ordered);

    if (dendrogramRatio) {
      width = this.width() * dendrogramRatio;
      height =
        this.height() * (1 - dendrogramRatio * dendrogramCols) -
        this.margins().sumAxis(epiviz.ui.charts.Axis.Y);
      top = this.margins().top();
      left = this.width() - width - this.margins().right();
      if (canvas) {
        this._drawDendrogramCanvas(dendrogram, top, left, height, width);
      } else {
        this._drawDendrogram(dendrogram, top, left, height, width);
      }
    }
  }

  // Column clustering
  indexOrder = null;
  if (clusterCols) {
    population = [];
    data.foreach(function(measurement, series) {
      for (var j = 0, row = 0; j < nEntries; ++j) {
        var globalIndex = j + firstGlobalIndex;
        var item = series.getByGlobalIndex(globalIndex);
        var rowInfo = item.rowItem;
        if (
          !dataHasGenomicLocation ||
          (range.start() == undefined || range.end() == undefined) ||
          (rowInfo.start() < range.end() && rowInfo.end() >= range.start())
        ) {
          if (population.length <= row) {
            population.push([]);
          }
          population[row].push(item.value);
          ++row;
        }
      }
    });

    if (population.length == 0) {
      return { data: orderedData, columnOrder: [] };
    }

    dendrogram = clusterer.cluster(population, metric, linkage);
    indexOrder = dendrogram.root().data();

    if (dendrogramCols) {
      var rowLabelsAsColors = this.customSettingsValues()[
        epiviz.plugins.charts.HeatmapPlotType.CustomSettings
          .SHOW_COLORS_FOR_ROW_LABELS
      ];
      var rowLabelColorWidth = rowLabelsAsColors ? 20 : 0; // TODO: Customize
      left = this.margins().left();
      top = this.height() * (1 - dendrogramRatio) - this.margins().bottom();
      width = this.height() * dendrogramRatio;
      height =
        this.width() * (1 - dendrogramRatio * clusterRows) -
        this.margins().left() -
        this.margins().right() -
        rowLabelColorWidth;
      if (canvas) {
        this._drawDendrogramCanvas(dendrogram, top, left, height, width, true);
      } else {
        this._drawDendrogram(dendrogram, top, left, height, width, true);
      }
    }
  }

  return { data: orderedData, columnOrder: indexOrder };
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {Array.<number>} [colOrder]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawCells = function(
  range,
  data,
  colOrder
) {
  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  var maxColumns = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS
  ];

  var firstGlobalIndex = data.firstSeries().globalStartIndex();
  var lastGlobalIndex = data.firstSeries().size() + firstGlobalIndex;
  var rows = [];

  // TODO: This might not be needed anymore
  // TODO: Search for all usages of this method
  var dataHasGenomicLocation = epiviz.measurements.Measurement.Type.isOrdered(
    this.measurements()
      .first()
      .type()
  );

  data.foreach(function(measurement, series) {
    var firstIndex = series.globalStartIndex();
    var lastIndex = series.globalEndIndex();

    if (firstIndex > firstGlobalIndex) {
      firstGlobalIndex = firstIndex;
    }
    if (lastIndex < lastGlobalIndex) {
      lastGlobalIndex = lastIndex;
    }

    rows.push(measurement);
  });

  var nEntries = lastGlobalIndex - firstGlobalIndex;

  var colLabel = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.COL_LABEL
  ];

  //var dendrogramRatio = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO];
  var cluster = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTER
  ];
  var clusterRows =
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.ROWS ||
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.BOTH;
  var clusterCols =
    (cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.COLS ||
      cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.BOTH) &&
    maxColumns >= nEntries;

  var dendrogramRatio =
    this.customSettingsValues()[
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM
    ] * this._dendrogramRatio;
  var rowLabelsAsColors = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings
      .SHOW_COLORS_FOR_ROW_LABELS
  ];
  var rowLabelColorWidth = rowLabelsAsColors ? 20 : 0; // TODO: Customize

  var width =
    this.width() * (1 - dendrogramRatio * clusterRows) - rowLabelColorWidth;
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

    if (!item) {
      continue;
    }

    if (
      !dataHasGenomicLocation ||
      (range.start() == undefined || range.end() == undefined) ||
      (item.start() < range.end() && item.end() >= range.start())
    ) {
      globalIndices.push(globalIndex);
      var label = item.metadata(colLabel) || "" + item.id();
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
    var nextCellsPerCol = Math.ceil(colnames.length / maxColumns),
      cellsPerCol = 0;
    var colsLeft = maxColumns;
    for (var i = 0; i < colnames.length; ++i) {
      globalIndex = globalIndices[i];

      var cell = series.getByGlobalIndex(globalIndex);
      if (!cell) {
        continue;
      }
      var uiObj = null;
      if (cellsPerCol == 0) {
        var classes = sprintf("item data-series-%s", seriesIndex);

        uiObj = new epiviz.ui.charts.ChartObject(
          sprintf("heatmap_%s_%s", seriesIndex, globalIndex),
          cell.rowItem.start(),
          cell.rowItem.end(),
          [cell.value],
          seriesIndex,
          [[cell]], // valueItems one for each measurement
          [m], // measurements
          classes,
          cell.rowItem.seqName()
        );
        items.push(uiObj);

        nextCellsPerCol = Math.ceil((colnames.length - i) / colsLeft);
        cellsPerCol = nextCellsPerCol;
        --colsLeft;
      } else {
        uiObj = items[items.length - 1];
        uiObj.id += "_" + globalIndex;
        if (
          epiviz.measurements.Measurement.Type.isOrdered(
            series.measurement().type()
          )
        ) {
          uiObj.start = Math.min(uiObj.start, cell.rowItem.start());
          uiObj.end = Math.max(uiObj.end, cell.rowItem.end());
        }
        uiObj.values[0] =
          (uiObj.values[0] * uiObj.valueItems[0].length + cell.value) /
          (uiObj.valueItems[0].length + 1);
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
  this._min = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
  ];
  this._max = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MAX
  ];
  var CustomSetting = epiviz.ui.charts.CustomSetting;

  var dataMin = 100000, dataMax = -100000;
  data.foreach(function(m, series) {
    var featureValues = series._container.values(m);
    var valData = featureValues._values;
    var fMin = Math.min.apply(null, valData), fMax = Math.max.apply(null, valData);

    if (fMin < dataMin) { dataMin = fMin;} 
    if (fMax > dataMax) { dataMax = fMax;}
  });

  if (this._min == CustomSetting.DEFAULT) {
    this._min = data.measurements()[0].minValue();
  }
  if (this._max == CustomSetting.DEFAULT) {
    this._max = data.measurements()[0].maxValue();
  }
  if (this._globalIndexColorLabels) {
    colorLabelsMap = {};
    for (var j = firstGlobalIndex; j < lastGlobalIndex; ++j) {
      colorLabelsMap[
        this._globalIndexColorLabels[j]
      ] = this._globalIndexColorLabels[j];
    }
    this._colorLabels = Object.keys(colorLabelsMap);
    colorScales = {};
    this._colorLabels.forEach(function(label, i) {
      var color = self.colors().getByKey(label);
      colorScales[label] = epiviz.utils.colorizeBinary(
        self._min,
        self._max,
        "#ffffff",
        color
      );
    });
  } else {
    this._colorLabels = [
      sprintf(
        "Max",
        data
          .firstSeries()
          .measurement()
          .maxValue()
      )
    ];
    this._colorScale = epiviz.utils.colorizeBinary(
      this._min,
      this._max,
      "#ffffff",
      this.colors().getByKey("Max")
    );
  }

  var nCols = Math.min(colnames.length, maxColumns);
  var cellWidth = nCols ? (width - this.margins().sumAxis(Axis.X)) / nCols : 0;
  var cellHeight =
    (height - this.margins().sumAxis(Axis.Y)) / data.measurements().length;

  var itemsGroup = this._chartContent.select(".items");

  if (itemsGroup.empty()) {
    itemsGroup = this._chartContent.append("g").attr("class", "items");
    var selectedGroup = itemsGroup.append("g").attr("class", "selected");
    itemsGroup.append("g").attr("class", "hovered");
    selectedGroup.append("g").attr("class", "hovered");
  }

  itemsGroup.attr(
    "transform",
    "translate(" + this.margins().left() + ", " + this.margins().top() + ")"
  );

  var selection = itemsGroup.selectAll("rect").data(items, function(d) {
    return d.id;
  });

  selection
    .enter()
    .append("rect")
    .attr("id", function(d) {
      return sprintf(
        "%s-item-%s-%s",
        self.id(),
        d.seriesIndex,
        d.valueItems[0][0].globalIndex
      );
    })
    .attr("class", function(d) {
      return d.cssClasses;
    })
    .style("opacity", 0)
    .style("fill-opacity", 0)
    .attr("x", function(d) {
      return cellWidth * colIndex[d.valueItems[0][0].globalIndex];
    })
    .attr("y", function(d) {
      return cellHeight * d.seriesIndex;
    })
    .attr("width", cellWidth)
    .attr("height", cellHeight)
    .style("fill", function(d, i) {
      if (!self._globalIndexColorLabels) {
        return self._colorScale(d.values[0]);
      }
      return colorScales[
        self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]
      ](d.values[0]);
    });

  selection
    .transition()
    .duration(1000)
    .style("fill-opacity", null)
    .style("opacity", null)
    .attr("x", function(d) {
      return cellWidth * colIndex[d.valueItems[0][0].globalIndex];
    })
    .attr("y", function(d) {
      return cellHeight * d.seriesIndex;
    })
    .attr("width", cellWidth)
    .attr("height", cellHeight)
    .style("fill", function(d) {
      if (!self._globalIndexColorLabels) {
        return self._colorScale(d.values[0]);
      }
      return colorScales[
        self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]
      ](d.values[0]);
    });

  selection
    .exit()
    .transition()
    .duration(1000)
    .style("opacity", 0)
    .remove();

  selection
    .on("mouseover", function(d) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
    })
    .on("mouseout", function() {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .on("click", function(d) {
      self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));

      d3.event.stopPropagation();
    });

  this._drawLabels(
    itemsGroup,
    colnames,
    colids,
    globalIndices,
    nCols,
    rows,
    cellWidth,
    cellHeight,
    firstGlobalIndex,
    width
  );

  return items;
};

epiviz.plugins.charts.HeatmapPlot.prototype._drawCellsCanvas = function(
  range,
  data,
  colOrder
) {
  var self = this;
  var Axis = epiviz.ui.charts.Axis;

  var maxColumns = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS
  ];

  var firstGlobalIndex = data.firstSeries().globalStartIndex();
  var lastGlobalIndex = data.firstSeries().size() + firstGlobalIndex;
  var rows = [];

  // TODO: This might not be needed anymore
  // TODO: Search for all usages of this method
  var dataHasGenomicLocation = epiviz.measurements.Measurement.Type.isOrdered(
    this.measurements()
      .first()
      .type()
  );

  data.foreach(function(measurement, series) {
    var firstIndex = series.globalStartIndex();
    var lastIndex = series.globalEndIndex();

    if (firstIndex > firstGlobalIndex) {
      firstGlobalIndex = firstIndex;
    }
    if (lastIndex < lastGlobalIndex) {
      lastGlobalIndex = lastIndex;
    }

    rows.push(measurement);
  });

  var nEntries = lastGlobalIndex - firstGlobalIndex;

  var colLabel = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.COL_LABEL
  ];

  //var dendrogramRatio = this.customSettingsValues()[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.DENDROGRAM_RATIO];
  var cluster = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings.CLUSTER
  ];
  var clusterRows =
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.ROWS ||
    cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.BOTH;
  var clusterCols =
    (cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.COLS ||
      cluster == epiviz.plugins.charts.HeatmapPlotType.Cluster.BOTH) &&
    maxColumns >= nEntries;

  var dendrogramRatio =
    this.customSettingsValues()[
      epiviz.plugins.charts.HeatmapPlotType.CustomSettings.SHOW_DENDROGRAM
    ] * this._dendrogramRatio;
  var rowLabelsAsColors = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings
      .SHOW_COLORS_FOR_ROW_LABELS
  ];
  var rowLabelColorWidth = rowLabelsAsColors ? 20 : 0; // TODO: Customize

  var width =
    this.width() * (1 - dendrogramRatio * clusterRows) - rowLabelColorWidth;
  var height = this.height() * (1 - dendrogramRatio * clusterCols);

  var globalIndices = [];
  var colnames = [];
  var i, globalIndex;

  for (i = 0; i < nEntries; ++i) {
    globalIndex = i + firstGlobalIndex;

    // Find a defined row item for the data
    var item;
    data.foreach(function(m, series) {
      item = series.getRowByGlobalIndex(globalIndex);
      return item; // break if item is defined
    });

    if (!item) {
      continue;
    }

    if (
      !dataHasGenomicLocation ||
      (range.start() == undefined || range.end() == undefined) ||
      (item.start() < range.end() && item.end() >= range.start())
    ) {
      globalIndices.push(globalIndex);
      var label = item.metadata(colLabel) || "" + item.id();
      colnames.push(label);
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
    var nextCellsPerCol = Math.ceil(colnames.length / maxColumns),
      cellsPerCol = 0;
    var colsLeft = maxColumns;
    for (var i = 0; i < colnames.length; ++i) {
      globalIndex = globalIndices[i];

      var cell = series.getByGlobalIndex(globalIndex);
      if (!cell) {
        continue;
      }
      var uiObj = null;
      if (cellsPerCol == 0) {
        var classes = sprintf("item data-series-%s", seriesIndex);

        uiObj = new epiviz.ui.charts.ChartObject(
          sprintf("heatmap_%s_%s", seriesIndex, globalIndex),
          cell.rowItem.start(),
          cell.rowItem.end(),
          [cell.value],
          seriesIndex,
          [[cell]], // valueItems one for each measurement
          [m], // measurements
          classes,
          cell.rowItem.seqName()
        );
        items.push(uiObj);

        nextCellsPerCol = Math.ceil((colnames.length - i) / colsLeft);
        cellsPerCol = nextCellsPerCol;
        --colsLeft;
      } else {
        uiObj = items[items.length - 1];
        uiObj.id += "_" + globalIndex;
        if (
          epiviz.measurements.Measurement.Type.isOrdered(
            series.measurement().type()
          )
        ) {
          uiObj.start = Math.min(uiObj.start, cell.rowItem.start());
          uiObj.end = Math.max(uiObj.end, cell.rowItem.end());
        }
        uiObj.values[0] =
          (uiObj.values[0] * uiObj.valueItems[0].length + cell.value) /
          (uiObj.valueItems[0].length + 1);
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
  this._min = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
  ];
  this._max = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MAX
  ];
  var CustomSetting = epiviz.ui.charts.CustomSetting;
  if (this._min == CustomSetting.DEFAULT) {
    this._min = data.measurements()[0].minValue();
  }
  if (this._max == CustomSetting.DEFAULT) {
    this._max = data.measurements()[0].maxValue();
  }
  if (this._globalIndexColorLabels) {
    colorLabelsMap = {};
    for (var j = firstGlobalIndex; j < lastGlobalIndex; ++j) {
      colorLabelsMap[
        this._globalIndexColorLabels[j]
      ] = this._globalIndexColorLabels[j];
    }
    this._colorLabels = Object.keys(colorLabelsMap);
    colorScales = {};
    this._colorLabels.forEach(function(label, i) {
      var color = self.colors().getByKey(label);
      colorScales[label] = epiviz.utils.colorizeBinary(
        self._min,
        self._max,
        "#ffffff",
        color
      );
    });
  } else {
    this._colorLabels = [
      sprintf(
        "Max",
        data
          .firstSeries()
          .measurement()
          .maxValue()
      )
    ];
    this._colorScale = epiviz.utils.colorizeBinary(
      this._min,
      this._max,
      "#ffffff",
      this.colors().getByKey("Max")
    );
  }

  var nCols = Math.min(colnames.length, maxColumns);
  var cellWidth = nCols ? (width - this.margins().sumAxis(Axis.X)) / nCols : 0;
  var cellHeight =
    (height - this.margins().sumAxis(Axis.Y)) / data.measurements().length;

  var itemsGroup = this._chartContent.select(".items");

  if (itemsGroup.empty()) {
    itemsGroup = this._chartContent.append("g").attr("class", "items");
    var selectedGroup = itemsGroup.append("g").attr("class", "selected");
    itemsGroup.append("g").attr("class", "hovered");
    selectedGroup.append("g").attr("class", "hovered");
  }

  itemsGroup.attr(
    "transform",
    "translate(" + this.margins().left() + ", " + this.margins().top() + ")"
  );

  var selection = itemsGroup.selectAll("rect").data(items, function(d) {
    return d.id;
  });

  this._container.find("svg").remove();

  var canvas = this.canvas;
  var hoverCanvas = this.hoverCanvas;

  // this._drawAxesCanvas(xScale, yScale, 10, 5, canvas);

  var ctx = canvas.getContext("2d");
  // ctx.globalAlpha = 0.6;
  ctx.translate(this.margins().left(), this.margins().top());

  var ctxh = hoverCanvas.getContext("2d");
  ctxh.translate(this.margins().left(), this.margins().top());

  function renderCell(item) {
    ctx.beginPath();

    var color = !self._globalIndexColorLabels
      ? self._colorScale(item.values[0])
      : colorScales[
          self._globalIndexColorLabels[item.valueItems[0][0].globalIndex]
        ](item.values[0]);

    ctx.fillStyle = color;
    // ctx.strokeStyle = "black";
    ctx.rect(
      cellWidth * colIndex[item.valueItems[0][0].globalIndex],
      cellHeight * item.seriesIndex,
      cellWidth,
      cellHeight
    );
    ctx.fill();
    // ctx.stroke();
  }

  this.renderQueue = renderQueue(renderCell);
  // .clear(clear_canvas);
  this.renderQueue(items);

  this._canvasHoverOptions = {
    colIndex: colIndex,
    cellWidth: cellWidth,
    cellHeight: cellHeight
  };

  this.addCanvasEvents(canvas, hoverCanvas, items, null, cellWidth, colIndex);

  this._drawLabelsCanvas(
    itemsGroup,
    colnames,
    globalIndices,
    nCols,
    rows,
    cellWidth,
    cellHeight,
    firstGlobalIndex,
    width
  );

  return items;
};

/**
 * @param {epiviz.ui.charts.transform.clustering.ClusterTree} dendrogram
 * @param {number} top
 * @param {number} left
 * @param {number} height
 * @param {number} width
 * @param {boolean} [horizontal]
 * @private
 */
epiviz.plugins.charts.HeatmapPlot.prototype._drawDendrogram = function(
  dendrogram,
  top,
  left,
  height,
  width,
  horizontal
) {
  var dendClass = horizontal ? "dendrogram-horizontal" : "dendrogram-vertical";
  var showLabels = false;

  var dendContainer = this._svg.append("g").attr("class", dendClass);

  if (!horizontal) {
    dendContainer.attr("transform", "translate(" + left + "," + top + ")");
    this._drawSubDendrogram(
      this._svg.select("." + dendClass),
      dendrogram.root(),
      0,
      0,
      width,
      height,
      showLabels
    );
  } else {
    dendContainer.attr(
      "transform",
      "translate(" + left + "," + top + ")scale(-1, 1)rotate(90, 0, 0)"
    );
    this._drawSubDendrogram(
      this._svg.select("." + dendClass),
      dendrogram.root(),
      0,
      0,
      width,
      height,
      showLabels
    );
  }
};

epiviz.plugins.charts.HeatmapPlot.prototype._drawDendrogramCanvas = function(
  dendrogram,
  top,
  left,
  height,
  width,
  horizontal
) {
  var dendClass = horizontal ? "dendrogram-horizontal" : "dendrogram-vertical";
  var showLabels = false;
  var canvas = this.canvas;
  var ctx = canvas.getContext("2d");

  if (!horizontal) {
    ctx.save();
    ctx.translate(left, top);
    this._drawSubDendrogramCanvas(
      canvas,
      dendrogram.root(),
      0,
      0,
      width,
      height,
      showLabels
    );
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(left, top);
    ctx.scale(-1, 1);
    ctx.rotate(Math.PI / 2);

    this._drawSubDendrogramCanvas(
      canvas,
      dendrogram.root(),
      0,
      0,
      width,
      height,
      showLabels
    );
    ctx.restore();
  }
};

epiviz.plugins.charts.HeatmapPlot.prototype._drawSubDendrogramCanvas = function(
  canvas,
  node,
  top,
  left,
  width,
  height,
  showLabels
) {
  var children = node.children();
  if (children.length == 0) {
    return top + height * 0.5;
  }

  var ctx = canvas.getContext("2d");

  var xScale = d3.scale
    .linear()
    .domain([0, node.distance()])
    .range([0, width]);
  var nextTop = 0;
  var firstY, lastY;
  for (var i = 0; i < children.length; ++i) {
    var childTop = top + nextTop;
    var childHeight = (height / node.weight()) * children[i].weight();
    var childWidth = xScale(children[i].distance());

    var yCenter = this._drawSubDendrogramCanvas(
      canvas,
      children[i],
      childTop,
      left,
      childWidth,
      childHeight,
      showLabels
    );

    ctx.beginPath();
    ctx.moveTo(left + childWidth, yCenter);
    ctx.lineTo(left + width, yCenter);
    ctx.strokeStyle = "#555555";
    ctx.stroke();

    if (i == 0 && showLabels) {
      ctx.font = "9px";
      ctx.beginPath();
      ctx.textAlign = "center";

      ctx.fillText(
        Globalize.format(node.distance(), "n2"),
        Math.max(left + 10, left + (childWidth + width) * 0.5),
        yCenter - 10
      );
    }

    if (firstY == undefined || firstY > yCenter) {
      firstY = yCenter;
    }

    if (lastY == undefined || lastY < yCenter) {
      lastY = yCenter;
    }

    nextTop += (height / node.weight()) * children[i].weight();
  }

  ctx.beginPath();
  ctx.moveTo(left + width, firstY);
  ctx.lineTo(left + width, lastY);
  ctx.strokeStyle = "#555555";
  ctx.stroke();

  return (firstY + lastY) * 0.5;
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
epiviz.plugins.charts.HeatmapPlot.prototype._drawSubDendrogram = function(
  svg,
  node,
  top,
  left,
  width,
  height,
  showLabels
) {
  var children = node.children();
  if (children.length == 0) {
    return top + height * 0.5;
  }

  var xScale = d3.scale
    .linear()
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
      showLabels
    );

    svg
      .append("line")
      .attr("x1", left + childWidth)
      .attr("x2", left + width)
      .attr("y1", yCenter)
      .attr("y2", yCenter)
      .style("stroke", "#555555")
      .style("stroke-width", 1)
      .style("shape-rendering", "auto");

    if (i == 0 && showLabels) {
      svg
        .append("text")
        .attr("class", "row-text")
        .attr("x", Math.max(left + 10, left + (childWidth + width) * 0.5))
        .attr("y", yCenter - 10)
        .style("text-anchor", "middle")
        .text(Globalize.format(node.distance(), "n2"));
    }

    if (firstY == undefined || firstY > yCenter) {
      firstY = yCenter;
    }

    if (lastY == undefined || lastY < yCenter) {
      lastY = yCenter;
    }

    nextTop += (height / node.weight()) * children[i].weight();
  }

  svg
    .append("line")
    .attr("x1", left + width)
    .attr("x2", left + width)
    .attr("y1", firstY)
    .attr("y2", lastY)
    .style("stroke", "#555555")
    .style("stroke-width", 1)
    .style("shape-rendering", "auto");

  return (firstY + lastY) * 0.5;
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
epiviz.plugins.charts.HeatmapPlot.prototype._drawLabels = function(
  itemsGroup,
  colnames,
  colids,
  columnMap,
  nCols,
  rows,
  cellWidth,
  cellHeight,
  firstGlobalIndex,
  width
) {
  var self = this;

  var mapCol = function(i, centered) {
    return i * cellWidth + (centered ? 0.5 * cellWidth : 0);
  };

  var mapRow = function(i, centered) {
    return i * cellHeight + (centered ? cellHeight * 0.5 : 0);
  };

  var measurementLabel = function(m) {
    var label;
    if (rowLabel == "name") {
      label = m.name();
    } else {
      var anno = m.annotation();
      if (!anno || !(rowLabel in anno)) {
        label = "<NA>";
      } else {
        label = anno[rowLabel];
      }
    }
    rowLabelMap[label] = label;
    return label;
  };

  // Column names
  var colSelection = itemsGroup.selectAll(".col-text");

  var maxColSize = 0;
  if (colnames.length > nCols) {
    colSelection
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();
  } else {
    colSelection = colSelection.data(colnames, function(d, i) {
      return d + columnMap[i];
    });

    colSelection
      .enter()
      .append("text")
      .attr("class", "col-text")
      .style("opacity", "0")
      .attr("x", 0)
      .attr("y", 0)
      .attr("transform", function(d, i) {
        return "translate(" + mapCol(i, true) + "," + -5 + ")rotate(-60)";
      })
      .text(function(d) {
        return d;
      })      
      .style("text-decoration", "underline")
      .on("mouseover", function(d) {d3.select(this).style("cursor", "pointer");})
      .on("mouseout", function(d) {d3.select(this).style("cursor", "default");})
      .on('click', function(d,i) {
        self._addFeaturePlot.notify({
          featureName: colnames[i],
          featureId: colids[i],
          measurements: self.measurements(),
          rowLabel: self.customSettingsValues()['rowLabel']
        });
      });

    colSelection
      .transition()
      .duration(500)
      .attr("x", 0)
      .attr("y", 0)
      .attr("transform", function(d, i) {
        return "translate(" + mapCol(i, true) + "," + -5 + ")rotate(-60)";
      })
      .style("opacity", null)
      .attr("fill", function(colName, i) {
        var globalIndex = i + firstGlobalIndex;
        if (!self._globalIndexColorLabels) {
          return "#000000";
        }
        return self
          .colors()
          .getByKey(self._globalIndexColorLabels[globalIndex]);
      });

    colSelection
      .exit()
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();

    this._container.find(" .col-text").each(function(i) {
      var textWidth = this.getBBox().width;
      if (maxColSize < textWidth) {
        maxColSize = textWidth;
      }
    });
  }

  // Row names

  var rowLabel = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL
  ];
  var rowLabelsAsColors = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings
      .SHOW_COLORS_FOR_ROW_LABELS
  ];

  if (!rowLabelsAsColors) {
    itemsGroup.selectAll(".row-color-label").remove();
    var rowSelection = itemsGroup
      .selectAll(".row-text")
      .data(rows, function(m) {
        return m.id();
      });

    rowSelection
      .enter()
      .append("text")
      .attr("class", "row-text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("transform", function(d, i) {
        return "translate(" + -5 + "," + mapRow(i, true) + ")rotate(30)";
      });

    rowSelection.text(function(m) {
      if (rowLabel == "name") {
        return m.name();
      }
      var anno = m.annotation();
      if (!anno || !(rowLabel in anno)) {
        return "<NA>";
      }
      return anno[rowLabel];
    });

    rowSelection
      .transition()
      .duration(500)
      .attr("x", 0)
      .attr("y", 0)
      .attr("transform", function(d, i) {
        return "translate(" + -5 + "," + mapRow(i, true) + ")rotate(30)";
      });

    rowSelection.exit().remove();
  }

  var rowLabelCat;
  if (rowLabelsAsColors) {
    itemsGroup.selectAll(".row-text").remove();
    var rowLabelMap = {};
    rows.forEach(function(m) {
      var label = measurementLabel(m);
      rowLabelMap[label] = label;
    });
    rowLabelCat = Object.keys(rowLabelMap);

    var rowColorLabels = itemsGroup
      .selectAll(".row-color-label")
      .data(rows, function(m) {
        return m.id();
      });

    rowColorLabels
      .enter()
      .append("rect")
      .attr("class", "row-color-label")
      .attr("x", width - self.margins().sumAxis(epiviz.ui.charts.Axis.X))
      .attr("y", -cellHeight * 0.5)
      .attr("width", 20) // TODO: Use a custom variable
      .attr("height", cellHeight)
      .attr("transform", function(d, i) {
        return "translate(" + 0 + "," + mapRow(i, true) + ")";
      });

    rowColorLabels.style("fill", function(m) {
      var label = measurementLabel(m);
      return self.colors().getByKey(label);
    });

    rowColorLabels
      .transition()
      .duration(500)
      .attr("x", width - self.margins().sumAxis(epiviz.ui.charts.Axis.X))
      .attr("y", -cellHeight * 0.5)
      .attr("height", cellHeight)
      .attr("transform", function(d, i) {
        return "translate(" + 0 + "," + mapRow(i, true) + ")";
      });

    rowColorLabels.exit().remove();
  }

  // Legend
  this._svg.selectAll(".chart-title").remove();
  this._svg.selectAll(".chart-title-color ").remove();
  var titleEntries = this._svg
    .selectAll(".chart-title")
    .data(["Min"].concat(this._colorLabels));
  titleEntries
    .enter()
    .append("text")
    .attr("class", "chart-title")
    .attr("font-weight", "bold")
    .attr("y", self.margins().top() - 5 - maxColSize);
  titleEntries
    .attr("fill", function(label, i) {
      if (i == 0) {
        return "#000000";
      }
      return self.colors().getByKey(label);
    })
    .text(function(label) {
      return label;
    });
  var textLength = 0;
  var titleEntriesStartPosition = [];

  this._container.find(" .chart-title").each(function(i) {
    titleEntriesStartPosition.push(textLength);
    textLength += this.getBBox().width + 15;
  });

  titleEntries.attr("x", function(column, i) {
    return self.margins().left() + 10 + titleEntriesStartPosition[i];
  });

  var colorEntries = this._svg
    .selectAll(".chart-title-color")
    .data(["Min"].concat(this._colorLabels))
    .enter()
    .append("circle")
    .attr("class", "chart-title-color")
    .attr("cx", function(column, i) {
      return self.margins().left() + 4 + titleEntriesStartPosition[i];
    })
    .attr("cy", self.margins().top() - 9 - maxColSize)
    .attr("r", 4)
    .style("shape-rendering", "auto")
    .style("stroke-width", "0")
    .attr("fill", function(label, i) {
      if (i == 0) {
        return "#ffffff";
      }
      return self.colors().getByKey(label);
    })
    .style("stroke-width", function(label, i) {
      return i ? 0 : 1;
    })
    .style("stroke", "#000000");

  // Row labels legend

  this._svg.selectAll(".row-legend").remove();
  this._svg.selectAll(".row-legend-color").remove();
  if (rowLabelsAsColors) {
    // TODO: Make this optional
    //rowLabelCat.sort();
    var textEntries = this._svg.selectAll(".row-legend").data(rowLabelCat);
    textEntries
      .enter()
      .append("text")
      .attr("class", "row-legend")
      .attr("font-weight", "bold")
      .attr("x", -20);
    textEntries
      .attr("fill", function(label) {
        return self.colors().getByKey(label);
      })
      .text(function(label) {
        return label;
      })
      .attr("transform", function(d, i) {
        return (
          "translate(" +
          self.margins().left() +
          "," +
          self.margins().top() +
          ")"
        );
      });

    textEntries.attr("y", function(label, i) {
      return 10 + i * 15;
    });

    this._svg
      .selectAll(".row-legend-color")
      .data(rowLabelCat)
      .enter()
      .append("rect")
      .attr("class", "chart-title-color")
      .attr("x", -18)
      .attr("y", function(label, i) {
        return 2 + i * 15;
      })
      .attr("width", 10)
      .attr("height", 10)
      .style("shape-rendering", "auto")
      .style("stroke-width", "0")
      .attr("fill", function(label) {
        return self.colors().getByKey(label);
      })
      .style("stroke-width", 0)
      .attr("transform", function(d, i) {
        return (
          "translate(" +
          self.margins().left() +
          "," +
          self.margins().top() +
          ")"
        );
      });

    this._colorLabels = this._colorLabels.concat(rowLabelCat);
  }
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
epiviz.plugins.charts.HeatmapPlot.prototype._drawLabelsCanvas = function(
  itemsGroup,
  colnames,
  columnMap,
  nCols,
  rows,
  cellWidth,
  cellHeight,
  firstGlobalIndex,
  width
) {
  var self = this;

  var mapCol = function(i, centered) {
    return i * cellWidth + (centered ? 0.5 * cellWidth : 0);
  };

  var mapRow = function(i, centered) {
    return i * cellHeight + (centered ? cellHeight * 0.5 : 0);
  };

  var measurementLabel = function(m) {
    var label;
    if (rowLabel == "name") {
      label = m.name();
    } else {
      var anno = m.annotation();
      if (!anno || !(rowLabel in anno)) {
        label = "<NA>";
      } else {
        label = anno[rowLabel];
      }
    }
    rowLabelMap[label] = label;
    return label;
  };

  // Column names
  var maxColSize = 0;
  var ctx = self.canvas.getContext("2d");

  colnames.forEach(function(c, i) {
    var name = c + columnMap[i];
    ctx.save();
    ctx.translate(mapCol(i, true), -5);
    ctx.rotate(-Math.PI / 4);
    var color = "#000000";
    if (self._globalIndexColorLabels) {
      var globalIndex = i + firstGlobalIndex;

      color = self.colors().getByKey(self._globalIndexColorLabels[globalIndex]);
    }

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.font = "9px";
    ctx.beginPath();
    ctx.textAlign = "start";
    ctx.fillText(name, 0, 0);
    ctx.restore();
  });

  // Row names

  var rowLabel = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL
  ];
  var rowLabelsAsColors = this.customSettingsValues()[
    epiviz.plugins.charts.HeatmapPlotType.CustomSettings
      .SHOW_COLORS_FOR_ROW_LABELS
  ];

  if (!rowLabelsAsColors) {
    rows.forEach(function(r, i) {
      var name = r.id();

      if (rowLabel == "name") {
        name = r.name();
      } else {
        var anno = r.annotation();

        if (!anno || !(rowLabel in anno)) {
          name = "<NA>";
        } else {
          name = anno[rowLabel];
        }
      }

      ctx.save();
      ctx.translate(-8, mapRow(i, true));
      ctx.rotate(Math.PI / 3);
      var color = "black";

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.font = "9px";
      ctx.beginPath();
      ctx.textAlign = "right";
      ctx.fillText(name, 0, 0);
      ctx.restore();
    });
  }

  var rowLabelCat;
  if (rowLabelsAsColors) {
    itemsGroup.selectAll(".row-text").remove();
    var rowLabelMap = {};
    rows.forEach(function(m) {
      var label = measurementLabel(m);
      rowLabelMap[label] = label;
    });
    rowLabelCat = Object.keys(rowLabelMap);

    rows.forEach(function(r, i) {
      ctx.beginPath();
      var label = measurementLabel(r);
      var color = self.colors().getByKey(label);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.fillRect(
        width - self.margins().sumAxis(epiviz.ui.charts.Axis.X),
        mapRow(i, true) - cellHeight * 0.5,
        20,
        cellHeight
      );
    });
  }

  // Legend
  var textIndent = 0;

  ["Min"].concat(this._colorLabels).forEach(function(c, i) {
    var name = c;

    var color = i == 0 ? "#000000" : self.colors().getByKey(c);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.beginPath();

    ctx.arc(
      textIndent - 2,
      -self.margins().top() - maxColSize,
      4,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();
    ctx.font = "9px";
    ctx.beginPath();
    ctx.textAlign = "start";
    var circleIndent = 8;

    ctx.fillText(
      name,
      textIndent + circleIndent,
      -self.margins().top() - maxColSize + 4
    );

    var textWidth = ctx.measureText(name).width;
    textIndent = textIndent + circleIndent + textWidth + 10;
  });

  // Row labels legend

  if (rowLabelsAsColors) {
    // TODO: Make this optional
    //rowLabelCat.sort();
    ctx.globalAlpha = 1;
    rowLabelCat.forEach(function(c, i) {
      var name = c;
      var color = self.colors().getByKey(name);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.fillRect(-13, 55 - self.margins().top() + (2 + i) * 15, 10, 10);
      ctx.font = "9px";
      ctx.beginPath();
      ctx.textAlign = "right";

      ctx.fillText(name, -18, 60 - self.margins().top() + (2 + i) * 15);

      var textWidth = ctx.measureText(name).width;
    });

    this._colorLabels = this._colorLabels.concat(rowLabelCat);
  }
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.HeatmapPlot.prototype.colorLabels = function() {
  return this._colorLabels;
};

epiviz.plugins.charts.HeatmapPlot.prototype.addCanvasEvents = function(
  canvas,
  hoverCanvas,
  dataItems,
  xScale,
  cellWidth,
  colIndex
) {
  var self = this;
  var ctx = hoverCanvas.getContext("2d");

  self.hoverCanvasObjects = dataItems;
  // var margins = self.margins();
  var width = self.width();
  var height = self.height();
  var Axis = epiviz.ui.charts.Axis;

  hoverCanvas.addEventListener("click", function(event) {
    // var rect = hoverCanvas.getBoundingClientRect();
    // var x = event.clientX - rect.left;
    // var y = event.clientY - rect.top;
  });

  hoverCanvas.addEventListener("mousemove", function(event) {
    var rect = hoverCanvas.getBoundingClientRect();

    var x = event.offsetX - self.margins().left();
    var xVal = x;
    var elem = null;

    if (dataItems) {
      dataItems.forEach(function(r) {
        var calcWidth = cellWidth * colIndex[r.valueItems[0][0].globalIndex];
        if (xVal >= calcWidth && xVal <= calcWidth + cellWidth) {
          elem = r;
        }
      });
    }

    if (elem) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), elem));
    }
  });

  hoverCanvas.addEventListener("mouseout", function(event) {
    //remove hover elements
    self._canvasHoverObject = null;
    ctx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
    self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
  });
};

/**
 * @param {epiviz.ui.charts.VisObject} selectedObject
 */
epiviz.plugins.charts.HeatmapPlot.prototype.doHover = function(selectedObject) {
  epiviz.ui.charts.Plot.prototype.doHover.call(this, selectedObject);

  var self = this;
  if (this.chartDrawType == "canvas") {
    var ctx = this.hoverCanvas.getContext("2d");
    ctx.clearRect(0, 0, this.hoverCanvas.width, this.hoverCanvas.height);

    var cellWidth = self._canvasHoverOptions.cellWidth;
    var colIndex = self._canvasHoverOptions.colIndex;
    var cellHeight = self._canvasHoverOptions.cellHeight;
    this._canvasHoverObject = selectedObject;

    this.hoverCanvasObjects.forEach(function(r) {
      if (r.overlapsWith(selectedObject)) {
        ctx.strokeStyle = "yellow";
        ctx.strokeRect(
          cellWidth * colIndex[r.valueItems[0][0].globalIndex],
          cellHeight * r.seriesIndex,
          cellWidth,
          cellHeight
        );
      }
    });
    return;
  }
  var itemsGroup = this._container.find(".items");
  var unselectedHoveredGroup = itemsGroup.find("> .hovered");
  var selectedGroup = itemsGroup.find("> .selected");
  var selectedHoveredGroup = selectedGroup.find("> .hovered");

  var filter = function() {
    if (Array.isArray(selectedObject)) {
      var match = false;

      for (var sIndex = 0; sIndex < selectedObject.length; sIndex++) {
        var sel = selectedObject[sIndex];
        if (sel.overlapsWith(d3.select(this).data()[0])) {
          match = true;
        }
      }

      return match;
    } else {
      return selectedObject.overlapsWith(d3.select(this).data()[0]);
    }
  };
  var selectItems = itemsGroup.find("> .item").filter(filter);
  unselectedHoveredGroup.append(selectItems);

  selectItems = selectedGroup.find("> .item").filter(filter);
  selectedHoveredGroup.append(selectItems);
};

epiviz.plugins.charts.HeatmapPlot.prototype._applyLogTransformation = function(lData, callback) {

  var self = this;
  var sumExp = new epiviz.datatypes.PartialSummarizedExperiment();
  var counter = 0;

  lData.foreach(function(measurement, series, seriesIndex) {
    if(counter == 0) {
      var rowData = series._container.rowData(measurement);
      sumExp._rowData = rowData;
      counter++;
    }

    var featureValues = series._container.values(measurement);
    var valData = [];

    if(featureValues._values != undefined) {
      featureValues._values.forEach(function(val, i) {
        valData[i] = Math.log2(val + 1); 
      });
    }
    else {
      valData = undefined;
    }

    var newValueData = new epiviz.datatypes.FeatureValueArray(measurement, featureValues._boundaries, featureValues._globalStartIndex, valData);

    sumExp.addValues(newValueData);
  });

  var msDataMap = new epiviz.measurements.MeasurementHashtable();

  lData.foreach(function(m) {
    m._maxValue = Math.log2(m._maxValue + 1);
    m._minValue = Math.log2(m._minValue + 1);
    var msData = new epiviz.datatypes.MeasurementGenomicDataWrapper(m, sumExp);
    msDataMap.put(m, msData);
  });

  var genomicData = new epiviz.datatypes.MapGenomicData(msDataMap);
  callback(genomicData);
};
