/**
 * Created by Jayaram Kancherla ( jkanche [at] umd [dot] edu )
 * Date: 9/10/20
 * Time: 9:35 AM
 */

goog.provide("epiviz.plugins.charts.SashimiPlot");

goog.require("epiviz.plugins.charts.BlocksTrack");
goog.require("epiviz.ui.charts.Axis");
goog.require("epiviz.ui.charts.ChartObject");
goog.require("epiviz.ui.charts.VisEventArgs");
goog.require("epiviz.ui.charts.Visualization");
goog.require("epiviz.datatypes.GenomicData.ValueItem");
goog.require("epiviz.datatypes.RowItemImpl");

/**
 * @param id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.SashimiPlot = function (id, container, properties) {
  // Call superclass constructor
  epiviz.plugins.charts.BlocksTrack.call(this, id, container, properties);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.SashimiPlot.prototype = epiviz.utils.mapCopy(
  epiviz.plugins.charts.BlocksTrack.prototype
);

epiviz.plugins.charts.SashimiPlot.constructor =
  epiviz.plugins.charts.SashimiPlot;

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} slide
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.SashimiPlot.prototype._drawBlocks = function (
  range,
  data,
  slide,
  zoom
) {
  var self = this;
  this._svg.classed("sashimi-track", true);

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

  /** @type {number} */
  var pointRadius =
    this.customSettingsValues()[
      epiviz.plugins.charts.SashimiPlotType.CustomSettings.POINT_RADIUS
    ];

  /** @type {boolean} */
  var showPoints =
    this.customSettingsValues()[
      epiviz.plugins.charts.SashimiPlotType.CustomSettings.SHOW_POINTS
    ];

  var interpolation =
    this.customSettingsValues()[
      epiviz.plugins.charts.SashimiPlotType.CustomSettings.INTERPOLATION
    ];

  var showYAxis =
    this.customSettingsValues()[
      epiviz.plugins.charts.SashimiPlotType.CustomSettings.SHOW_Y_AXIS
    ];

  var showTracks =
    this.customSettingsValues()[
      epiviz.plugins.charts.SashimiPlotType.CustomSettings.SHOW_TRACKS
    ];

  var autoScale =
    this.customSettingsValues()[
      epiviz.plugins.charts.MultiStackedLineTrackType.CustomSettings.AUTO_SCALE
    ];

  const _getMax = (arr) => {
    let len = arr.length;
    let max = -Infinity;

    while (len--) {
      max = arr[len] > max ? arr[len] : max;
    }
    return max;
  };

  const _getMin = (arr) => {
    let len = arr.length;
    let min = Infinity;

    while (len--) {
      min = arr[len] < min ? arr[len] : min;
    }
    return min;
  };

  // autoScale
  let [globalMaxY, _track_ids] = self._getGlobalMaxY(data, _getMax);

  var blocks = [];

  let sashimiData = null;

  // stacked calculation

  var seriesLineHeight =
    (self.height() - margins.sumAxis(Axis.Y)) / self.measurements().size();

  let tracks = null;

  if (showTracks != "default") {
    // verify tracks exist
    tracks = showTracks
      .split(",")
      .filter((track_name) => _track_ids.includes(track_name));

    seriesLineHeight =
      (self.height() - margins.sumAxis(Axis.Y)) / tracks.length;
  }
  var trackCount = 0;

  // clear before drawing
  this._clearAxes();
  // x Axis for All
  var xScale = d3.scale
    .linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X)]);

  // common svg
  var items = this._svg.select(".items");
  var selected = items.select(".selected");
  var clipPath = this._svg.select("#clip-" + this.id());

  // draw only x axis
  this._drawAxes(xScale, null, 10, 5);

  if (items.empty()) {
    items = this._svg
      .append("g")
      .attr("class", "items")
      .attr("id", this.id() + "-gene-content")
      .attr("clip-path", "url(#clip-" + this.id() + ")");
  }

  // selected category last
  if (clipPath.empty()) {
    this._svg
      .select("defs")
      .append("clipPath")
      .attr("id", "clip-" + this.id())
      .append("rect")
      .attr("class", "clip-path-rect");
  }

  if (selected.empty()) {
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

  // var selection = items.selectAll(".item").data(coverageData, function (b) {
  //   return b.index;
  // });

  data.foreach((m, series, seriesIndex) => {
    for (var j = 0; j < series.size(); ++j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      sashimiData = cell.rowItem.rowMetadata();
    }

    var skip = false;
    var trackPosition = 0;
    var trackColor = colors.getByKey(m.id());

    self.measurements().foreach(function (mm, im) {
      if (mm.id() == m.id()) {
        trackPosition = im;
      }
    });

    if (showTracks != "default") {
      if (!tracks.includes(m.id())) {
        skip = true;
      } else {
        trackCount = tracks.indexOf(m.id());
      }
    } else {
      self.measurements().foreach(function (mm, im) {
        if (mm.id() == m.id()) {
          trackCount = im;
        }
      });
    }

    // if (sashimiData == null) return [];

    /* compute */
    //console.log(sashimiData);
    // this troubleshoots fileServer

    let [coverageData, junctionData] = self._extractRegions(sashimiData);
    // mock data and maximum
    // let [coverageData, junctionData] = self._getMockData(trackPosition + 1);
    // globalMaxY = [4, 8, 12];

    // data in better shape

    /* merge regions for area chart */

    let _coverageData_points = self._getCoverageAreas(coverageData);

    if (skip) {
      _coverageData_points = [];
      junctionData = [];
    }

    let points = [];
    if (showPoints) {
      _coverageData_points.forEach((path) => {
        points.push(...path);
      });
    }

    /* plotting */

    // autoscale y
    var ymax = 0;
    if (autoScale) ymax = _getMax(globalMaxY);
    else ymax = globalMaxY[trackPosition];

    var yScale = d3.scale
      .linear()
      .domain([0, ymax * 1.1])
      .range([seriesLineHeight, 0]);

    const _jumps = junctionData.map((junct) => {
      return junct.region2_start - junct.region1_end;
    });

    var junctionJumpScale = d3.scale
      .linear()
      .domain([_getMin(_jumps), _getMax(_jumps)])
      .range([0.5, 0.85]);
    // accomodate 10+1 pixels from the top for arcs-rect
    // - 11 / (height - margins.sumAxis(Axis.Y))

    // var delta = (slide * (width - margins.sumAxis(Axis.X))) / (end - start);

    const svg = this._svg;

    if (showYAxis) {
      // draw axes
      var axesGroup = svg.select(".axes"),
        yAxisGrid = axesGroup.select(".yAxis-grid-" + trackCount),
        yAxisLine = axesGroup.select(".yAxis-line-" + trackCount);

      if (yAxisGrid.empty()) {
        yAxisGrid = axesGroup
          .append("g")
          .attr("class", "yAxis yAxis-grid-" + trackCount);
      }

      if (yAxisLine.empty()) {
        yAxisLine = axesGroup
          .append("g")
          .attr("class", "yAxis yAxis-line-" + trackCount);
      }

      // x - axis
      yAxisLine
        .append("line")
        .attr("x1", 0)
        .attr("y1", (trackCount + 1) * seriesLineHeight)
        .attr("x2", width - margins.sumAxis(Axis.X))
        .attr("y2", (trackCount + 1) * seriesLineHeight)
        .attr("class", "xAxis-line-series-" + trackCount)
        .style("stroke", "rgb(238, 238, 238)")
        .style("shape-rendering", "crispedges")
        .attr(
          "transform",
          "translate(" + margins.left() + ", " + margins.top() + ")"
        );

      // y - axis
      yAxisLine
        .append("line")
        .attr("x1", 0)
        .attr("y1", trackCount * seriesLineHeight)
        .attr("x2", 0)
        .attr("y2", (trackCount + 1) * seriesLineHeight)
        .attr("class", "yAxis-line-series-" + trackCount)
        .style("shape-rendering", "auto")
        .style("stroke-opacity", "0.6")
        .attr(
          "transform",
          "translate(" + margins.left() + ", " + margins.top() + ")"
        );

      yAxisLine
        .append("text")
        .attr("class", "yAxis-line-minlabel-series" + trackCount)
        .attr("x", -17)
        .attr("y", trackCount * seriesLineHeight + 11)
        .text(d3.format(".2g")(ymax * 1.1))
        .style("opacity", "0.6")
        .attr(
          "transform",
          "translate(" + margins.left() + ", " + margins.top() + ")"
        );

      yAxisLine
        .append("text")
        .attr("class", "yAxis-line-maxlabel-series" + trackCount)
        .attr("x", -17)
        .attr("y", (trackCount + 1) * seriesLineHeight)
        .text(d3.format(".2g")(0))
        .style("opacity", "0.6")
        .attr(
          "transform",
          "translate(" + margins.left() + ", " + margins.top() + ")"
        );
    } else if (!skip) {
      // show max
      // draw axes
      var axesGroup = svg.select(".axes"),
        yAxisGrid = axesGroup.select(".yAxis-grid-" + trackCount),
        yAxisLine = axesGroup.select(".yAxis-line-" + trackCount);

      if (yAxisGrid.empty()) {
        yAxisGrid = axesGroup
          .append("g")
          .attr("class", "yAxis yAxis-grid-" + trackCount);
      }

      if (yAxisLine.empty()) {
        yAxisLine = axesGroup
          .append("g")
          .attr("class", "yAxis yAxis-line-" + trackCount);
      }

      yAxisLine
        .append("text")
        .attr("class", "yAxis-line-minlabel-series" + trackCount)
        .attr("x", 10)
        .attr("y", trackCount * seriesLineHeight + 32)
        .text(() => {
          const val = d3.format(".2g")(ymax * 1.1);
          return "max: " + val;
        })
        .style("opacity", "0.8")
        .style("stroke", trackColor)
        .attr(
          "transform",
          "translate(" + margins.left() + ", " + margins.top() + ")"
        );
    }

    // ----- coverage -----

    var area = d3.svg
      .area()
      .x(function (d) {
        return xScale(d.x);
      })
      .y0(seriesLineHeight)
      .y1(function (d) {
        return yScale(d.y);
      })
      .interpolate(interpolation);

    var selection = items
      .selectAll(".areagroup-" + trackPosition)
      .data(_coverageData_points);

    // enter
    var areagroup = selection
      .enter()
      .append("g")
      .attr("class", "areagroup-" + trackPosition);

    // update
    selection.attr(
      "transform",
      "translate(" + 0 + ", " + trackCount * seriesLineHeight + ")"
    );

    areagroup
      .append("path")
      .style("fill", trackColor)
      .datum((d, i) => d)
      .attr("class", "area")
      .style("stroke-width", "0")
      .style("shape-rendering", "auto")
      .style("stroke-opacity", "0.8");

    // update
    selection.select("path").attr("d", area);

    // exit
    selection.exit().remove();

    // ----- options -----

    if (showPoints) {
      // enter
      var points_selection = items
        .selectAll(".showPoints-" + trackPosition)
        .data(points);

      points_selection
        .enter()
        .append("circle")
        .attr("class", "showPoints-" + trackPosition);

      // update
      points_selection
        .attr(
          "transform",
          "translate(" + 0 + ", " + trackCount * seriesLineHeight + ")"
        )
        // .attr("class", "point-series-index-" + trackCount)
        .attr("r", pointRadius)
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("fill", trackColor)
        .attr("stroke", trackColor)
        .attr("fill-opacity", 0.8);
      // .attr("transform", "translate(" + +delta + ")")
      // .transition()
      // .duration(500)
      // .attr("transform", "translate(" + 0 + ")");
      // .on("mouseover", function () {
      //   self._captureMouseHover();
      // })
      // .on("mousemove", function () {
      //   self._captureMouseHover();
      // })
      // .on("mouseout", function () {
      //   self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      // });

      //end
      points_selection
        .exit()
        //.transition().duration(500).style("opacity", 0)
        .remove();
    } else {
      var points_selection = items.selectAll("circle").data(points);
      points_selection.exit().remove();
    }

    // ----- junctions -----

    var links_selection = items
      .selectAll(".arcs-group-" + trackPosition)
      .data(junctionData, function (b) {
        return b.index;
      });

    // enter
    links_selection
      .enter()
      .append("g")
      .attr("class", "arcs-group-" + trackPosition);

    // update
    links_selection
      .attr(
        "transform",
        "translate(" + 0 + ", " + trackCount * seriesLineHeight + ")"
      )
      .each(function (g) {
        var node = this;
        var _select = d3.select(this);

        _path = _select.select("path");
        _padding = _select.select(".arcs-padding");
        _rect = _select.select("rect");
        _text = _select.select("text");
        if (_path.empty()) {
          _path = _select
            .append("path")
            .attr("class", "arcs")
            .style("stroke", trackColor);
          _padding = _select.append("path").attr("class", "arcs-padding");
          _rect = _select.append("rect");
          _text = _select.append("text");
        }

        _path.attr("d", function (d) {
          var r1s = parseInt(d.region1_start),
            r1e = parseInt(d.region1_end),
            r2s = parseInt(d.region2_start),
            r2e = parseInt(d.region2_end);

          var start = xScale(Math.round((r1s + r1e) / 2));
          var end = xScale(Math.round((r2s + r2e) / 2));

          //Creating an Arc path
          // M start-x, start-y A radius-x, radius-y, x-axis-rotation,
          // large-arc-flag, sweep-flag, end-x, end-y

          return [
            "M",
            start,
            Math.ceil(seriesLineHeight * 1),
            "A",
            (end - start) / 2,
            ",",
            Math.ceil(seriesLineHeight * junctionJumpScale(r2s - r1e)),
            0,
            0, //junctionJumpScale
            ",",
            start < end ? 1 : 0,
            end,
            ",",
            Math.ceil(seriesLineHeight * 1),
          ] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
            .join(" ");
        });

        _padding
          .attr("d", function (d) {
            var r1s = parseInt(d.region1_start),
              r1e = parseInt(d.region1_end),
              r2s = parseInt(d.region2_start),
              r2e = parseInt(d.region2_end);

            var start = xScale(Math.round((r1s + r1e) / 2));
            var end = xScale(Math.round((r2s + r2e) / 2));

            //Creating an Arc path
            // M start-x, start-y A radius-x, radius-y, x-axis-rotation,
            // large-arc-flag, sweep-flag, end-x, end-y

            return [
              "M",
              start,
              Math.ceil(seriesLineHeight * 1),
              "A",
              (end - start) / 2,
              ",",
              Math.ceil(seriesLineHeight * junctionJumpScale(r2s - r1e)),
              0,
              0, //junctionJumpScale
              ",",
              start < end ? 1 : 0,
              end,
              ",",
              Math.ceil(seriesLineHeight * 1),
            ] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
              .join(" ");
          })
          .on("mouseout", function () {
            self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
          })
          .on("mouseover", function (b) {
            // self._arcHover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), b));
            // var node = this;
            self._arcHover(b, range, node);
          });

        _rect
          .attr("class", "arcs-rect")
          .attr("fill", "white")
          .attr("height", "20px")
          .attr("width", "20px")
          .attr("x", function (b) {
            return (xScale(b.region1_end) + xScale(b.region2_start)) / 2 - 10;
          })
          .attr("y", function (d) {
            return (
              seriesLineHeight *
                (1 - junctionJumpScale(d.region2_start - d.region1_end)) -
              10
            );
          });

        _text
          .attr("class", "arcs-text")
          .text(function (d) {
            return d.value;
          })
          .attr("x", function (b) {
            return (xScale(b.region1_end) + xScale(b.region2_start)) / 2;
          })
          .attr("y", function (d) {
            return (
              seriesLineHeight *
                (1 - junctionJumpScale(d.region2_start - d.region1_end)) +
              4
            );
          })
          .attr("font-family", "sans-serif")
          .attr("font-size", "34px")
          .attr("fill", "black")
          .attr("text-anchor", "middle");
      });

    // exit
    links_selection.exit().remove();
  });

  // legent text
  this._svg
    .selectAll(".chart-title")
    .attr("x", 60)
    //.attr("y", 0)
    .attr("transform", (d, i) => {
      if (showTracks == "default") {
        const _top = margins.top() + seriesLineHeight * i;
        return "translate(" + 0 + ", " + _top + ")";
      } else {
        const _position = tracks.indexOf(d.id());
        const _top = margins.top() + seriesLineHeight * _position;
        return "translate(" + 0 + ", " + _top + ")";
      }
    })
    .style("opacity", (d, i) => {
      if (showTracks == "default") {
        return 1;
      } else {
        if (tracks.indexOf(d.id()) == -1) return 0;
        else return 1;
      }
    });

  // legend circles
  this._svg.selectAll(".chart-title-color").remove();

  return blocks;
};

epiviz.plugins.charts.SashimiPlot.prototype._arcHover = function (
  b,
  range,
  node
) {
  var self = this;
  var measurements = self.measurements();

  var regions = [];
  var r1s = parseInt(b.region1_start),
    r1e = parseInt(b.region1_end),
    r2s = parseInt(b.region2_start),
    r2e = parseInt(b.region2_end);

  regions.push(
    new epiviz.ui.charts.ChartObject(
      "track-sashimi-hover",
      r1s,
      r2e,
      null,
      0, // seriesIndex
      [
        [
          new epiviz.datatypes.GenomicData.ValueItem(
            0,
            new epiviz.datatypes.RowItemImpl(
              null,
              range.seqName(),
              r1s,
              r1e,
              0,
              "*",
              {}
            ),
            null,
            measurements,
            null
          ),
          new epiviz.datatypes.GenomicData.ValueItem(
            0,
            new epiviz.datatypes.RowItemImpl(
              null,
              range.seqName(),
              r2s,
              r2e,
              0,
              "*",
              {}
            ),
            null,
            measurements,
            null
          ),
        ],
      ], // valueItems
      [measurements], // measurements
      null,
      range.seqName()
    )
  );

  // regions.push(
  //   new epiviz.ui.charts.ChartObject(
  //     "track-Interaction-0",
  //     b.r2s,
  //     b.r2e,
  //     null,
  //     null, // seriesIndex
  //     null, // valueItems
  //     null, // measurements
  //     null,
  //     range.seqName()
  //   )
  // )

  var itemsGroup = this._container.find(".items");
  var unselectedHoveredGroup = itemsGroup.find("> .hovered");
  var selectedGroup = itemsGroup.find("> .selected");
  var selectedHoveredGroup = selectedGroup.find("> .hovered");

  selectedHoveredGroup.append(node);

  self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), regions[0]));
};

epiviz.plugins.charts.SashimiPlot.prototype.doHover = function (
  selectedObject
) {
  epiviz.plugins.charts.BlocksTrack.prototype.doHover.call(
    this,
    selectedObject
  );
  var self = this;

  if (selectedObject.id != "track-sashimi-hover") {
    var itemsGroup = this._container.find(".items");
    var unselectedHoveredGroup = itemsGroup.find("> .hovered");
    var selectedGroup = itemsGroup.find("> .selected");
    var selectedHoveredGroup = selectedGroup.find("> .hovered");

    var filter = function () {
      if (Array.isArray(selectedObject)) {
        var match = false;

        for (var sIndex = 0; sIndex < selectedObject.length; sIndex++) {
          var sel = selectedObject[sIndex];
          // if (sel.overlapsWith(d3.select(this).data()[0])) {
          //   match = true;
          // }
          var d = d3.select(this).data()[0];
          var r1s = parseInt(d.region1_start),
            r1e = parseInt(d.region1_end),
            r2s = parseInt(d.region2_start),
            r2e = parseInt(d.region2_end);
          // var start = xScale(Math.round((r1s + r1e) / 2));
          // var end = xScale(Math.round((r2s + r2e) / 2));

          if (
            (sel.regionStart() < r1e && sel.regionEnd() > r1s) ||
            (sel.regionStart() < r2e && sel.regionEnd() > r2s)
          ) {
            match = true;
          }
        }

        return match;
      } else {
        var d = d3.select(this).data()[0];
        var r1s = parseInt(d.region1_start),
          r1e = parseInt(d.region1_end),
          r2s = parseInt(d.region2_start),
          r2e = parseInt(d.region2_end);

        return (
          (selectedObject.regionStart() < r1e &&
            selectedObject.regionEnd() > r1s) ||
          (selectedObject.regionStart() < r2e &&
            selectedObject.regionEnd() > r2s)
        );
        // selectedObject.overlapsWith(d3.select(this).data()[0]);
      }
    };

    var selectItems = itemsGroup.find("> .arcs-group").filter(filter);
    unselectedHoveredGroup.append(selectItems);

    selectItems = selectedGroup.find("> .arcs-group").filter(filter);
    selectedHoveredGroup.append(selectItems);
  }
};

// --- utils ---
// helper functions

epiviz.plugins.charts.SashimiPlot.prototype._extractRegions = (sashimiData) => {
  if (!sashimiData) return [[], []];

  let coverageData = [];
  for (let i = 0; i < sashimiData.coverage.chr.length; i++) {
    let _data = null;
    if (i == 0) {
      _data = {
        start: sashimiData.coverage.start[i],
        end: sashimiData.coverage.end[i],
        value: sashimiData.coverage.value[i],
        index: i + 1,
      };
    } else {
      _data = {
        start:
          sashimiData.coverage.start[i] +
          coverageData[coverageData.length - 1].start,
        end:
          sashimiData.coverage.end[i] +
          coverageData[coverageData.length - 1].end,
        value: sashimiData.coverage.value[i],
        index: i + 1,
      };
    }
    coverageData.push(_data);
  }

  let junctionData = [];
  for (let i = 0; i < sashimiData.junctions.chr.length; i++) {
    let _data = null;
    if (i == 0) {
      _data = {
        region1_start: sashimiData.junctions.region1_start[i],
        region2_start: sashimiData.junctions.region2_start[i],
        region1_end: sashimiData.junctions.region1_end[i],
        region2_end: sashimiData.junctions.region2_end[i],
        value: sashimiData.junctions.value[i],
        index: i + 1,
      };
    } else {
      _data = {
        region1_start:
          sashimiData.junctions.region1_start[i] +
          junctionData[junctionData.length - 1].region1_start,
        region2_start:
          sashimiData.junctions.region2_start[i] +
          junctionData[junctionData.length - 1].region2_start,
        region1_end:
          sashimiData.junctions.region1_end[i] +
          junctionData[junctionData.length - 1].region1_end,
        region2_end:
          sashimiData.junctions.region2_end[i] +
          junctionData[junctionData.length - 1].region2_end,
        value: sashimiData.junctions.value[i],
        index: i + 1,
      };
    }
    junctionData.push(_data);
  }

  return [coverageData, junctionData];
};

epiviz.plugins.charts.SashimiPlot.prototype._getMockData = (position = 1) => {
  coverageData = [
    { start: 10265000, end: 10265500, value: 2 * position, index: 1 },
    { start: 10265500, end: 10265750, value: 1.5 * position, index: 2 },
    { start: 10265750, end: 10266000, value: 4 * position, index: 3 },
    { start: 10266000, end: 10266250, value: 1 * position, index: 4 },
    { start: 10267000, end: 10267500, value: 2 * position, index: 5 },
  ];
  junctionData = [
    {
      region1_start: 10266250,
      region1_end: 10266250,
      region2_start: 10267000,
      region2_end: 10267000,
      value: 5,
      index: 1,
    },
    {
      region1_start: 10266000,
      region1_end: 10266000,
      region2_start: 10267000,
      region2_end: 10267000,
      value: 5,
      index: 2,
    },
    {
      region1_start: 10266500,
      region1_end: 10266500,
      region2_start: 10267000,
      region2_end: 10267000,
      value: 5,
      index: 3,
    },
  ];

  return [coverageData, junctionData];
};

epiviz.plugins.charts.SashimiPlot.prototype._getCoverageAreas = (ranges) => {
  //
  const _isNeighbour = (a, b) => {
    if (a.end == b.start) return true;
    if (a.end > b.start) return true;

    return false;
  };

  //
  const _getPoints = (array) => {
    result = [];

    if (array.length == 0) return result;

    // first point
    result.push({
      x: array[0].start,
      y: 0,
    });

    // mids
    array.forEach((data) => {
      result.push({
        x: (data.end + data.start) / 2,
        y: data.value,
      });
    });

    //last point
    result.push({
      x: array[array.length - 1].end,
      y: 0,
    });

    return result;
  };

  // compute
  let final_paths = [];
  let _temp_group = [];

  for (let i = 0; i < ranges.length; i++) {
    let _current = ranges[i];
    let _prev = ranges[i];
    if (i != 0) _prev = ranges[i - 1];

    if (_current.value == 0 && _temp_group.length != 0) {
      // reset
      final_paths.push(_temp_group);
      _temp_group = [];
    }

    if (_current.value != 0 && _isNeighbour(_prev, _current)) {
      // add to existing group
      _temp_group.push(_current);
    } else if (_current.value != 0 && !_isNeighbour(_prev, _current)) {
      // reset and new
      final_paths.push(_temp_group);
      _temp_group = [];
      _temp_group.push(_current);
    }

    if (i == ranges.length - 1) final_paths.push(_temp_group);
  }

  // get the points
  final_paths = final_paths.map((array) => {
    return _getPoints(array);
  });

  return final_paths;
};

epiviz.plugins.charts.SashimiPlot.prototype._getGlobalMaxY = (
  data,
  _getMax
) => {
  let _max_values = [];
  let _track_ids = [];

  data.foreach((m, series, seriesIndex) => {
    var sashimiData = null;

    for (var j = 0; j < series.size(); ++j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      sashimiData = cell.rowItem.rowMetadata();
    }

    if (!sashimiData) return;

    _max_values.push(_getMax(sashimiData.coverage.value));
    _track_ids.push(m.id());
  });

  return [_max_values, _track_ids];
};
