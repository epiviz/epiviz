/**
 * @author Jayaram Kancherla
 * @email jayaram dot kancherla at gmail dot com
 * @create date 2020-11-19 09:04:43
 * @modify date 2020-11-19 09:04:43
 */


goog.provide("epiviz.plugins.charts.GwasTrack");

goog.require("epiviz.plugins.charts.LineTrack");
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
epiviz.plugins.charts.GwasTrack = function(id, container, properties) {
  // Call superclass constructor
  epiviz.plugins.charts.LineTrack.call(this, id, container, properties);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.GwasTrack.prototype = epiviz.utils.mapCopy(epiviz.plugins.charts.LineTrack.prototype);
epiviz.plugins.charts.GwasTrack.constructor = epiviz.plugins.charts.GwasTrack;

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.GwasTrack.prototype.draw = function(
  range,
  data,
  slide,
  zoom,
  mirror
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

  var yAxisField = this.customSettingsValues()[
    epiviz.plugins.charts.GwasTrackType.CustomSettings.Y_AXIS_SEL
  ];

  var dataMin = 100000, dataMax = -100000;
  data.foreach(function(m, series) {
    var fMin = dataMin, fMax = dataMax;
    var drawBoundaries = series.binarySearchStarts(range);
      if (drawBoundaries.length > 0) {
        var indices = epiviz.utils
        .range(drawBoundaries.length, drawBoundaries.index);

        for (var k = 0; k < indices.length; ++k) {
          var cell = series.get(indices[k]);

          if (parseFloat(cell.rowItem.rowMetadata()[yAxisField]) < fMin) {
            fMin = parseFloat(cell.rowItem.rowMetadata()[yAxisField]);
          }

          if (parseFloat(cell.rowItem.rowMetadata()[yAxisField]) > fMax) {
            fMax = parseFloat(cell.rowItem.rowMetadata()[yAxisField]);
          }
        }
      }

    if (fMin < dataMin) { dataMin = fMin;} 
    if (fMax > dataMax) { dataMax = fMax;}
  });

  if(dataMin == 100000) {
    dataMin = 0;
  }

  if(dataMax == -100000) {
    dataMax = 20;
  }

  var dataRange = [dataMin, dataMax];
  
  if (minY == CustomSetting.DEFAULT) {
    minY = dataRange[0];
  }

  if (maxY == CustomSetting.DEFAULT) {
    maxY = dataRange[1];
  }

  if (minY === null && maxY === null) {
    minY = 0;
    maxY = 20;
  }
  if (minY === null) {
    minY = Math.min(0, maxY - 1);
  }
  if (maxY === null) {
    maxY = Math.max(minY, 20);
  }

  var absLine = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.ABS_LINE_VAL
  ];

  if (maxY < absLine) { 
    maxY = Math.max(maxY , 20);
  }

  var Axis = epiviz.ui.charts.Axis;
  var xScale = d3.scale
    .linear()
    .domain([range.start(), range.end()])
    .range([0, this.width() - this.margins().sumAxis(Axis.X)]);
    
  var yScale = d3.scale
    .linear()
    .domain([minY, absLine, maxY])
    .range([this.height() - this.margins().sumAxis(Axis.Y), (this.height() - this.margins().sumAxis(Axis.Y))*3/4, 0]);

  this._clearAxes();

  if(mirror) {
    yScale = d3.scale
    .linear()
    .domain([-1 * maxY, maxY])
    .range([this.height() - this.margins().sumAxis(Axis.Y), 0]);
    this._drawAxes(xScale, yScale, 10, 5);
  }
  else {
    this._drawAxes(xScale, yScale, 10, 5);
  }

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
  } else {
    linesGroup      
      .attr(
        "transform",
        "translate(" + this.margins().left() + ", " + this.margins().top() + ")"
      );
  }

  data.measurements().forEach(function(m, i) {
    var lineSeries = linesGroup.selectAll(".line-series-index-" + i);
    var pointSeries = linesGroup.selectAll(".point-series-index-" + i);

    if (lineSeries.empty()) {
      linesGroup.append("g").attr("class", "line-series-index-" + i);
    } else {
      lineSeries.selectAll("path").remove();
    }

    if (pointSeries.empty()) {
      linesGroup.append("g").attr("class", "point-series-index-" + i);
    } else {
      pointSeries.selectAll("circle").remove();
    }
  });

  // for (var i = data.measurements().length; ; ++i) {
  //   var lineSeries = linesGroup.selectAll(".line-series-index-" + i);
  //   var pointSeries = linesGroup.selectAll(".point-series-index-" + i);
  //   if (lineSeries.empty()) {
  //     break;
  //   }
  //   lineSeries.remove();
  //   pointSeries.remove();
  // }

  return this._drawLines(range, data, delta, zoom, xScale, yScale);
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
epiviz.plugins.charts.GwasTrack.prototype._drawLines = function(
  range,
  data,
  delta,
  zoom,
  xScale,
  yScale
) {

  /** @type {epiviz.ui.charts.ColorPalette} */
  var colors = this.colors();

  /** @type {number} */
  var step = parseInt(
    this.customSettingsValues()[
      epiviz.plugins.charts.LineTrackType.CustomSettings.STEP
    ]
  );

  /** @type {boolean} */
  var showPoints = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.SHOW_POINTS
  ];

  /** @type {boolean} */
  var showLines = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.SHOW_LINES
  ];

  /** @type {boolean} */
  var showErrorBars = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.SHOW_ERROR_BARS
  ];

  /** @type {number} */
  var pointRadius = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.POINT_RADIUS
  ];

  /** @type {number} */
  var lineThickness = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.LINE_THICKNESS
  ];

  var interpolation = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.INTERPOLATION
  ];

  var absLine = this.customSettingsValues()[
    epiviz.plugins.charts.LineTrackType.CustomSettings.ABS_LINE_VAL
  ];

  var yAxisField = this.customSettingsValues()[
    epiviz.plugins.charts.GwasTrackType.CustomSettings.Y_AXIS_SEL
  ];

  var colors = this.colors();

  var gridSquareSize = 1;

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

  var graph = this._svg.select(".lines");

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var items = [];
  var grid = {};
  var maxGroupItems = 1;

  data.foreach(function(m, series, i) {
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
      .filter(function(i) {
        return !step || step <= 1 || (i - drawBoundaries.index) % step == 0;
      });

    for (var k = 0; k < indices.length; ++k) {
      
      var cell = series.get(indices[k]);
      if (
        cell.rowItem.start() > range.end() ||
        cell.rowItem.end() < range.start()
      ) {
        continue;
      }

      var x = xScale(cell.rowItem.start());
      var y = yScale(parseFloat(cell.rowItem.rowMetadata()[yAxisField]));
      var gridX = Math.floor(x / gridSquareSize) * gridSquareSize;
      var gridY = Math.floor(y / gridSquareSize) * gridSquareSize;
      cell.value = cell.rowItem.rowMetadata()[yAxisField]

      var uiObj = null;
      if (grid[gridY] && grid[gridY][gridX]) {
        uiObj = grid[gridY][gridX];
        uiObj.id += "_" + cell.globalIndex;
        uiObj.start = Math.min(uiObj.start, cell.rowItem.start());
        uiObj.end = Math.max(uiObj.end, cell.rowItem.end());
        uiObj.values[0] =
          (uiObj.values[0] * uiObj.valueItems[0].length + parseFloat(cell.rowItem.rowMetadata()[yAxisField])) /
          (uiObj.valueItems[0].length + 1);
        uiObj.valueItems[0].push(cell);
  
        if (uiObj.valueItems[0].length > maxGroupItems) {
          maxGroupItems = uiObj.valueItems[0].length;
        }
  
        continue;
      }

      uiObj = new epiviz.ui.charts.ChartObject(
          sprintf("line_%s_%s", i, cell.globalIndex),
          cell.rowItem.start(),
          cell.rowItem.end(),
          [parseFloat(cell.rowItem.rowMetadata()[yAxisField])],
          i,
          [[cell]],
          [m],
          sprintf("item data-series-%s", i),
          cell.rowItem.seqName()
        );

        if (!grid[gridY]) {
          grid[gridY] = {};
        }
        grid[gridY][gridX] = uiObj;
    
        items.push(uiObj);  

    }

    var x = function(j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      return xScale(cell.rowItem.start());
    };

    var y = function(j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      return yScale(parseFloat(cell.rowItem.rowMetadata()[yAxisField]));
    };

    var errMinus = function(j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      var v = cell.valueAnnotation ? cell.valueAnnotation["errMinus"] : null;
      return v != undefined ? yScale(v) : null;
    };

    var errPlus = function(j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      var v = cell.valueAnnotation ? cell.valueAnnotation["errPlus"] : null;
      return v != undefined ? yScale(v) : null;
    };

    var xItem = function(j) {
      var cell = j.valueItems[0][0];
      return xScale(cell.rowItem.start());
    };

    var yItem = function(j) {
      var cell = j.valueItems[0][0];
      return yScale(parseFloat(cell.rowItem.rowMetadata()[yAxisField]));
    };

    var yItem2 = function(j) {
      return yScale(parseFloat(j.values[0]));
    };

    if (showLines) {
      var line = d3.svg
        .line()
        .x(x)
        .y(y)
        .interpolate(interpolation);

      var lines = graph
        .select(".line-series-index-" + i)
        .selectAll("path")
        .data([indices]);

      lines
        .enter()
        .append("path")
        .attr("d", line)
        .style("shape-rendering", "auto")
        .style("stroke-opacity", "0.8");
        // .on("mouseover", function() {
        //   self._captureMouseHover();
        // })
        // .on("mousemove", function() {
        //   self._captureMouseHover();
        // })
        // .on("mouseout", function() {
        //   self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
        // });

      lines
        .attr("d", line)
        .style("stroke", color)
        .style("stroke-width", lineThickness)
        .attr("transform", "translate(" + +delta + ")")
        .transition()
        .duration(500)
        .attr("transform", "translate(" + 0 + ")");
    } else {
      graph
        .select(".line-series-index-" + i)
        .selectAll("path")
        .remove();
    }

    graph
      .select(".point-series-index-" + i)
      .selectAll("circle")
      .remove();

    graph
      .select(".point-series-index-" + i)
      .selectAll(".error-bar")
      .remove();

    if (showPoints) {
      var points = graph
        .select(".point-series-index-" + i)
        .selectAll("circle")
        .data(items);

      points
        .exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

      points
        .enter()
        .append("circle")
        .attr("class", "circle item point-series-index-" + i)
        .attr("r", pointRadius)
        .attr("cx", xItem)
        .attr("cy", yItem2)
        .style("fill-opacity", 0.6);

      function rPoints(d) {
        // var cell = d.__data__.valueItems[0][0];;//series.get(d);
        d3.select(d)
        .append("circle")
        .attr("class", "circle item point-series-index-" + i)
        .attr("r", pointRadius)
        .attr("cx", xItem)
        .attr("cy", yItem2)
        .attr("fill", color)
        .style("fill-opacity", 0.6)
        .attr("stroke", color)
        .attr("transform", "translate(" + +delta + ")")
        .transition()
        .duration(500)
        .attr("transform", "translate(" + 0 + ")");
      }

      self.rPointsQueue = renderQueue(rPoints);
  
      self.rPointsQueue(points[0]);

      // points
      //   .attr("r", pointRadius)
      //   .attr("cx", xItem)
      //   .attr("cy", yItem2)
      //   .attr("fill", color)
      //   .attr("stroke", color)
      //   .attr("transform", "translate(" + +delta + ")")
      //   .transition()
      //   .duration(500)
      //   .attr("transform", "translate(" + 0 + ")");


      points       
        .each(function(d) {
          var cell = d.valueItems[0][0];;//series.get(d);
          if (absLine >= parseFloat(cell.rowItem.rowMetadata()[yAxisField])) {
            d3.select(this)
              .transition()
              .duration(1000)
              .attr("fill", "grey")
              .attr("stroke", "grey")
              .attr("r", pointRadius/2)
          } else {
              d3.select(this)
              .transition()
              .duration(1000)
              .attr("fill", color)
              .attr("stroke", color)
              .attr("r", pointRadius)
          }
        }); 

      points.
        on("click", function(d) {
          // var cell = series.get(d);
          // var chartObj = new epiviz.ui.charts.ChartObject(
          //   sprintf("line_%s_%s", i, cell.globalIndex),
          //   cell.rowItem.start(),
          //   cell.rowItem.end(),
          //   [cell.rowItem.rowMetadata()[yAxisField]],
          //   i,
          //   [[cell]],
          //   [m],
          //   sprintf("item data-series-%s", i),
          //   cell.rowItem.seqName()
          // );
          self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
          self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
          d3.event.stopPropagation();
        })

      // points
      //   .on("mouseover", function() {
      //     self._captureMouseHover();
      //   })
      //   .on("mousemove", function() {
      //     self._captureMouseHover();
      //   })
      //   .on("mouseout", function() {
      //     self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      //   });

      if (showErrorBars) {
        var errorBars = graph
          .select(".point-series-index-" + i)
          .selectAll(".error-bar")
          .data(indices);
        errorBars
          .enter()
          .append("g")
          .attr("class", "error-bar")
          .each(function(j) {
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
          .on("mouseover", function() {
            self._captureMouseHover();
          })
          .on("mousemove", function() {
            self._captureMouseHover();
          })
          .on("mouseout", function() {
            self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
          });

        errorBars
          .exit()
          .transition()
          .duration(500)
          .style("opacity", 0)
          .remove();
      }
    }
  });

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
      .attr("y1", yScale(absLine))
      .attr("y2", yScale(absLine))
      .style("stroke", "black")
      .style("stroke-dasharray", "5, 5");
  }

  // var graph = this._svg.select(".lines");
  // data.foreach(function(m, series, i) {
  //   var color = self._measurementColorLabels
  //   ? colors.getByKey(self._measurementColorLabels.get(m))
  //   : colors.get(i);
  //   if(showPoints) {
  //     var points = graph
  //       .select(".point-series-index-" + i)
  //       .selectAll("circle")
  //   }
  // });

  return items;
}

// currently only works for points
// epiviz.plugins.charts.GwasTrack.prototype.doSelect = function(selectedObject) {
//   var itemsGroup = this._container.find(".circle");
//   var unselectedHoveredGroup = itemsGroup.find("> .hovered");
//   var selectedGroup = itemsGroup.find("> .selected");
//   var selectedHoveredGroup = selectedGroup.find("> .hovered");

//   var filter = function() {
//     return selectedObject.overlapsWith(d3.select(this).data()[0]);
//   };
//   var selectItems = itemsGroup.filter(filter);
//   selectedGroup.append(selectItems);

//   selectItems = unselectedHoveredGroup.find("> .item").filter(filter);
//   selectedHoveredGroup.append(selectItems);
// };