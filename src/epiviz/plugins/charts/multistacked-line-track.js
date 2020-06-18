/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 9:30 AM
 */

goog.provide("epiviz.plugins.charts.MultiStackedLineTrack");

goog.require("epiviz.ui.charts.Track");
goog.require("epiviz.ui.charts.Axis");
goog.require("epiviz.ui.charts.ChartObject");
goog.require("epiviz.ui.charts.VisEventArgs");
goog.require("epiviz.utils");
goog.require("epiviz.datatypes.GenomicRange");
goog.require("epiviz.ui.charts.CustomSetting");

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.MultiStackedLineTrack = function (id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.MultiStackedLineTrack.prototype = epiviz.utils.mapCopy(
  epiviz.ui.charts.Track.prototype
);
epiviz.plugins.charts.MultiStackedLineTrack.constructor = epiviz.plugins.charts.MultiStackedLineTrack;

/**
 * @protected
 */
epiviz.plugins.charts.MultiStackedLineTrack.prototype._initialize = function () {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.MultiStackedLineTrack.prototype.drawCanvas = function (
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

  slide = slide || this._slide || 0;
  zoom = zoom || this._zoom || 1;
  this._slide = 0;
  this._zoom = 1;

  // If data is not defined, there is nothing to draw
  if (!data || !range) {
    return [];
  }

  var CustomSetting = epiviz.ui.charts.CustomSetting;
  var minY = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
  ];
  var maxY = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MAX
  ];

  var dataRange = this.getDataMinMax(data);
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

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale
    .linear()
    .domain([range.start(), range.end()])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);
  var yScale = d3.scale
    .linear()
    .domain([minY, maxY])
    .range([this.height() - this.margins().sumAxis(Axis.Y), 0]);

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

  var ctx = canvas.getContext("2d");
  ctx.translate(this.margins().left(), this.margins().top());

  var ctxh = hoverCanvas.getContext("2d");
  ctxh.translate(this.margins().left(), this.margins().top());

  var delta =
    (slide * (this.width() - this.margins().sumAxis(Axis.X))) / range.width();
  var linesGroup = this._svg.selectAll(".lines");

  if (linesGroup.empty()) {
    linesGroup = this._svg
      .append("g")
      .attr("class", "lines")
      .attr(
        "transform",
        "translate(" + this.margins().left() + ", " + this.margins().top() + ")"
      );
  }

  data.measurements().forEach(function (m, i) {
    var lineSeries = linesGroup.selectAll(".line-series-index-" + i);
    var pointSeries = linesGroup.selectAll(".point-series-index-" + i);

    if (lineSeries.empty()) {
      linesGroup.append("g").attr("class", "line-series-index-" + i);
    }
    if (pointSeries.empty()) {
      linesGroup.append("g").attr("class", "point-series-index-" + i);
    }
  });

  for (var i = data.measurements().length; ; ++i) {
    var lineSeries = linesGroup.selectAll(".line-series-index-" + i);
    var pointSeries = linesGroup.selectAll(".point-series-index-" + i);
    if (lineSeries.empty()) {
      break;
    }
    lineSeries.remove();
    pointSeries.remove();
  }

  this.addCanvasEvents(canvas, hoverCanvas, null, xScale);
  this._drawLegend();

  return this._drawLinesCanvas(
    range,
    data,
    delta,
    zoom,
    xScale,
    yScale,
    canvas
  );
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.MultiStackedLineTrack.prototype.draw = function (
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

  slide = slide || this._slide || 0;
  zoom = zoom || this._zoom || 1;
  this._slide = 0;
  this._zoom = 1;

  // If data is not defined, there is nothing to draw
  if (!data || !range) {
    return [];
  }

  var CustomSetting = epiviz.ui.charts.CustomSetting;
  var minY = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
  ];
  var maxY = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MAX
  ];

  var dataRange = this.getDataMinMax(data);
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
    minY = minY - 1;
  }
  if (maxY === null) {
    maxY = maxY + 1;
  }

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale
    .linear()
    .domain([range.start(), range.end()])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);
  var yScale = d3.scale
    .linear()
    .domain([minY, maxY])
    .range([this.height() - this.margins().sumAxis(Axis.Y), 0]);

  this._clearAxes();
  this._drawAxes(xScale, null, 10, 5);

  var delta =
    (slide * (this.width() - this.margins().sumAxis(Axis.X))) / range.width();
  var linesGroup = this._svg.selectAll(".lines");

  if (linesGroup.empty()) {
    linesGroup = this._svg
      .append("g")
      .attr("class", "lines")
      .attr(
        "transform",
        "translate(" + this.margins().left() + ", " + this.margins().top() + ")"
      );
  }

  data.measurements().forEach(function (m, i) {
    var lineSeries = linesGroup.selectAll(".line-series-index-" + i);
    var pointSeries = linesGroup.selectAll(".point-series-index-" + i);

    if (lineSeries.empty()) {
      linesGroup.append("g").attr("class", "line-series-index-" + i);
    }
    if (pointSeries.empty()) {
      linesGroup.append("g").attr("class", "point-series-index-" + i);
    }
  });

  for (var i = data.measurements().length; ; ++i) {
    var lineSeries = linesGroup.selectAll(".line-series-index-" + i);
    var pointSeries = linesGroup.selectAll(".point-series-index-" + i);
    if (lineSeries.empty()) {
      break;
    }
    lineSeries.remove();
    pointSeries.remove();
  }

  return this._drawLines(range, data, delta, zoom, xScale, yScale, minY, maxY);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} delta
 * @param {number} zoom
 * @param {function} xScale D3 linear scale
 * @param {function} yScale D3 linear scale
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.MultiStackedLineTrack.prototype._drawLines = function (
  range,
  data,
  delta,
  zoom,
  xScale,
  yScale,
  minY,
  maxY
) {
  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  /** @type {number} */
  var step = parseInt(
    this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.STEP
    ]
  );

  /** @type {boolean} */
  var showPoints = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_POINTS
  ];

  /** @type {boolean} */
  var showLines = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_LINES
  ];

  /** @type {boolean} */
  var showFill = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_FILL
  ];

  /** @type {boolean} */
  var showErrorBars = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_ERROR_BARS
  ];

  /** @type {number} */
  var pointRadius = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.POINT_RADIUS
  ];

  /** @type {number} */
  var lineThickness = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.LINE_THICKNESS
  ];

  var interpolation = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.INTERPOLATION
  ];

  var absLine = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.ABS_LINE_VAL
  ];

  var showYAxis = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_Y_AXIS
  ];


  var self = this;

  var invXScale = d3.scale
    .linear()
    .domain([0, this.width() - this.margins().sumAxis(epiviz.ui.charts.Axis.X)])
    .range([range.start(), range.end()]);
  var deltaInBp = invXScale(delta) - range.start();
  var extendedRange = epiviz.datatypes.GenomicRange.fromStartEnd(
    range.seqName(),
    Math.min(range.start(), range.start() + deltaInBp),
    Math.max(range.end(), range.end() + deltaInBp),
    range.genome()
  );

  var showTracks = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_TRACKS
  ];

  var seriesLineHeight = (self.height() - self.margins().sumAxis(epiviz.ui.charts.Axis.Y)) / data.measurements().length;

  if (showTracks != "default")  {
    var tracks = showTracks.split(",");
    seriesLineHeight = (self.height() - self.margins().sumAxis(epiviz.ui.charts.Axis.Y)) / tracks.length;
  }
  var trackCount = 0;

  var graph = this._svg.select(".lines");

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];
  var sminY = 1000; smaxY = -1000;

  var yTicksSeries = ["0"]

  data.foreach(function (m, series, i) {

    var skip = false;

    if (showTracks != "default") {
      var tracks = showTracks.split(",");
      if (!tracks.includes(m.id())) {
        skip = true;
      }
    }

    if (!skip) {
      var color = self._measurementColorLabels
      ? colors.getByKey(self._measurementColorLabels.get(m))
      : colors.get(trackCount);

      /** @type {{index: ?number, length: number}} */
      var drawBoundaries = series.binarySearchStarts(extendedRange);
      if (drawBoundaries.length == 0) {
        return;
      }

      // TODO: In the future, use global index to align steps:
      //var globalIndex = series.get(drawBoundaries.index).globalIndex;
      //globalIndex = Math.ceil(globalIndex / step) * step;
      var index = Math.ceil(drawBoundaries.index / step) * step;
      drawBoundaries.length = Math.max(
        0,
        drawBoundaries.length - index + drawBoundaries.index
      );
      drawBoundaries.index = index;

      var indices = epiviz.utils
        .range(drawBoundaries.length, drawBoundaries.index)
        .filter(function (i) {
          return !step || step <= 1 || (i - drawBoundaries.index) % step == 0;
        });

      for (var k = 0; k < indices.length; ++k) {
        var cell = series.get(indices[k]);
        items.push(
          new epiviz.ui.charts.ChartObject(
            sprintf("line_%s_%s", trackCount, cell.globalIndex),
            cell.rowItem.start(),
            cell.rowItem.end(),
            [cell.value],
            trackCount,
            [[cell]],
            [m],
            sprintf("item data-series-%s", trackCount),
            cell.rowItem.seqName()
          )
        );

        if (cell.value < sminY) {
          sminY = cell.value;
        }

        if (cell.value > smaxY) {
          smaxY = cell.value;
        }
      }
      
      var CustomSetting = epiviz.ui.charts.CustomSetting;
      var stminY = self.customSettingsValues()[
        epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
      ];
      var stmaxY = self.customSettingsValues()[
        epiviz.ui.charts.Visualization.CustomSettings.Y_MAX
      ];
    
      if (stminY == CustomSetting.DEFAULT) {
        stminY = sminY;
      }
    
      if (stmaxY == CustomSetting.DEFAULT) {
        stmaxY = smaxY;
      }

      var yScaleSeries = d3.scale
        .linear()
        .domain([stminY, stmaxY])
        .range([(trackCount+1) * seriesLineHeight, (trackCount) * seriesLineHeight]);

      // yTicksSeries.push(String(stmaxY) + ", " + String(stminY));

      var x = function (j) {
        /** @type {epiviz.datatypes.GenomicData.ValueItem} */
        var cell = series.get(j);
        return xScale(cell.rowItem.start());
      };

      var y = function (j) {
        /** @type {epiviz.datatypes.GenomicData.ValueItem} */
        var cell = series.get(j);
        return yScaleSeries(cell.value);
      };

      var errMinus = function (j) {
        /** @type {epiviz.datatypes.GenomicData.ValueItem} */
        var cell = series.get(j);
        var v = cell.valueAnnotation ? cell.valueAnnotation["errMinus"] : null;
        return v != undefined ? yScaleSeries(v) : null;
      };

      var errPlus = function (j) {
        /** @type {epiviz.datatypes.GenomicData.ValueItem} */
        var cell = series.get(j);
        var v = cell.valueAnnotation ? cell.valueAnnotation["errPlus"] : null;
        return v != undefined ? yScaleSeries(v) : null;
      };


      if (showYAxis) {
        // draw axes
        var svg = self._svg;
        var axesGroup = svg.select(".axes"),
        yAxisGrid = axesGroup.select(".yAxis-grid"),
        yAxisLine = axesGroup.select(".yAxis-line");

        if (yAxisGrid.empty()) {
          yAxisGrid = axesGroup.append("g").attr("class", "yAxis yAxis-grid");
        }

        if (yAxisLine.empty()) {
          yAxisLine = axesGroup.append("g").attr("class", "yAxis yAxis-line");
        }

        var axisline = d3.svg
        .line()
        .x([range.start(), range.start()])
        .y([(trackCount+1) * seriesLineHeight, (trackCount) * seriesLineHeight]);

        yAxisLine
          .append("line")
          .attr("x1", xScale(range.start())) 
          .attr("y1", yScaleSeries(stminY))
          .attr("x2", xScale(range.start())) 
          .attr("y2", yScaleSeries(stmaxY * 0.8))
          .attr("class", "yAxis-line-series-" + trackCount)
          .style("shape-rendering", "auto")
          .style("stroke-opacity", "0.6")
          .attr("transform", "translate(" + self.margins().left() + ", " + self.margins().top() + ")");

        yAxisLine
          .append("text")
          .attr("class", "yAxis-line-minlabel-series" + trackCount)
          .attr("x", xScale(range.start()) - 17)
          .attr("y", yScaleSeries(stmaxY * 0.8))
          .text(d3.format(".2g")(stmaxY))
          .style("opacity", "0.6")
          .attr("transform", "translate(" + self.margins().left() + ", " + self.margins().top() + ")");

        yAxisLine
          .append("text")
          .attr("class", "yAxis-line-maxlabel-series" + trackCount)
          .attr("x", xScale(range.start()) - 17)
          .attr("y", yScaleSeries(stminY))
          .text(d3.format(".2g")(stminY))        
          .style("opacity", "0.6")
          .attr("transform", "translate(" + self.margins().left() + ", " + self.margins().top() + ")");
      } else {
        graph
        .select(".line-series-index-" + trackCount)
        .selectAll("text")
        .remove();
  
        // show max value ticker
        graph
          .select(".line-series-index-" + trackCount)
          .append("text")
          .attr("class", "chart-title")
          .attr("font-weight", "bold")
          .attr("fill", function(m, j) {
            if (!self._measurementColorLabels) {
              return self.colors().get(trackCount);
            }
            return self.colors().getByKey(self._measurementColorLabels.get(m));
          })
          .attr("x", 0)
          .attr("y", (trackCount * seriesLineHeight) + 20)
          .text("max: " + d3.format(".2g")(stmaxY));
          // .attr(
          //   "transform",
          //   "translate(" + self.margins().left() + ", " + self.margins().top() + ")"
          // );
      }
      

      if (showLines) {
        var line = d3.svg
          .line()
          .x(x)
          .y(y)
          .interpolate(interpolation);

        var lines = graph
          .select(".line-series-index-" + trackCount)
          .selectAll("path")
          .data([indices]);

        lines
          .enter()
          .append("path")
          .attr("d", line)
          .style("shape-rendering", "auto")
          .style("stroke-opacity", "0.8")
          .on("mouseover", function () {
            self._captureMouseHover();
          })
          .on("mousemove", function () {
            self._captureMouseHover();
          })
          .on("mouseout", function () {
            self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
          });

        lines
          .attr("d", line)
          .style("stroke", color)
          .style("stroke-width", lineThickness)
          .attr("transform", "translate(" + +delta + ")")
          .transition()
          .duration(500)
          .attr("transform", "translate(" + 0 + ")");
      } 
      else {
        graph
          .select(".line-series-index-" + trackCount)
          .selectAll("path")
          .remove();
      }
      
      if (showFill) {
        var area = d3.svg.area()
        .x1(x)
        .y1(y)
        .x0(x)
        .y0(yScaleSeries(0))
        .interpolate(interpolation); 
              
        var lines = graph
        .select(".line-series-index-" + trackCount)
        .selectAll("path")
        .data([indices]);

        lines
        .enter()
        .append("path")
        .attr("d", area)
        .style("shape-rendering", "auto")
        .style("stroke-opacity", "0.8")        
        .on("mouseover", function () {
          self._captureMouseHover();
        })
        .on("mousemove", function () {
          self._captureMouseHover();
        })
        .on("mouseout", function () {
          self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
        });

        lines
          .attr("d", area)
          .style("fill", color)
          .attr("transform", "translate(" + +delta + ")")
          .transition()
          .duration(500)
          .attr("transform", "translate(" + 0 + ")");
      }

      graph
        .select(".point-series-index-" + trackCount)
        .selectAll("circle")
        .remove();

      graph
        .select(".point-series-index-" + trackCount)
        .selectAll(".error-bar")
        .remove();

      if (showPoints) {
        var points = graph
          .select(".point-series-index-" + trackCount)
          .selectAll("circle")
          .data(indices);
        points
          .enter()
          .append("circle")
          .attr("class", "point-series-index-" + trackCount)
          .attr("r", pointRadius)
          .attr("cx", x)
          .attr("cy", y)
          .attr("fill", color)
          .attr("stroke", color)
          .attr("transform", "translate(" + +delta + ")")
          .transition()
          .duration(500)
          .attr("transform", "translate(" + 0 + ")");

        points
          .on("mouseover", function () {
            self._captureMouseHover();
          })
          .on("mousemove", function () {
            self._captureMouseHover();
          })
          .on("mouseout", function () {
            self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
          });

        points
          .exit()
          .transition()
          .duration(500)
          .style("opacity", 0)
          .remove();

        if (showErrorBars) {
          var errorBars = graph
            .select(".point-series-index-" + trackCount)
            .selectAll(".error-bar")
            .data(indices);
          errorBars
            .enter()
            .append("g")
            .attr("class", "error-bar")
            .each(function (j) {
              var m = errMinus(j),
                p = errPlus(j);
              if (m == null || p == null) {
                return;
              }
              d3.select(this)
                .append("line")
                .attr("x1", x(j))
                .attr("x2", x(j))
                .attr("y1", m)
                .attr("y2", p)
                .style("stroke", color)
                .style("shape-rendering", "auto");
              d3.select(this)
                .append("line")
                .attr("x1", x(j) - 2)
                .attr("x2", x(j) + 2)
                .attr("y1", m)
                .attr("y2", m)
                .style("stroke", color)
                .style("shape-rendering", "auto");
              d3.select(this)
                .append("line")
                .attr("x1", x(j) - 2)
                .attr("x2", x(j) + 2)
                .attr("y1", p)
                .attr("y2", p)
                .style("stroke", color)
                .style("shape-rendering", "auto");
            })
            .attr("transform", "translate(" + +delta + ")")
            .transition()
            .duration(500)
            .attr("transform", "translate(" + 0 + ")");

          errorBars
            .on("mouseover", function () {
              self._captureMouseHover();
            })
            .on("mousemove", function () {
              self._captureMouseHover();
            })
            .on("mouseout", function () {
              self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
            });

          errorBars
            .exit()
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
        }

        // show baseline
        if (absLine != epiviz.ui.charts.CustomSetting.DEFAULT) {
          graph.selectAll(".abLine").remove();

          graph
            .append("svg:line")
            .attr("class", "abLine")
            .attr("x1", 0)
            .attr(
              "x2",
              self.width() - self.margins().sumAxis(epiviz.ui.charts.Axis.X)
            )
            .attr("y1", yScaleSeries(absLine))
            .attr("y2", yScaleSeries(absLine))
            .style("stroke", "black")
            .style("stroke-dasharray", "5, 5");
        }
      }

      trackCount++;
    }
  });

  // self._drawAxes(xScale, yScale, 10, trackCount + 1, null, null, null, null, null, null, null, yTicksSeries);

  // if hidden remove the other tracks
  for (;trackCount < data.measurements().length; trackCount++) {
    graph
    .select(".line-series-index-" + trackCount)
    .remove();

    graph
    .select(".point-series-index-" + trackCount)
    .remove();
  }

  return items;
};

epiviz.plugins.charts.MultiStackedLineTrack.prototype._drawLinesCanvas = function (
  range,
  data,
  delta,
  zoom,
  xScale,
  yScale,
  canvas
) {
  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  /** @type {number} */
  var step = parseInt(
    this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.STEP
    ]
  );

  /** @type {boolean} */
  var showPoints = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_POINTS
  ];

  /** @type {boolean} */
  var showLines = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_LINES
  ];

  /** @type {boolean} */
  var showErrorBars = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_ERROR_BARS
  ];

  /** @type {number} */
  var pointRadius = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.POINT_RADIUS
  ];

  /** @type {number} */
  var lineThickness = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.LINE_THICKNESS
  ];

  var interpolation = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.INTERPOLATION
  ];

  var absLine = this.customSettingsValues()[
    epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.ABS_LINE_VAL
  ];

  var self = this;

  var invXScale = d3.scale
    .linear()
    .domain([0, this.width() - this.margins().sumAxis(epiviz.ui.charts.Axis.X)])
    .range([range.start(), range.end()]);
  var deltaInBp = invXScale(delta) - range.start();
  var extendedRange = epiviz.datatypes.GenomicRange.fromStartEnd(
    range.seqName(),
    Math.min(range.start(), range.start() + deltaInBp),
    Math.max(range.end(), range.end() + deltaInBp),
    range.genome()
  );

  // var graph = this._svg.select(".lines");

  var ctx = canvas.getContext("2d");
  // ctx.translate(self.margins().left(), 0);

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];

  data.foreach(function (m, series, i) {
    var color = self._measurementColorLabels
      ? colors.getByKey(self._measurementColorLabels.get(m))
      : colors.get(i);

    /** @type {{index: ?number, length: number}} */
    var drawBoundaries = series.binarySearchStarts(extendedRange);
    if (drawBoundaries.length == 0) {
      return;
    }

    // TODO: In the future, use global index to align steps:
    //var globalIndex = series.get(drawBoundaries.index).globalIndex;
    //globalIndex = Math.ceil(globalIndex / step) * step;
    var index = Math.ceil(drawBoundaries.index / step) * step;
    drawBoundaries.length = Math.max(
      0,
      drawBoundaries.length - index + drawBoundaries.index
    );
    drawBoundaries.index = index;

    var indices = epiviz.utils
      .range(drawBoundaries.length, drawBoundaries.index)
      .filter(function (i) {
        return !step || step <= 1 || (i - drawBoundaries.index) % step == 0;
      });

    for (var k = 0; k < indices.length; ++k) {
      var cell = series.get(indices[k]);
      items.push(
        new epiviz.ui.charts.ChartObject(
          sprintf("line_%s_%s", i, cell.globalIndex),
          cell.rowItem.start(),
          cell.rowItem.end(),
          [cell.value],
          i,
          [[cell]],
          [m],
          sprintf("item data-series-%s", i),
          cell.rowItem.seqName()
        )
      );
    }

    var x = function (j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      return xScale(cell.rowItem.start());
    };

    var y = function (j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      return yScale(cell.value);
    };

    var errMinus = function (j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      var v = cell.valueAnnotation ? cell.valueAnnotation["errMinus"] : null;
      return v != undefined ? yScale(v) : null;
    };

    var errPlus = function (j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      var v = cell.valueAnnotation ? cell.valueAnnotation["errPlus"] : null;
      return v != undefined ? yScale(v) : null;
    };

    if (showLines) {
      var line = d3.svg
        .line()
        .x(x)
        .y(y)
        .interpolate(interpolation);

      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      // ctx.save();
      // draw items on  canvas
      // TODO: use renderingQueues for optimizing large draws
      var path = new Path2D(line(indices));
      ctx.strokeStyle = color;
      ctx.lineWidth = lineThickness;
      ctx.stroke(path);
      // ctx.fill(path);
      ctx.beginPath();
    }

    if (showPoints) {
      indices.forEach(function (idx) {
        var xpoint = x(idx);
        var ypoint = y(idx);
        ctx.beginPath();
        ctx.arc(xpoint, ypoint, pointRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.stroke();
        // ctx.endPath();
        ctx.fillStyle = color;
        ctx.fill();
      });

      if (showErrorBars) {
        indices.forEach(function (idx) {
          var m = errMinus(idx),
            p = errPlus(idx);
          if (m != null && p != null) {
            ctx.beginPath();
            ctx.moveTo(x(idx), y(idx));
            ctx.lineTo(m, p);
            ctx.strokeStyle = color;
            ctx.stroke();

            ctx.beginPath();
            ctx.globalAlpha = 0.7;
            ctx.moveTo(x(idx) - 2, y(idx) + 2);
            ctx.lineTo(m, m);
            ctx.strokeStyle = color;
            ctx.stroke();

            ctx.beginPath();
            ctx.globalAlpha = 0.7;
            ctx.moveTo(x(idx) - 2, y(idx) + 2);
            ctx.lineTo(p, p);
            ctx.strokeStyle = color;
            ctx.stroke();

            ctx.beginPath();
          }
        });
      }
    }
  });

  // show baseline
  if (absLine != epiviz.ui.charts.CustomSetting.DEFAULT) {
    ctx.beginPath();
    ctx.globalAlpha = 0.7;
    ctx.moveTo(0, yScale(absLine));
    ctx.lineTo(
      self.width() - self.margins().sumAxis(epiviz.ui.charts.Axis.X),
      yScale(absLine)
    );
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  return items;
};


/**
 * @private
 */
epiviz.plugins.charts.MultiStackedLineTrack.prototype._drawLegend = function() {
  var self = this;
  this._svg.selectAll(".chart-title").remove();
  this._svg.selectAll(".chart-title-color ").remove();

  if (!this._lastData || !this._lastData.isReady()) {
    return;
  }

  var title = "";
  var measurements = this._lastData.measurements();

  if (this.chartDrawType == "canvas") {
    var ctx = self.canvas.getContext("2d");
    var textIndent = 0;
    measurements.forEach(function(m, i) {
      var color;
      if (!self._measurementColorLabels) {
        color = self.colors().get(i);
      } else {
        color = self.colors().getByKey(self._measurementColorLabels.get(m));
      }
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();

      ctx.arc(self.margins().left() + textIndent - 2, -9, 4, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
      ctx.font = "9px";
      ctx.beginPath();

      var circleIndent = 8;
      ctx.textAlign = "start";

      ctx.fillText(
        m.name(),
        self.margins().left() + textIndent + circleIndent,
        -14
      );

      var textWidth = ctx.measureText(m.name()).width;

      textIndent = textIndent + circleIndent + textWidth + 10;
    });

    return;
  }

  if (self._id.indexOf("stacked") != -1) {

    var seriesLineHeight = (self.height() - self.margins().sumAxis(epiviz.ui.charts.Axis.Y)) / self.measurements().size();
    var allMeasurements = measurements;
    var showTracks = this.customSettingsValues()[
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.SHOW_TRACKS
    ];

    if (showTracks != "default")  {
      var tracks = showTracks.split(",");
      seriesLineHeight = (self.height() - self.margins().sumAxis(epiviz.ui.charts.Axis.Y)) / tracks.length;
      allMeasurements = [] //measurements.subset(function (m) { return tracks.includes(m.id()) });

      measurements.forEach(function(m) {
        if(tracks.includes(m.id())) {
          allMeasurements.push(m);
        }
      })
    }

    var titleEntries = this._svg
      .selectAll(".chart-title")
      .data(allMeasurements)
      .enter()
      .append("text")
      .attr("class", "chart-title")
      .attr("font-weight", "bold")
      .attr("fill", function(m, i) {
        if (!self._measurementColorLabels) {
          return self.colors().get(i);
        }
        return self.colors().getByKey(self._measurementColorLabels.get(m));
      })
      .attr("x", 0)
      .attr("y", function (b, i) {
        return (i * seriesLineHeight) + 10;
      })
      .text(function(m, i) {
        return m.name();
      })
      .attr(
        "transform",
        "translate(" + self.margins().left() + ", " + self.margins().top() + ")"
      );

      return;
  }

  var titleEntries = this._svg
  .selectAll(".chart-title")
  .data(measurements)
  .enter()
  .append("text")
  .attr("class", "chart-title")
  .attr("font-weight", "bold")
  .attr("fill", function(m, i) {
    if (!self._measurementColorLabels) {
      return self.colors().get(i);
    }
    return self.colors().getByKey(self._measurementColorLabels.get(m));
  })
  .attr("y", self.margins().top() - 5)
  .text(function(m, i) {
    return m.name();
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
      if (!self._measurementColorLabels) {
        return self.colors().get(i);
      }
      return self.colors().getByKey(self._measurementColorLabels.get(m));
    });
};
// goog.inherits(epiviz.plugins.charts.MultiStackedLineTrack, epiviz.plugins.charts.Track);
