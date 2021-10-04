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
  /* TEST */

  console.log("we have data");
  console.log("svg");
  console.log(this._svg);
  console.log("range");
  console.log(range);
  console.log("data");
  console.log(data);
  console.log("slide");
  console.log(slide);
  console.log("zoom");
  console.log(zoom);

  let sashimiData = null;

  data.foreach((m, series, seriesIndex) => {
    for (var j = 0; j < series.size(); ++j) {
      console.log("-----------------------------------------");
      /** @type {epiviz.datatypes.GenomicData.ValueItem} */
      var cell = series.get(j);
      sashimiData = cell.rowItem.rowMetadata();
    }
  });

  console.log("my data is");
  console.log(sashimiData);

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

  var xScale = d3.scale
    .linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X)]);
  var delta = (slide * (width - margins.sumAxis(Axis.X))) / (end - start);

  this._clearAxes();
  this._drawAxes(xScale, null, 10, 5);

  /* compute */

  let coverage = sashimiData.coverage,
    chrStart = coverage.start,
    chrEnd = coverage.end,
    chrStartMax = Math.max(...chrStart),
    chrEndMax = Math.max(...chrEnd),
    chrStartMin = Math.min(...chrStart),
    chrEndMin = Math.min(...chrEnd),
    coverageStart = Math.min(chrStartMin, chrEndMin),
    coverageEnd = Math.max(chrStartMax, chrEndMax);

  // console.log(chrStartMax, chrEndMax, coverageStart, coverageEnd);

  let coverageData = [];
  for (let i = coverageStart; i <= coverageEnd; i++) {
    let eachDataObj = {};
    //eachDataObj['chr'] = '';
    eachDataObj["data"] = i;
    eachDataObj["value"] = undefined;
    coverageData.push(eachDataObj);
  }

  // console.log(coverageData);
  let coverageMap = {};
  for (let i = 0; i < chrStart.length; i++) {
    for (var j = chrStart[i]; j <= chrEnd[i]; j++) {
      //console.log(i, j, coverage.value[i]); //debugger;
      coverageMap[j] = coverage.value[i];
    }
  }

  // console.log(coverageMap);
  // console.log(coverageData);

  for (let i = 0; i < coverageData.length; i++) {
    let mapKey = (i + 1).toString();
    // console.log(coverageData[i]);
    coverageData[i]["value"] = coverageMap[mapKey];
  }

  // console.log(coverageData);

  /* end compute */

  /* plotting */

  const svg = this._svg;

  let x = d3.scale
    .linear()
    //.domain(d3.extent(data, d => d.date))
    .domain(d3.extent(coverageData, (d) => d.data))
    .range([margins._left, width - margins._right]);

  let y = d3.scale
    .linear()
    //.domain([0, d3.max(data, d => d.value)]).nice()
    .domain([0, d3.max(coverageData, (d) => d.value) * 2])
    .nice()
    .range([height - margins._bottom, margins._top]);

  let xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margins._bottom})`).call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  let yAxis = (g) =>
    g
      .attr("transform", `translate(${margins._left},0)`)
      .call(d3.axisLeft(y))
      .call((g) => g.select(".domain"))
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          //.text(data['y'])
          .text(coverageData["y"])
      );

  var area = d3.svg
    .area()
    .defined((d) => !isNaN(d["value"]))
    .x((d) => x(d["data"]))
    .y0(y(0))
    .y1((d) => y(d["value"]));

  svg
    .append("path")
    //.datum(data.filter(d3.area().defined()))
    .datum(coverageData.filter(d3.svg.area().defined()))
    .attr("fill", "#eee")
    // .attr("d", area(data));
    .attr("d", area(coverageData));

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
