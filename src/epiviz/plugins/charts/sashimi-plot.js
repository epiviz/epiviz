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

  var minBlockDistance =
    this.customSettingsValues()[
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE
    ];

  var colorLabel =
    this.customSettingsValues()[
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.BLOCK_COLOR_BY
    ];

  var useColorBy =
    this.customSettingsValues()[
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.USE_COLOR_BY
    ];

  var scaleLabel =
    this.customSettingsValues()[
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.BLOCK_SCALE_BY
    ];

  var useScaleBy =
    this.customSettingsValues()[
      epiviz.plugins.charts.BlocksTrackType.CustomSettings.USE_SCALE_BY
    ];

  var minY =
    this.customSettingsValues()[
      epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
    ];

  var maxY =
    this.customSettingsValues()[
      epiviz.ui.charts.Visualization.CustomSettings.Y_MAX
    ];

  var colorBy = function (row) {
    return useColorBy
      ? colors.getByKey(row.values)
      : colors.get(row.seriesIndex);

    // if (data.measurements().length > 1) {
    //   return colors.get(row.seriesIndex);
    // }
  };

  let sashimiData = null;

  data.foreach((m, series, seriesIndex) => {
    for (var j = 0; j < series.size(); ++j) {
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      sashimiData = cell.rowItem.rowMetadata();
    }
  });

  console.log("data");
  console.log(sashimiData);

  if (sashimiData == null) return [];

  /* compute */

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

  // TESTING on fake data
  coverageData = [
    { start: 10265000, end: 10265500, value: 2, index: 1 },
    { start: 10265500, end: 10265750, value: 1.5, index: 2 },
    { start: 10265750, end: 10266000, value: 4, index: 3 },
    { start: 10266000, end: 10266250, value: 1, index: 4 },
    { start: 10267000, end: 10267500, value: 2, index: 5 },
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
  // TESTING on fake data

  // data in better shape
  console.log(coverageData);
  console.log(junctionData);

  /* merge regions for area chart */

  const _coverageData_points = _convert_sashimi_coverage(coverageData);
  console.log(_coverageData_points);

  /* plotting */

  var xScale = d3.scale
    .linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X)]);

  var yScale = d3.scale
    .linear()
    .domain([0, Math.max(...coverageData.map((d) => d.value))])
    .range([height - margins.sumAxis(Axis.Y), 0]);

  const _jumps = junctionData.map((junct) => {
    return junct.region2_start - junct.region1_end;
  });

  var junctionJumpScale = d3.scale
    .linear()
    .domain([0, Math.max(..._jumps)])
    .range([0, 1]);

  // var delta = (slide * (width - margins.sumAxis(Axis.X))) / (end - start);

  this._clearAxes();
  this._drawAxes(xScale, yScale, 10, 5);

  const svg = this._svg;

  // coverage

  var items = this._svg.select(".items");

  if (items.empty()) {
    items = this._svg.append("g").attr("class", "items");
  }

  items.attr(
    "transform",
    "translate(" + margins.left() + ", " + margins.top() + ")"
  );

  var selection = items.selectAll(".item").data(coverageData, function (b) {
    return b.index;
  });

  // enter
  selection
    .enter()
    .append("rect")
    .attr("class", "item")
    .attr("fill", "yellow")
    .style("opacity", "0.7");

  // update
  selection
    .attr("x", function (b) {
      return xScale(b.start);
    })
    .attr("y", function (b) {
      return yScale(b.value);
    })
    .attr("width", function (b) {
      return Math.abs(xScale(b.end) - xScale(b.start));
    })
    .attr("height", function (b) {
      return height - margins.sumAxis(Axis.Y) - yScale(b.value);
    });

  // exit
  selection.exit().remove();

  // alternate coverage

  var area = d3.svg
    .area()
    .x(function (d) {
      return xScale(d.x);
    })
    .y0(height - margins.sumAxis(Axis.Y))
    .y1(function (d) {
      return yScale(d.y);
    })
    .interpolate("monotone");

  var items = this._svg.select(".items2");

  if (items.empty()) {
    items = this._svg.append("g").attr("class", "items2");
  }

  items.attr(
    "transform",
    "translate(" + margins.left() + ", " + margins.top() + ")"
  );

  var selection2 = items.selectAll(".areagroup").data(_coverageData_points);

  // enter
  var areagroup = selection2.enter().append("g").attr("class", "areagroup");

  areagroup
    .append("path")
    .style("opacity", "0.7")
    .style("fill", "blue")
    .datum((d, i) => d)
    .attr("class", "area")
    .style("stroke", "blue")
    .style("stroke-width", "3px");

  // update
  selection2.select("path").attr("d", area);

  // exit
  selection2.exit().remove();

  // junctions

  var links = this._svg.select(".links");

  if (links.empty()) {
    links = this._svg.append("g").attr("class", "links");
  }

  links.attr(
    "transform",
    "translate(" + margins.left() + ", " + margins.top() + ")"
  );

  var links_selection = links
    .selectAll(".arcs")
    .data(junctionData, function (b) {
      return b.index;
    });

  // enter
  links_selection.enter().append("g").attr("class", "arcs");

  _path = links_selection.select("path");
  _rect = links_selection.select("rect");
  _text = links_selection.select("text");
  if (_path.empty()) {
    _path = links_selection.append("path");
    _rect = links_selection.append("rect");
    _text = links_selection.append("text");
  }

  // update
  _path
    .style("stroke", "red")
    .style("stroke-width", "3px")
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
        Math.ceil((height - margins.sumAxis(Axis.Y)) * 1),
        "A",
        (end - start) / 2,
        ",",
        Math.ceil(
          (height - margins.sumAxis(Axis.Y)) * junctionJumpScale(r2s - r1e)
        ),
        0,
        0, //junctionJumpScale
        ",",
        start < end ? 1 : 0,
        end,
        ",",
        Math.ceil((height - margins.sumAxis(Axis.Y)) * 1),
      ] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
        .join(" ");
    });

  _rect
    .attr("fill", "white")
    .attr("height", "20px")
    .attr("width", "20px")
    .attr("x", function (b) {
      return (xScale(b.region1_end) + xScale(b.region2_start)) / 2 - 10;
    })
    .attr("y", function (d) {
      return (
        (height - margins.sumAxis(Axis.Y)) *
          (1 - junctionJumpScale(d.region2_start - d.region1_end)) -
        10
      );
    });

  _text
    .text(function (d) {
      return d.value;
    })
    .attr("x", function (b) {
      return (xScale(b.region1_end) + xScale(b.region2_start)) / 2;
    })
    .attr("y", function (d) {
      return (
        (height - margins.sumAxis(Axis.Y)) *
          (1 - junctionJumpScale(d.region2_start - d.region1_end)) +
        2
      );
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "34px")
    .attr("fill", "black")
    .attr("text-anchor", "middle");

  // exit
  links_selection.exit().remove();

  return coverageData;
  // nothing below here

  var area = d3.svg
    .area()
    .defined((d) => !isNaN(d["value"]))
    .x((d) => x(d["data"]))
    .y0(y(0))
    .y1((d) => y(d["value"]));

  // intron

  svg
    .append("path")
    //.datum(data.filter(d3.area().defined()))
    .datum(coverageData.filter(d3.svg.area().defined()))
    .attr("fill", "#eee")
    // .attr("d", area(data));
    .attr("d", area(coverageData));

  // exon

  svg
    .append("path")
    //.datum(testData)
    .datum(coverageData)
    .attr("fill", "steelblue")
    // .attr("d", area(testData));
    .attr("d", area(coverageData));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  console.log(sashimiData.junctions);
  let region1EndArray = [],
    region2StartArray = [],
    linkValuesArray = [];
  let junctionsData = sashimiData.junctions;
  region1EndArray = junctionsData.region1End;
  region2StartArray = junctionsData.region2Start;
  linkValuesArray = junctionsData.value;
  let linksArray = [];
  for (let i = 0; i < region1EndArray.length; i++) {
    if (region2StartArray[i] <= chrEndMax) {
      console.log(region2StartArray[i]);
      var eachLinkObj = {};
      eachLinkObj["source"] = region1EndArray[i];
      eachLinkObj["target"] = region2StartArray[i];
      eachLinkObj["value"] = linkValuesArray[i];
      linksArray.push(eachLinkObj);
    }
  }

  console.log(linksArray);
  //(4.34*4.34 - 6.5*6.5) / 4.34 * (sin(0.588712327))^3

  svg
    .selectAll("myLinks")
    .data(linksArray)
    .enter()
    .append("path")
    .attr("d", function (d) {
      let start = x(d.source); // X position of start node on the X axis
      let end = x(d.target); // X position of end node
      return [
        "M",
        start,
        height - margins._bottom, // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
        "A", // This means we're gonna build an elliptical arc
        (start - end) / 2,
        ",", // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
        (start - end) / 3,
        0,
        0,
        ",",
        start < end ? 1 : 0,
        end,
        ",",
        height - margins._bottom,
      ] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
        .join(" ");
    })
    .style("fill", "none")
    .attr("stroke", "#666666");

  svg
    .selectAll("texts")
    .data(linksArray)
    .enter()
    .append("text")
    .text(function (d) {
      //debugger;
      console.log(
        "values x and y",
        x((d.source + d.target) / 2),
        y((d.target - d.source) / 2)
      );
      return d.value;
    })
    .attr("id", "Name")
    .attr("transform", function (d, i) {
      let xDist = (d.source + d.target) / 2;
      let yDist = (d.target - d.source) / 2;
      let xPoint = x(xDist);
      let yPoint = y(yDist);
      let xCorrection = (5 / 100) * x((d.source + d.target) / 2);
      let yCorrection =
        (d.target - d.source) / 2 - (d.target - d.source) / 2 / 10;

      console.log(yDist, yCorrection, yPoint, y(yCorrection));
      return (
        "translate(" + (xPoint - xCorrection) + ", " + y(yCorrection) + ")"
      );
    })
    .attr("font-size", 14)
    .style("fill", "#000000");

  /* end plotting */

  return;

  var self = this;
  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var blocks = [];

  var i = 0;

  // var all_series_blocks = {};
  var all_series_links = [];
  var all_series_intervals = [];
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

      var metadata = cell.rowItem.rowMetadata();

      all_series_links.push(metadata);

      all_series_intervals.push({
        start: parseInt(cell.rowItem.rowMetadata()["region1start"]),
        end: parseInt(cell.rowItem.rowMetadata()["region1end"]),
      });

      all_series_intervals.push({
        start: parseInt(cell.rowItem.rowMetadata()["region2start"]),
        end: parseInt(cell.rowItem.rowMetadata()["region2end"]),
      });

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
          } else {
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
          classes,
          cell.rowItem.seqName()
        )
      );
    }

    blocks = blocks.concat(seriesBlocks);
    ++i;
  });

  // var merge_intervals = self._mergeIntervals(all_series_intervals);
  var merge_intervals = all_series_intervals.sort((a, b) => a.start - b.start);
  var merge_intervals_blocks = [];

  merge_intervals.forEach(function (it) {
    merge_intervals_blocks.push(
      new epiviz.ui.charts.ChartObject(
        sprintf("b-%s-%s-%s", 0, it.start, it.end),
        it.start,
        it.end,
        null,
        0, // seriesIndex
        [
          [
            new epiviz.datatypes.GenomicData.ValueItem(
              0,
              new epiviz.datatypes.RowItemImpl(
                null,
                range.seqName(),
                it.start,
                it.end,
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
        sprintf("item data-series-%s", 0),
        range.seqName()
      )
    );
  });

  //console.log(measurements);

  return;
  /* TEST */

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

  var selection = items
    .selectAll(".item")
    .data(merge_intervals_blocks, function (b) {
      return b.id;
    });

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
    .attr("width", function (b) {
      // We're using b.end + 1 since b.end is the index of the last covered bp
      return zoom * (xScale(b.end + 1) - xScale(b.start));
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
    .attr("height", Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.1))
    .attr("y", Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9))
    .transition()
    .duration(500)
    .attr("x", function (b) {
      return xScale(b.start);
    })
    .attr("width", function (b) {
      return xScale(b.end + 1) - xScale(b.start);
    });

  selection
    .exit()
    .transition()
    .duration(500)
    .attr("x", function (b) {
      return xScale(b.start);
    })
    .remove();

  items.selectAll(".arcs-group").remove();

  var links = items.selectAll(".arcs-group").data(all_series_links);

  // group and add padding to arcs
  links
    .enter()
    .append("g")
    .attr("class", "arcs-group")
    .each(function (g) {
      var node = this;
      d3.select(this)
        .append("path")
        .attr("class", "arcs")
        .attr("d", function (d) {
          var r1s = parseInt(d.region1start),
            r1e = parseInt(d.region1end),
            r2s = parseInt(d.region2start),
            r2e = parseInt(d.region2end);

          var start = xScale(Math.round((r1s + r1e) / 2));
          var end = xScale(Math.round((r2s + r2e) / 2));

          //Creating an Arc path
          // M start-x, start-y A radius-x, radius-y, x-axis-rotation,
          // large-arc-flag, sweep-flag, end-x, end-y

          return [
            "M",
            start,
            Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),
            "A",
            (end - start) / 2,
            ",",
            Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),
            0,
            0,
            ",",
            start < end ? 1 : 0,
            end,
            ",",
            Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),
          ] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
            .join(" ");
        });

      d3.select(this)
        .append("path")
        .attr("class", "arcs-padding")
        .attr("d", function (d) {
          var r1s = parseInt(d.region1start),
            r1e = parseInt(d.region1end),
            r2s = parseInt(d.region2start),
            r2e = parseInt(d.region2end);

          var start = xScale(Math.round((r1s + r1e) / 2));
          var end = xScale(Math.round((r2s + r2e) / 2));

          //Creating an Arc path
          // M start-x, start-y A radius-x, radius-y, x-axis-rotation,
          // large-arc-flag, sweep-flag, end-x, end-y

          return [
            "M",
            start,
            Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),
            "A",
            (end - start) / 2,
            ",",
            Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),
            0,
            0,
            ",",
            start < end ? 1 : 0,
            end,
            ",",
            Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),
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
    });
  // .on("mouseout", function () {
  //   self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
  // })
  // .on("mouseover", function (b) {
  //   // self._arcHover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), b));
  //   var node = this;
  //   self._arcHover(b, range, node);
  // });

  // using path to create arcs
  // links
  //   .enter()
  //   .append('path')
  //   .attr("class", "arcs")
  //   .attr('d', function (d) {
  //     var r1s = parseInt(d.region1start), r1e = parseInt(d.region1end),
  //         r2s = parseInt(d.region2start), r2e = parseInt(d.region2end);

  //     var start = xScale(Math.round((r1s + r1e) / 2));
  //     var end = xScale(Math.round((r2s + r2e) / 2));

  //     //Creating an Arc path
  //     // M start-x, start-y A radius-x, radius-y, x-axis-rotation,
  //     // large-arc-flag, sweep-flag, end-x, end-y

  //     return ['M', start, Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),
  //       'A',
  //       (end - start)/2, ',',
  //       Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9), 0, 0, ',',
  //       start < end ? 1 : 0, end, ',', Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9)] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
  //       .join(' ');
  //   })
  //   .on("mouseout", function () {
  //     self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
  //   })
  //   .on("mouseover", function (b) {
  //     // self._arcHover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), b));
  //     var node = this;
  //     self._arcHover(b, range, node);
  //   });

  // .style("fill", "none")
  // .style("stroke", "grey")
  // .style("stroke-width", 1)
  // .style("shape-rendering", "auto")
  // .style("stroke-opacity", 0.4)

  // alternative way using ellipse
  // links
  //   .enter()
  //   .append("ellipse")
  //   .attr("class", "arcs")
  //   .attr("cx", function(d) {
  //     var r1s = parseInt(d.region1start), r1e = parseInt(d.region1end),
  //         r2s = parseInt(d.region2start), r2e = parseInt(d.region2end);
  //     var start = xScale(Math.round((r1s + r1e) / 2));
  //     var end = xScale(Math.round((r2s + r2e) / 2));

  //     return (start + end)/2;
  //   })
  //   .attr("cy", Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9))
  //   .attr("rx", function(d) {
  //     var r1s = parseInt(d.region1start), r1e = parseInt(d.region1end),
  //         r2s = parseInt(d.region2start), r2e = parseInt(d.region2end);
  //     var start = xScale(Math.round((r1s + r1e) / 2));
  //     var end = xScale(Math.round((r2s + r2e) / 2));

  //     return (end - start)/2;
  //   })
  //   .attr("ry", Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9))
  //   .attr("fill", "none")
  //   .attr("stroke", "black");

  links.exit().remove();

  self._drawLegend();

  return blocks;
};

epiviz.plugins.charts.SashimiPlot.prototype._mergeIntervals = function (
  intervals
) {
  const mergeInterval = (ac, x) => (
    !ac.length || ac[ac.length - 1].end < x.start
      ? ac.push(x)
      : (ac[ac.length - 1].end = Math.max(ac[ac.length - 1].end, x.end)),
    ac
  );

  return intervals.sort((a, b) => a.start - b.start).reduce(mergeInterval, []);
};

epiviz.plugins.charts.SashimiPlot.prototype._arcHover = function (
  b,
  range,
  node
) {
  var self = this;
  var measurements = self.measurements();

  var regions = [];
  var r1s = parseInt(b.region1start),
    r1e = parseInt(b.region1end),
    r2s = parseInt(b.region2start),
    r2e = parseInt(b.region2end);

  regions.push(
    new epiviz.ui.charts.ChartObject(
      "track-Interaction-hover",
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

  if (selectedObject.id != "track-Interaction-hover") {
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
          var r1s = parseInt(d.region1start),
            r1e = parseInt(d.region1end),
            r2s = parseInt(d.region2start),
            r2e = parseInt(d.region2end);
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
        var r1s = parseInt(d.region1start),
          r1e = parseInt(d.region1end),
          r2s = parseInt(d.region2start),
          r2e = parseInt(d.region2end);

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

// utils
// helper functions
const _convert_sashimi_coverage = (ranges) => {
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

    if (_current.value != 0 && _is_neighbour(_prev, _current)) {
      // add to existing group
      _temp_group.push(_current);
    } else if (_current.value != 0 && !_is_neighbour(_prev, _current)) {
      // reset and new
      final_paths.push(_temp_group);
      _temp_group = [];
      _temp_group.push(_current);
    }

    if (i == ranges.length - 1) final_paths.push(_temp_group);
  }

  // get the points
  final_paths = final_paths.map((array) => {
    return _get_points(array);
  });

  return final_paths;
};

const _is_neighbour = (a, b) => {
  if (a.end == b.start) return true;
  if (a.end > b.start) return true;

  return false;
};

const _get_points = (array) => {
  result = [];

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
