/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/16/13
 * Time: 9:35 AM
 */

goog.provide("epiviz.plugins.charts.StackedBlocksTrack");

goog.require("epiviz.ui.charts.Track");
goog.require("epiviz.ui.charts.Axis");
goog.require("epiviz.ui.charts.ChartObject");
goog.require("epiviz.ui.charts.VisEventArgs");
goog.require("epiviz.ui.charts.Visualization");

/**
 * @param id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.StackedBlocksTrack = function (id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.StackedBlocksTrack.prototype = epiviz.utils.mapCopy(
  epiviz.ui.charts.Track.prototype
);
epiviz.plugins.charts.StackedBlocksTrack.constructor =
  epiviz.plugins.charts.StackedBlocksTrack;

/**
 * @protected
 */
epiviz.plugins.charts.StackedBlocksTrack.prototype._initialize = function () {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);

  this._svg.classed("blocks-track", true);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.StackedBlocksTrack.prototype.draw = function (
  range,
  data,
  slide,
  zoom
) {
  epiviz.ui.charts.Track.prototype.draw.call(this, range, data, slide, zoom);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range || !data.isReady()) {
    return [];
  }

  return this._drawBlocks(range, data, slide || 0, zoom || 1);
};

epiviz.plugins.charts.StackedBlocksTrack.prototype.drawCanvas = function (
  range,
  data,
  slide,
  zoom
) {
  epiviz.ui.charts.Track.prototype.draw.call(this, range, data, slide, zoom);

  // If data is defined, then the base class sets this._lastData to data.
  // If it isn't, then we'll use the data from the last draw call
  data = this._lastData;
  range = this._lastRange;

  // If data is not defined, there is nothing to draw
  if (!data || !range || !data.isReady()) {
    return [];
  }

  return this._drawBlocksCanvas(range, data, slide || 0, zoom || 1);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} slide
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.StackedBlocksTrack.prototype._drawBlocks = function (
  range,
  data,
  slide,
  zoom
) {

  var self = this;
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

  var minBlockDistance = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings
      .MIN_BLOCK_DISTANCE
  ];

  var colorLabel = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.BLOCK_COLOR_BY
  ];

  var useColorBy = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.USE_COLOR_BY
  ];

  var isColor = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.IS_COLOR
  ];

  var scaleLabel = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.BLOCK_SCALE_BY
  ];

  var useScaleBy = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.USE_SCALE_BY
  ];

  var minY = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
  ];

  var maxY = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MAX
  ];

  self._isColorLabels = {};

  var colorBy = function (row) {
    if(useColorBy) {
      if(isColor) {
        if (row.valueItems[0][0].rowItem.metadata("name")) {
          self._isColorLabels[row.valueItems[0][0].rowItem.metadata("name")] = "rgb(" + row.values +")";

        } else if (row.valueItems[0][0].rowItem.metadata("mnemonic")) {
          self._isColorLabels[row.valueItems[0][0].rowItem.metadata("mnemonic")] = "rgb(" + row.values +")";
        } else {
          self._isColorLabels["rgb(" + row.values +")"] = "rgb(" + row.values + ")";
        }
        return "rgb(" + row.values + ")";
      }

      self._isColorLabels[colors.getByKey(row.values)] = "rgb(" + row.values + ")";
      return colors.getByKey(row.values)
    }
    return colors.get(row.seriesIndex);
  };

  var marginLegend = 0;
  if (useColorBy) {
    marginLegend = 50;
  }

  var xScale = d3.scale
    .linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X) - marginLegend]);
  var delta = (slide * (width - margins.sumAxis(Axis.X) - marginLegend)) / (end - start);

  var CustomSetting = epiviz.ui.charts.CustomSetting;

  var dataMin = 100000, dataMax = -100000;
  data.foreach(function(m, series) {
    var fMin = dataMin, fMax = dataMax;
    var drawBoundaries = series.binarySearchStarts(range);
      if (drawBoundaries.length > 0) {
        var indices = epiviz.utils
        .range(drawBoundaries.length, drawBoundaries.index);

        for (var k = 0; k < indices.length; ++k) {
          var cell = series.get(indices[k]);

          if (parseFloat(cell.rowItem.rowMetadata()[scaleLabel]) < fMin) {
            fMin = parseFloat(cell.rowItem.rowMetadata()[scaleLabel]);
          }

          if (parseFloat(cell.rowItem.rowMetadata()[scaleLabel]) > fMax) {
            fMax = parseFloat(cell.rowItem.rowMetadata()[scaleLabel]);
          }
        }
      }

    if (fMin < dataMin) { dataMin = fMin;} 
    if (fMax > dataMax) { dataMax = fMax;}
  });

  var dataRange = [dataMin, dataMax];
  
  if (minY == CustomSetting.DEFAULT) {
    minY = dataRange[0];
  }

  if (maxY == CustomSetting.DEFAULT) {
    maxY = dataRange[1];
  }

  if (minY === null && maxY === null) {
    minY = -1;
    maxY = 1;
  }
  if (minY === null) {
    minY = maxY - 1;
  }
  if (maxY === null) {
    maxY = minY + 1;
  }

  this._clearAxes();
  this._drawAxes(xScale, null, 10, 5);

  var self = this;
  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var blocks = [];

  var i = 0;

  data.foreach(function (m, series, seriesIndex) {
    var seriesBlocks = [];

    for (var j = 0; j < series.size(); ++j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);

      if (
        cell.rowItem.start() > range.end() ||
        cell.rowItem.end() < range.start()
      ) {
        continue;
      }

      var classes = sprintf("item data-series-%s", i);

      if (minBlockDistance !== null && seriesBlocks.length > 0) {
        var lastBlock = seriesBlocks[seriesBlocks.length - 1];
        var start = xScale(cell.rowItem.start());
        var lastEnd = xScale(lastBlock.end);

        if (start - lastEnd < minBlockDistance) {
          if (useColorBy) {
            if (lastBlock.values == cell.rowItem.metadata(colorLabel)) {
              lastBlock.end = Math.max(lastBlock.end, cell.rowItem.end());
            }
          }
          else {
            lastBlock.end = Math.max(lastBlock.end, cell.rowItem.end());
          }
          lastBlock.valueItems[0].push(cell);
          lastBlock.id = sprintf(
            "b-%s-%s-%s",
            i,
            lastBlock.start,
            lastBlock.end
          );
          continue;
        }
      }

      seriesBlocks.push(
        new epiviz.ui.charts.ChartObject(
          sprintf("b-%s-%s-%s", i, cell.rowItem.start(), cell.rowItem.end()),
          cell.rowItem.start(),
          cell.rowItem.end(),
          cell.rowItem.metadata(colorLabel),
          i, // seriesIndex
          [[cell]], // valueItems
          [m], // measurements
          classes
        )
      );
    }

    blocks = blocks.concat(seriesBlocks);
    ++i;
  });

  var items = this._svg.select(".items");
  var selected = items.select(".selected");
  var clipPath = this._svg.select("#clip-" + this.id());
  var textheight = 5; //13

  if (items.empty()) {
    if (clipPath.empty()) {
      this._svg
        .select("defs")
        .append("clipPath")
        .attr("id", "clip-" + this.id())
        .append("rect")
        .attr("class", "clip-path-rect");
    }

    items = this._svg
      .append("g")
      .attr("class", "items")
      .attr("id", this.id() + "-gene-content")
      .attr("clip-path", "url(#clip-" + this.id() + ")");

    selected = items.append("g").attr("class", "selected");
    items.append("g").attr("class", "hovered");
    selected.append("g").attr("class", "hovered");
  }

  items.attr(
    "transform",
    "translate(" + margins.left() + ", " + margins.top() + ")"
  );

  this._svg
    .select(".clip-path-rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width - margins.sumAxis(Axis.X))
    .attr("height", height - margins.sumAxis(Axis.Y));

  items.selectAll(".item").remove();

  var selection = items.selectAll(".item").data(blocks, function (b) {
    return b.id;
  });

  var seriesBlockHeight = (height - margins.sumAxis(Axis.Y)) / i;

  selection
    .enter()
    .insert("rect", ":first-child")
    .attr("class", function (b) {
      return b.cssClasses;
    })
    .style("fill", function (b) {
      return colorBy(b);
    })
    .attr("x", function (b) {
      return xScale(b.start) / zoom + delta;
    })
    .attr("y", function (b) {

      if (useScaleBy) {
        var fracVal = (parseFloat(b.valueItems[0][0].rowItem.metadata(scaleLabel)) - minY)/(maxY - minY);
        return (((b.seriesIndex + 1) * seriesBlockHeight) + textheight) 
          - (fracVal * (seriesBlockHeight - textheight)); 
      }

      return (b.seriesIndex * seriesBlockHeight) + textheight;
    })
    .attr("width", function (b) {
      // We're using b.end + 1 since b.end is the index of the last covered bp
      return zoom * (xScale(b.end + 1) - xScale(b.start));
    })
    .attr("height", function (b) {
      if (useScaleBy) {
        var fracVal = (parseFloat(b.valueItems[0][0].rowItem.metadata(scaleLabel)) - minY)/(maxY - minY);
        return fracVal * (seriesBlockHeight - textheight) 
      }
      return seriesBlockHeight - textheight;
    })
    .on("mouseout", function () {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .on("mouseover", function (b) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), b));
    })
    .on("click", function (b) {
      self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), b));
      d3.event.stopPropagation();
    });

  selection
    .attr("class", function (b) {
      return b.cssClasses;
    })
    // .attr('height', height - margins.sumAxis(Axis.Y))
    // .attr('y', 0)
    .transition()
    .duration(500);

  selection
    .exit()
    .transition()
    .duration(500)
    .remove();

  if (useColorBy) {

    this._svg
        .selectAll(".chart-title-label").remove();

    console.log(self._isColorLabels);
    var titleEntries = this._svg
        .selectAll(".chart-title-label")
        .data(Object.keys(self._isColorLabels))
        .enter()
        .append("text")
        .attr("class", "chart-title-label")
        .attr("font-weight", "bold")
        .attr("fill", function(m, i) {
          return self._isColorLabels[m];
        })
        .attr("y", self.margins().top() - 10)
        .text(function(m, i) {
            return m;
        });

    var textLength = 0;
    var titleEntriesStartPosition = [];

    this._container.find(" .chart-title-label").each(function(i) {
        titleEntriesStartPosition.push(textLength);
        textLength += this.getBBox().width + 15;
    });

    titleEntries.attr("x", function(column, i) {
        return self.margins().left() + 10 + titleEntriesStartPosition[i];
    });

    var colorEntries = this._svg
        .selectAll(".chart-title-color")
        .data(measurements)
        .enter()
        .append("circle")
        .attr("class", "chart-title-color")
        .attr("cx", function(column, i) {
            return self.margins().left() + 4 + titleEntriesStartPosition[i];
        })
        .attr("cy", self.margins().top() - 9)
        .attr("r", 4)
        .style("shape-rendering", "auto")
        .style("stroke-width", "0")
        .style("fill", function(m, i) {
          return self._isColorLabels[m];
        });
  }

  return blocks;
};

epiviz.plugins.charts.StackedBlocksTrack.prototype._drawBlocksCanvas = function (
  range,
  data,
  slide,
  zoom
) {
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

  var minBlockDistance = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings
      .MIN_BLOCK_DISTANCE
  ];

  var colorLabel = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.BLOCK_COLOR_BY
  ];

  var useColorBy = this.customSettingsValues()[
    epiviz.plugins.charts.StackedBlocksTrackType.CustomSettings.USE_COLOR_BY
  ];

  var colorBy = function (row) {
    if (data.measurements().length > 1) {
      return colors.get(row.seriesIndex);
    }

    return useColorBy
      ? colors.getByKey(row.values)
      : colors.get(row.seriesIndex);
  };

  var xScale = d3.scale
    .linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X)]);
  var delta = (slide * (width - margins.sumAxis(Axis.X))) / (end - start);

  this._container.find("svg").remove();
  this._container.find("#" + this.id() + "-canvas").remove();
  var canvas = document.createElement("canvas");
  this.chartDrawType = "canvas";
  this.canvas = canvas;
  canvas.id = this.id() + "-canvas";
  this._container.append(canvas);
  canvas.width = this.width();
  canvas.height = this.height();
  canvas.style = "position:absolute;top:0;left:0;width:100%;height:100%";

  this._container.find("#" + this.id() + "-hoverCanvas").remove();
  var hoverCanvas = document.createElement("canvas");
  this.hoverCanvas = hoverCanvas;
  hoverCanvas.id = this.id() + "-hoverCanvas";
  this._container.append(hoverCanvas);
  hoverCanvas.width = this.width();
  hoverCanvas.height = this.height();
  hoverCanvas.style =
    "position:absolute;top:0;left:0;width:100%;height:100%;z-index:1";
  this._drawAxesCanvas(xScale, null, 10, 5, canvas);

  var self = this;
  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var blocks = [];

  var i = 0;
  var textheight = 7;

  data.foreach(function (m, series, seriesIndex) {
    var seriesBlocks = [];

    for (var j = 0; j < series.size(); ++j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);

      if (
        cell.rowItem.start() > range.end() ||
        cell.rowItem.end() < range.start()
      ) {
        continue;
      }

      var classes = sprintf("item data-series-%s", i);

      if (minBlockDistance !== null && seriesBlocks.length > 0) {
        var lastBlock = seriesBlocks[seriesBlocks.length - 1];
        var start = xScale(cell.rowItem.start());
        var lastEnd = xScale(lastBlock.end);

        if (start - lastEnd < minBlockDistance) {
          if (useColorBy) {
            if (lastBlock.values == cell.rowItem.metadata(colorLabel)) {
              lastBlock.end = Math.max(lastBlock.end, cell.rowItem.end());
            }
          }
          else {
            lastBlock.end = Math.max(lastBlock.end, cell.rowItem.end());
          }
          lastBlock.valueItems[0].push(cell);
          lastBlock.id = sprintf(
            "b-%s-%s-%s",
            i,
            lastBlock.start,
            lastBlock.end
          );
          continue;
        }
      }

      seriesBlocks.push(
        new epiviz.ui.charts.ChartObject(
          sprintf("b-%s-%s-%s", i, cell.rowItem.start(), cell.rowItem.end()),
          cell.rowItem.start(),
          cell.rowItem.end(),
          cell.rowItem.metadata(colorLabel),
          i, // seriesIndex
          [[cell]], // valueItems
          [m], // measurements
          classes
        )
      );
    }

    blocks = blocks.concat(seriesBlocks);
    ++i;
  });

  var items = this._svg.select(".items");
  var selected = items.select(".selected");
  var clipPath = this._svg.select("#clip-" + this.id());

  if (items.empty()) {
    if (clipPath.empty()) {
      this._svg
        .select("defs")
        .append("clipPath")
        .attr("id", "clip-" + this.id())
        .append("rect")
        .attr("class", "clip-path-rect");
    }

    items = this._svg
      .append("g")
      .attr("class", "items")
      .attr("id", this.id() + "-gene-content")
      .attr("clip-path", "url(#clip-" + this.id() + ")");

    selected = items.append("g").attr("class", "selected");
    items.append("g").attr("class", "hovered");
    selected.append("g").attr("class", "hovered");
  }

  items.attr(
    "transform",
    "translate(" + margins.left() + ", " + margins.top() + ")"
  );

  this._svg
    .select(".clip-path-rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width - margins.sumAxis(Axis.X))
    .attr("height", height - margins.sumAxis(Axis.Y));

  items.selectAll(".item").remove();

  var selection = items.selectAll(".item").data(blocks, function (b) {
    return b.id;
  });

  var seriesBlockHeight = (height - margins.sumAxis(Axis.Y)) / i;

  var ctx = canvas.getContext("2d");
  ctx.globalAlpha = 0.6;
  ctx.translate(margins.left(), margins.top());

  var ctxh = hoverCanvas.getContext("2d");
  ctxh.translate(margins.left(), margins.top());

  blocks.forEach(function (b) {
    ctx.beginPath();

    ctx.fillStyle = colorBy(b);
    ctx.strokeStyle = "black";
    ctx.rect(
      xScale(b.start) / zoom + delta,
      b.seriesIndex * seriesBlockHeight,
      zoom * (xScale(b.end + 1) - xScale(b.start)),
      seriesBlockHeight
    );
    ctx.fill();
    ctx.stroke();
  });

  this.addCanvasEvents(canvas, hoverCanvas, blocks, xScale);

  this._drawLegend();

  return blocks;
};

/**
 * @param {epiviz.ui.charts.ColorPalette} colors
 */
epiviz.plugins.charts.StackedBlocksTrack.prototype.setColors = function (
  colors
) {
  this.container()
    .find(".items")
    .remove();
  epiviz.ui.charts.Visualization.prototype.setColors.call(this, colors);
};
