/**
 * Created by Jayaram Kanchera ( jayaram.kancherla@gmail.com )
 * Date: 5/05/21
 */

goog.provide("epiviz.plugins.charts.GuideBBTrack");

goog.require("epiviz.ui.charts.Track");
goog.require("epiviz.ui.charts.Axis");
goog.require("epiviz.ui.charts.ChartObject");
goog.require("epiviz.ui.charts.VisEventArgs");
goog.require("epiviz.utils");

/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Track}
 * @constructor
 */
epiviz.plugins.charts.GuideBBTrack = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.GuideBBTrack.prototype = epiviz.utils.mapCopy(
  epiviz.ui.charts.Track.prototype
);
epiviz.plugins.charts.GuideBBTrack.constructor = epiviz.plugins.charts.GuideBBTrack;

/**
 * @protected
 */
epiviz.plugins.charts.GuideBBTrack.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);

  this._svg.classed("guide-track", true);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.GuideBBTrack.prototype.draw = function(
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
  if (!data || !range) {
    return [];
  }

  // if (showguides == "default") {
  //   var series = data.firstSeries();
  // }

  slide = slide || this._slide;
  zoom = zoom || this._zoom;
  this._slide = 0;
  this._zoom = 1;

  return this._drawGuides(range, data, slide || 0, zoom || 1);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} slide
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.GuideBBTrack.prototype._drawGuides = function(
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

  var xScale = d3.scale
    .linear()
    .domain([start, end])
    .range([0, width - margins.sumAxis(Axis.X)]);
  var delta = (slide * (width - margins.sumAxis(Axis.X))) / (end - start);

  this._clearAxes();
  this._drawAxes(xScale, null, 10, 5);

  var self = this;
  /** @type {epiviz.datatypes.MeasurementGenomicData} */
  var series = data.firstSeries();
  // self.seriesData = series;
  const IntervalTree = window["@flatten-js/interval-tree"].default;
 
  self._iTreeFwd = {};
  self._iTreeRvs = {};

  self._oiTreeFwd = new IntervalTree();
  self._oiTreeRvs = new IntervalTree();

  self._maxFwdCount = 0;
  self._maxRvsCount = 0;

  var numGuide = Math.floor(width/100);
  self.GuidesToShow = [];

  self.ShowGuideNames = false;
  if(series.size() <= numGuide) {
    self.ShowGuideNames = true;
  } else {
    var partition = Math.round(100 * range.width() / (width - margins.sumAxis(Axis.X)));

    for (var i=0; i < numGuide; i++) {
      var tempRange = epiviz.datatypes.GenomicRange.fromStartEnd(
        range.seqName(),
        range.start() + ((i) * partition),
        range.start + ((i+1) * partition),
        range.genome());

        var drawBoundaries = series.binarySearchStarts(tempRange);
        var first_guide = series.get(drawBoundaries.index);
        self.GuidesToShow.push(first_guide.rowItem.metadata("name"));
    }
  }

  var showGuides = "default";

  var indices = epiviz.utils.range(series.size());
  // self._overlaps = {};
  self._genesMap = {};
  self._genesMapStrand = {};
  self._genesExonsMap = {};
  var maxStackf = 0, maxStackr = 0;

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var dataItems = indices.map(function(i) {
    var cell = series.get(i);
    var item = cell.rowItem;

    if (showGuides == "default") {
      var classes = sprintf("item guide-%s", item.metadata("name"));
      var strand_aware = item.strand() + "_" + item.metadata("gene");

      if(!(strand_aware in self._genesMap)) {
        self._genesMap[strand_aware] = [];
        self._genesMapStrand[strand_aware] = item.strand();
        self._genesExonsMap[strand_aware] = {};
      }
      
      self._genesMap[strand_aware].push(classes);
      
      var uiObj = new epiviz.ui.charts.ChartObject(
        item.metadata("name"),
        item.start(),
        item.end(),
        null,
        0,
        [[cell]],
        [series.measurement()],
        classes,
        item.seqName()
      );

      // var rowItem = cell.rowItem;
      var or = item.strand() == "+" ? 1 : -1;
      if (item.strand() == "+") {
        guideStart = xScale(uiObj.start);
        guideEnd = xScale(uiObj.end);
    
        self._oiTreeFwd.insert([guideStart, guideEnd]);
        // console.log("insert fwd, " + guideStart + " :: " + guideEnd)

        var search = self._oiTreeFwd.search([guideStart, guideEnd])

        if (search.length > maxStackf ) {
          maxStackf = search.length;
        }
      } else {
        guideStart = xScale(uiObj.start);
        guideEnd = xScale(uiObj.end);
        self._oiTreeRvs.insert([guideStart, guideEnd]);
        // console.log("insert rvs, " + guideStart + " :: " + guideEnd)
        var search = self._oiTreeRvs.search([guideStart, guideEnd])

        if (search.length > maxStackr) {
          maxStackr = search.length;
        }
      }
      return uiObj;
    }
  });

  self.fStrand = maxStackf + 3;
  self.rStrand = maxStackr + 3;

  self._fwdCount = 0;
  self._rvsCount = 0;

  // for(var g in self._genesMapStrand) {
  //   if (self._genesMapStrand[g] == "+" && self.fStrand < self._genesMap[g].length) {
  //     self.fStrand = self._genesMap[g].length;
  //   } 
  //   else if (self._genesMapStrand[g] == "-" && self.rStrand < self._genesMap[g].length) {
  //     self.rStrand = self._genesMap[g].length;
  //   }
  // }

  var cheight = height - margins.sumAxis(Axis.Y) - 10;
  self.tHeight = 3;
  self.tPadding = 3;
  self.heightPerGuide = self.tHeight + self.tPadding;
  if (self.heightPerGuide * (self.fStrand + self.rStrand) < cheight) {
    self.tHeight = Math.floor((cheight - (self.tPadding * (self.fStrand + self.rStrand)))/(self.fStrand + self.rStrand))
  }

  self.heightPerGuide = self.tHeight + self.tPadding;
  self.tCenter = 5 + (self.fStrand) * (self.tHeight + (1 * self.tPadding));

  dataItems = dataItems.filter(function(d) { return d != undefined;})

  if (zoom) {
    this._svg.select(".items").remove();
    this._svg
      .select("defs")
      .select("#clip-" + this.id())
      .remove();
  }

  var items = this._svg.select(".items");
  var selected = items.select(".selected");

  if (items.empty()) {
    var defs = this._svg.select("defs");
    defs
      .append("clipPath")
      .attr("id", "clip-" + this.id())
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width - margins.sumAxis(Axis.X))
      .attr("height", height - margins.sumAxis(Axis.Y));

    items = this._svg
      .append("g")
      .attr("class", "items")
      .attr(
        "transform",
        "translate(" + margins.left() + ", " + margins.top() + ")"
      )
      .attr("id", this.id() + "-guide-content")
      .attr("clip-path", "url(#clip-" + this.id() + ")");

    selected = items.append("g").attr("class", "selected");
    items.append("g").attr("class", "hovered");
    selected.append("g").attr("class", "hovered");
  }

  var selection = items.selectAll(".item").data(dataItems, function(d) {
    return d.id;
  });

  selection
    .enter()
    .insert("g", ":first-child")
    .on("mouseout", function() {
      // self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .on("mouseover", function(d) {
      // self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
    })
    .on("click", function(d) {
      self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
      d3.event.stopPropagation();
    })
    .attr("transform", "translate(" + delta + ", 0) scale(1, 1)")
    .each(function(d, i) {
      self._drawGuide(this, d, i, xScale, data);
    });

  if (delta) {
    selection.each(function(d) {
      self._translateGuide(this, d, delta);
    });
  }

  selection
    .exit()
    .transition()
    .duration(500)
    .style("opacity", 0)
    .remove();

  return dataItems;
};

/**
 * @param elem
 * @param {epiviz.ui.charts.ChartObject} d
 * @param delta
 * @private
 */
epiviz.plugins.charts.GuideBBTrack.prototype._translateGuide = function(
  elem,
  d,
  delta
) {
  var guide = d3.select(elem);
  var transform = guide.attr("transform");
  var translateRx = new RegExp(
    "translate\\([\\d\\.\\-]+[\\,\\s]+[\\d\\.\\-]+\\)",
    "g"
  );
  var numberRx = new RegExp("[\\d\\.\\-]+", "g");
  var translate = transform.match(translateRx)[0];
  var x = parseFloat(translate.match(numberRx)[0]);

  transform = transform.replace(
    translateRx,
    "translate(" + (x - delta) + ", 0)"
  );
  guide
    .transition()
    .duration(500)
    .attr("transform", transform);
};

epiviz.plugins.charts.GuideBBTrack.prototype.getStacky = function(guideStart, guideEnd, strand,
    itree, maxStack) {

  const IntervalTree = window["@flatten-js/interval-tree"].default;
    
  var stacky = 0;
  for (var i=0; i< maxStack; i++) {
    if (!itree[i]) {
      itree[i] = new IntervalTree();
    }

    var search = itree[i].search([guideStart, guideEnd]);
    if (search.length == 0) {
      stacky = i;
      break;
    } 
  }
  return stacky;
}


/**
 * @param elem
 * @param {epiviz.ui.charts.ChartObject} d
 * @param {function(number): number} xScale
 * @private
 */
epiviz.plugins.charts.GuideBBTrack.prototype._drawGuide = function(
  elem,
  d,
  i,
  xScale,
  data
) {
  var Axis = epiviz.ui.charts.Axis;
  var self = this;
  var rowItem = d.valueItems[0][0].rowItem;
  var or = rowItem.strand() == "+" ? 1 : -1;
  var offset = -or * 4;
  var guideHeight = self.tHeight;
  var h = self.tHeight * Math.sqrt(3) * 0.5;

  var guideStart = 0;
  var guideEnd = 0;
  var search = 0;

  if (rowItem.strand() == "+") {
    guideStart = xScale(d.start);
    guideEnd = xScale(d.end);

    search = self.getStacky(guideStart, guideEnd, rowItem.strand(), 
      self._iTreeFwd, self.fStrand)
    self._iTreeFwd[search].insert([guideStart, guideEnd]);
  } else {
    guideStart = xScale(d.start);
    guideEnd = xScale(d.end);
    search = self.getStacky(guideStart, guideEnd, rowItem.strand(), 
      self._iTreeRvs, self.rStrand)
    self._iTreeRvs[search].insert([guideStart, guideEnd]);
  }

  var stacky = search;

  var guide = d3.select(elem);
  guide.attr("class", d.cssClasses);

  guide
    .append("polygon")
    .attr("class", "guide-body")
    .style("fill", self.colors().get(0))
    .attr("points", function() {
      var xs = null,
        ys;

      var y = self.tCenter + offset;
      var istack = stacky;
      // var istack = self._genesMap[d.valueItems[0][0].rowItem.strand() + "_" + d.valueItems[0][0].rowItem.rowMetadata()["gene"]].indexOf(d.cssClasses);
      var y0 = y + (-or * (istack) * (self.tHeight + self.tPadding));

      if (rowItem.strand() == "+") {
        xs = [guideStart, guideEnd, guideEnd + h, guideEnd, guideStart];
        ys = [y0, y0, y0 + (-or * guideHeight) * 0.5, 
                y0 + (-or * guideHeight), y0 + (-or * guideHeight)];
      } else {
        xs = [guideEnd, guideStart, guideStart - h, guideStart, guideEnd];
        ys = [y0 + guideHeight, y0 + guideHeight, 
              y0 + guideHeight * 0.5, y0, y0];      
      }

      return sprintf(
        "%s,%s %s,%s %s,%s %s,%s %s,%s",
        xs[0],
        ys[0],
        xs[1],
        ys[1],
        xs[2],
        ys[2],
        xs[3],
        ys[3],
        xs[4],
        ys[4]
      );
    });    

  var sites = guide
    .append("g")
    .attr("class", "sites");

  var sites_position = [[parseInt(rowItem.metadata("pamStart")), parseInt(rowItem.metadata("pamEnd"))], [parseInt(rowItem.metadata("cutSite"))]];

  var siteCount = sites_position.length;
  var siteIndices = d3.range(0, siteCount);

  sites
    .selectAll("rect")
    .data(siteIndices)
    .enter()
    .append("rect")
    .attr("x", function(j) {
      return xScale(sites_position[j][0]);
    })
    .attr("y", function(j) {
      var istack = stacky;

      var y0 = (self.tCenter + offset
        + (-or * istack
        * (self.tHeight + self.tPadding)) - 1)

      return rowItem.strand() == "+" ? y0 + (-or * guideHeight) : y0;
    })
    .attr("width", function(j) {
      if (j == 0) {
        if (rowItem.strand() == "+") {
          return xScale(sites_position[j][1]) - xScale(sites_position[j][0]);
        } else {
          return xScale(sites_position[j][1]) - xScale(sites_position[j][0]);
        }
      } else {
        return xScale(sites_position[j][0] + 1) - xScale(sites_position[j][0]);
      }
    })
    .attr("height", guideHeight + 2)
    .style("fill", function(j) {
      return j == 0 ? "grey" : "red";
    })
    .attr("fill-opacity", 0.8);
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.GuideBBTrack.prototype.colorLabels = function() {
  return ["Guide", "Sites"];
};

/**
* @param {epiviz.ui.charts.ChartObject} selectedObject
*/
epiviz.plugins.charts.GuideBBTrack.prototype.doHover = function(selectedObject) {
  //  epiviz.ui.charts.Chart.prototype.doHover.call(this, selectedObject);

   var self = this;

   if (selectedObject.start == undefined || selectedObject.end == undefined) {
       return;
   }

   if (!this._lastRange) {
       return;
   }

   this._highlightGroup.selectAll("rect").remove();
   this._highlightGroup.attr(
       "transform",
       "translate(" + this.margins().left() + ", " + 0 + ")"
   );

   var Axis = epiviz.ui.charts.Axis;
   var xScale = d3.scale
       .linear()
       .domain([this._lastRange.start(), this._lastRange.end()])
       .range([0, this.width() - this.margins().sumAxis(Axis.X)]);

   var items = [];
   if (!selectedObject.measurements || !selectedObject.measurements.length) {
       items.push({ start: selectedObject.start, end: selectedObject.end });
   } else {
       for (var i = 0; i < selectedObject.valueItems[0].length; ++i) {
           var rowItem = selectedObject.valueItems[0][i].rowItem;
           items.push({ start: rowItem.start(), end: rowItem.end() });
       }
   }

   var minHighlightSize = 5;

   if (self.chartDrawType == "canvas") {
       // Show highlight on tracks
       var ctx = self.hoverCanvas.getContext("2d");
       ctx.clearRect(0, 0, self.hoverCanvas.width, self.hoverCanvas.height);

       items.forEach(function(d) {
           ctx.beginPath();

           ctx.fillStyle = self.colors().get(0);
           ctx.globalAlpha = 0.1;
           var defaultWidth = xScale(d.end + 1) - xScale(d.start);
           var width = Math.max(minHighlightSize, defaultWidth);
           var x = xScale(d.start) + defaultWidth * 0.5 - width * 0.5;

           ctx.fillRect(
               x,
               0,
               Math.max(minHighlightSize, xScale(d.end + 1) - xScale(d.start)),
               self.height()
           );
       });

       return;
   }

   this._highlightGroup
       .selectAll("rect")
       .data(items, function(d) {
           return sprintf("%s-%s", d.start, d.end);
       })
       .enter()
       .append("rect")
       .style("fill", this.colors().get(0))
       .style("fill-opacity", "0.1")
       .attr("x", function(d) {
           var defaultWidth = xScale(d.end + 1) - xScale(d.start);
           var width = Math.max(minHighlightSize, defaultWidth);
           return xScale(d.start) + defaultWidth * 0.5 - width * 0.5;
       })
       .attr("width", function(d) {
           return Math.max(minHighlightSize, xScale(d.end + 1) - xScale(d.start));
       })
       .attr("y", 0)
       .attr("height", this.height());
};