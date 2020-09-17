/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/16/13
 * Time: 9:35 AM
 */

goog.provide("epiviz.plugins.charts.InteractionBlocksTrack");

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
epiviz.plugins.charts.InteractionBlocksTrack = function (id, container, properties) {
  // Call superclass constructor
  epiviz.plugins.charts.BlocksTrack.call(this, id, container, properties);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.InteractionBlocksTrack.prototype = epiviz.utils.mapCopy(
  epiviz.plugins.charts.BlocksTrack.prototype
);

epiviz.plugins.charts.InteractionBlocksTrack.constructor =
  epiviz.plugins.charts.InteractionBlocksTrack;

  /**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} slide
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.InteractionBlocksTrack.prototype._drawBlocks = function (
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
    epiviz.plugins.charts.BlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE
  ];

  var colorLabel = this.customSettingsValues()[
    epiviz.plugins.charts.BlocksTrackType.CustomSettings.BLOCK_COLOR_BY
  ];

  var useColorBy = this.customSettingsValues()[
    epiviz.plugins.charts.BlocksTrackType.CustomSettings.USE_COLOR_BY
  ];

  var scaleLabel = this.customSettingsValues()[
    epiviz.plugins.charts.BlocksTrackType.CustomSettings.BLOCK_SCALE_BY
  ];

  var useScaleBy = this.customSettingsValues()[
    epiviz.plugins.charts.BlocksTrackType.CustomSettings.USE_SCALE_BY
  ];

  var minY = this.customSettingsValues()[
    epiviz.ui.charts.Visualization.CustomSettings.Y_MIN
  ];

  var maxY = this.customSettingsValues()[
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

      var metadata  = cell.rowItem.rowMetadata();

      all_series_links.push(metadata);

      all_series_intervals.push(
        {
          "start": parseInt(cell.rowItem.rowMetadata()["region1start"]),
          "end": parseInt(cell.rowItem.rowMetadata()["region1end"])
          // "id": sprintf(
          //   "b-%s-%s-%s",
          //   i,
          //   parseInt(cell.rowItem.rowMetadata()["region1start"]),
          //   parseInt(cell.rowItem.rowMetadata()["region1end"])
          // ),
          // "cssClasses" : classes,
          // "chr": cell.rowItem.seqName()
        }
      )

      all_series_intervals.push(
        {
          "start": parseInt(cell.rowItem.rowMetadata()["region2start"]),
          "end": parseInt(cell.rowItem.rowMetadata()["region2end"])
          // "id": sprintf(
          //         "b-%s-%s-%s",
          //         i,
          //         parseInt(cell.rowItem.rowMetadata()["region2start"]),
          //         parseInt(cell.rowItem.rowMetadata()["region2end"])
          //       ),
          // "cssClasses" : classes,
          // "chr": cell.rowItem.seqName()
        }
      )

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
          classes,
          cell.rowItem.seqName()
        )
      );
    }

    blocks = blocks.concat(seriesBlocks);
    ++i;
  });

  // var merge_intervals = self._mergeIntervals(all_series_intervals);
  var merge_intervals = all_series_intervals.sort((a,b) => a.start - b.start)
  var merge_intervals_blocks = [];

  merge_intervals.forEach(function(it) {
    merge_intervals_blocks.push(
      new epiviz.ui.charts.ChartObject(
        sprintf("b-%s-%s-%s", 0, it.start, it.end),
        it.start,
        it.end,
        null,
        0, // seriesIndex
        [[
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
          )
        ]], // valueItems
        [measurements], // measurements
        sprintf("item data-series-%s", 0),
        range.seqName()
      )
    );
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

  var selection = items.selectAll(".item").data(merge_intervals_blocks, function (b) {
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

  items.selectAll(".arcs").remove();

  var links = items
          .selectAll('.arcs')
          .data(all_series_links);

  links
    .enter()
    .append('path')
    .attr("class", "arcs")
    .attr('d', function (d) {
      var r1s = parseInt(d.region1start), r1e = parseInt(d.region1end), 
          r2s = parseInt(d.region2start), r2e = parseInt(d.region2end);

      var start = xScale(Math.round((r1s + r1e) / 2));  
      var end = xScale(Math.round((r2s + r2e) / 2));      

      //Creating an Arc path
      // M start-x, start-y A radius-x, radius-y, x-axis-rotation,
      // large-arc-flag, sweep-flag, end-x, end-y

      return ['M', start, Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9),    
        'A',                            
        (end - start)/2, ',',
        Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9), 0, 0, ',',
        start < end ? 1 : 0, end, ',', Math.ceil((height - margins.sumAxis(Axis.Y)) * 0.9)] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
        .join(' ');
    })
    .on("mouseout", function () {
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .on("mouseover", function (b) {
      // self._arcHover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), b));
      var node = this;
      self._arcHover(b, range, node);
    });
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
  
  links
    .exit()
    .remove();

  self._drawLegend();

  return blocks;
};

epiviz.plugins.charts.InteractionBlocksTrack.prototype._mergeIntervals = function(intervals) {
  const mergeInterval = (ac, x) => (!ac.length || ac[ac.length - 1].end < x.start
    ? ac.push(x)
    : ac[ac.length - 1].end = Math.max(ac[ac.length - 1].end, x.end), ac);

  return intervals
    .sort((a,b) => a.start - b.start)
    .reduce(mergeInterval, []);
};

epiviz.plugins.charts.InteractionBlocksTrack.prototype._arcHover = function(b, range, node) {
  var self = this;
  var measurements = self.measurements();

  var regions = [];
  var r1s = parseInt(b.region1start), r1e = parseInt(b.region1end), 
  r2s = parseInt(b.region2start), r2e = parseInt(b.region2end);

  regions.push(
    new epiviz.ui.charts.ChartObject(
      "track-Interaction-hover",
      r1s,
      r2e,
      null,
      0, // seriesIndex
      [[
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
        )
      ]], // valueItems
      [measurements], // measurements
      null,
      range.seqName()
    )
  )

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

  var itemsGroup = this._container.find(".items")  
  var unselectedHoveredGroup = itemsGroup.find("> .hovered");
  var selectedGroup = itemsGroup.find("> .selected");
  var selectedHoveredGroup = selectedGroup.find("> .hovered");

  selectedHoveredGroup.append(node);


  self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), regions[0]));
}


epiviz.plugins.charts.InteractionBlocksTrack.prototype.doHover = function(selectedObject) {
  epiviz.plugins.charts.BlocksTrack.prototype.doHover.call(this, selectedObject);
  var self = this;

  if (selectedObject.id != "track-Interaction-hover") {
    var itemsGroup = this._container.find(".items")  
    var unselectedHoveredGroup = itemsGroup.find("> .hovered");
    var selectedGroup = itemsGroup.find("> .selected");
    var selectedHoveredGroup = selectedGroup.find("> .hovered");
  
    var filter = function() {
      if (Array.isArray(selectedObject)) {
        var match = false;
  
        for (var sIndex = 0; sIndex < selectedObject.length; sIndex++) {
          var sel = selectedObject[sIndex];
          // if (sel.overlapsWith(d3.select(this).data()[0])) {
          //   match = true;
          // }
          var d = d3.select(this).data()[0];
          var r1s = parseInt(d.region1start), r1e = parseInt(d.region1end), 
              r2s = parseInt(d.region2start), r2e = parseInt(d.region2end);
          // var start = xScale(Math.round((r1s + r1e) / 2));  
          // var end = xScale(Math.round((r2s + r2e) / 2)); 
  
          if ((sel.regionStart() < r1e && sel.regionEnd() > r1s) ||
              (sel.regionStart() < r2e && sel.regionEnd() > r2s)) {
                match = true;
          }
        }
  
        return match;
      } else {
  
        var d = d3.select(this).data()[0];
        var r1s = parseInt(d.region1start), r1e = parseInt(d.region1end), 
            r2s = parseInt(d.region2start), r2e = parseInt(d.region2end);
        
        return (selectedObject.regionStart() < r1e && selectedObject.regionEnd() > r1s) ||
                (selectedObject.regionStart() < r2e && selectedObject.regionEnd() > r2s);
        // selectedObject.overlapsWith(d3.select(this).data()[0]);
      }
    };
  
    var selectItems = itemsGroup.find("> .arcs").filter(filter);
    unselectedHoveredGroup.append(selectItems);
  
    selectItems = selectedGroup.find("> .arcs").filter(filter);
    selectedHoveredGroup.append(selectItems);
  }
};