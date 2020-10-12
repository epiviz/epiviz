/**
 * Created by Jayaram Kanchera ( jayaram.kancherla@gmail.com )
 * Date: 10/04/20
 */

goog.provide("epiviz.plugins.charts.TranscriptTrack");

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
epiviz.plugins.charts.TranscriptTrack = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Track.call(this, id, container, properties);

  this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.TranscriptTrack.prototype = epiviz.utils.mapCopy(
  epiviz.ui.charts.Track.prototype
);
epiviz.plugins.charts.TranscriptTrack.constructor = epiviz.plugins.charts.TranscriptTrack;

/**
 * @protected
 */
epiviz.plugins.charts.TranscriptTrack.prototype._initialize = function() {
  // Call super
  epiviz.ui.charts.Track.prototype._initialize.call(this);

  this._svg.classed("transcript-track", true);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {epiviz.datatypes.GenomicData} [data]
 * @param {number} [slide]
 * @param {number} [zoom]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */
epiviz.plugins.charts.TranscriptTrack.prototype.draw = function(
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

  // if (showTranscripts == "default") {
  //   var series = data.firstSeries();
  // }

  slide = slide || this._slide;
  zoom = zoom || this._zoom;
  this._slide = 0;
  this._zoom = 1;

  return this._drawTranscripts(range, data, slide || 0, zoom || 1);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @param {number} slide
 * @param {number} zoom
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.TranscriptTrack.prototype._drawTranscripts = function(
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

  var numTranscript = Math.floor(width/100);
  self.TranscriptToShow = [];

  self.ShowtranscriptNames = false;
  if(series.size() <= numTranscript) {
    self.ShowtranscriptNames = true;
  } else {
    var partition = Math.round(100 * range.width() / (width - margins.sumAxis(Axis.X)));

    for (var i=0; i < numTranscript; i++) {
      var tempRange = epiviz.datatypes.GenomicRange.fromStartEnd(
        range.seqName(),
        range.start() + ((i) * partition),
        range.start + ((i+1) * partition),
        range.genome());

        var drawBoundaries = series.binarySearchStarts(tempRange);
        var first_transcript = series.get(drawBoundaries.index);
        self.TranscriptToShow.push(first_transcript.rowItem.metadata("transcript_id"));
    }
  }

  var showTranscripts = this.customSettingsValues()[
    epiviz.plugins.charts.TranscriptTrackType.CustomSettings.SHOW_TRANSCRIPTS
  ];

  var vizTranscripts;

  if (showTranscripts == "default") {
    // var transcripts = 
    // var settingsValues = self.customSettingsValues();
    // vizTranscripts = series._container._rowData._metadata["transcript_id"];
    // settingsValues["showTranscripts"] = vizTranscripts.join(",")
    // self.setCustomSettingsValues(settingsValues);
  } else {
    vizTranscripts = showTranscripts.split(",");
  }

  var indices = epiviz.utils.range(series.size());
  // self._overlaps = {};
  self._genesMap = {};

  /** @type {Array.<epiviz.ui.charts.ChartObject>} */
  var dataItems = indices.map(function(i) {
    var cell = series.get(i);
    var item = cell.rowItem;

    if (showTranscripts == "default" || vizTranscripts.indexOf(item.metadata("transcript_id")) == -1 ) {
      var classes = sprintf("item transcript-%s", item.metadata("transcript_id"));

      // var tdrawBoundaries = series.binarySearchStarts(tempRange);
      // var first_transcript = series.get(drawBoundaries.index);
      // self._overlaps[classes] = [i, tdrawBoundaries];
      if(!(item.metadata("gene") in self._genesMap)) {
        self._genesMap[item.metadata("gene")] = [];
      }
      
      self._genesMap[item.metadata("gene")].push(classes);
      
      return new epiviz.ui.charts.ChartObject(
        item.metadata("transcript_id"),
        item.start(),
        item.end(),
        null,
        0,
        [[cell]],
        [series.measurement()],
        classes,
        item.seqName()
      );
    }
  });

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

    // defs.append("marker")
    //   .attr({
    //     "id":"arrow",
    //     "viewBox":"0 -5 10 10",
    //     "refX":5,
    //     "refY":0,
    //     "markerWidth":4,
    //     "markerHeight":4,
    //     "orient":"auto-start-reverse"
    //   })
    //   .append("path")
    //     .attr("d", "M0,-5L10,0L0,5")
    //     .attr("class","arrowHead");

    items = this._svg
      .append("g")
      .attr("class", "items")
      .attr(
        "transform",
        "translate(" + margins.left() + ", " + margins.top() + ")"
      )
      .attr("id", this.id() + "-transcript-content")
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
      self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
    })
    .on("mouseover", function(d) {
      self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
    })
    .on("click", function(d) {
      self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
      self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
      d3.event.stopPropagation();
    })
    .attr("transform", "translate(" + delta + ", 0) scale(1, 1)")
    .each(function(d, i) {
      self._drawTranscript(this, d, i, xScale, data);
    });

  if (delta) {
    selection.each(function(d) {
      self._translateTranscript(this, d, delta);
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
epiviz.plugins.charts.TranscriptTrack.prototype._translateTranscript = function(
  elem,
  d,
  delta
) {
  var transcript = d3.select(elem);
  var transform = transcript.attr("transform");
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
  transcript
    .transition()
    .duration(500)
    .attr("transform", transform);
};

/**
 * @param elem
 * @param {epiviz.ui.charts.ChartObject} d
 * @param {function(number): number} xScale
 * @private
 */
epiviz.plugins.charts.TranscriptTrack.prototype._drawTranscript = function(
  elem,
  d,
  i,
  xScale,
  data
) {
  var Axis = epiviz.ui.charts.Axis;
  var self = this;
  var rowItem = d.valueItems[0][0].rowItem;
  var transcriptStart = xScale(d.start);
  var transcriptEnd = xScale(d.end);
  var or = rowItem.strand() == "+" ? 1 : -1;
  var offset = -or * (this.height() - this.margins().sumAxis(Axis.Y)) * 0.001;

  var exonStarts = rowItem
    .metadata("exon_starts")
    .split(",")
    .map(function(s) {
      return parseInt(s);
    });
  
    var exonEnds = rowItem
    .metadata("exon_ends")
    .split(",")
    .map(function(s) {
      return parseInt(s);
    });

  var exonCount = exonStarts.length;
  var exonIndices = d3.range(0, exonCount);

  // var transcriptHeight = this.height() * 0.08;
  var transcriptHeight = 3;
  var tssHeight = this.height() * 0.16;
  var h = transcriptHeight * Math.sqrt(3) * 0.5;

  var transcript = d3.select(elem);
  transcript.attr("class", d.cssClasses);

  transcript
    .append("polygon")
    .attr("class", "transcript-body")
    .style("fill", this.colors().get(0))
    .attr("points", function() {
      var xs = null,
        ys;

      var y = (self.height() - self.margins().sumAxis(Axis.Y)) * 0.5 + offset;
      // return y + (-or * (2 * (self._overlaps[d.cssClasses][0] - self._overlaps[d.cssClasses][1].index)));
      var istack = self._genesMap[d.valueItems[0][0].rowItem.rowMetadata()["gene"]].indexOf(d.cssClasses);
      var y0 = y + (-or * ((istack * 10) + 5));
      // var y0 =
      //   (self.height() - self.margins().sumAxis(Axis.Y) - transcriptHeight) * 0.5 +
      //   offset;
      ys = [y0, y0, y0 + transcriptHeight * 0.5, y0 + transcriptHeight, y0 + transcriptHeight];
      if (rowItem.strand() == "+") {
        xs = [transcriptStart, transcriptEnd, transcriptEnd + h, transcriptEnd, transcriptStart];
      } else {
        xs = [transcriptEnd, transcriptStart, transcriptStart - h, transcriptStart, transcriptEnd];
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
    
  transcript
    .append("text")
    .attr("class", function(d) {
      return "transcript-name";
    })
    .attr("x", function(d) {
      if (d.valueItems[0][0].rowItem.strand() == "+") {
        return transcriptStart + 2;
      }

      return transcriptEnd - 2;
    })
    .attr(
      "y",
      (self.height() - self.margins().sumAxis(Axis.Y)) * 0.5 +
        offset + (-or * ((self._genesMap[d.valueItems[0][0].rowItem.rowMetadata()["gene"]].indexOf(d.cssClasses) * 10) + 5))
    )
    .attr("text-anchor", function(d) {
      if (d.valueItems[0][0].rowItem.strand() == "+") {
        return "start";
      }

      return "end";
    })
    .style("dominant-baseline", "central")
    .text(d.id);

  var exons = transcript
    .append("g")
    .attr("class", "exons")
    .style("fill", this.colors().get(1));

  exons
    .selectAll("rect")
    .data(exonIndices)
    .enter()
    .append("rect")
    .attr("x", function(j) {
      return xScale(exonStarts[j]);
    })
    .attr(
      "y",
      (self.height() - self.margins().sumAxis(Axis.Y)) * 0.5 +
      offset + (-or * (
        (self._genesMap[d.valueItems[0][0].rowItem.rowMetadata()["gene"]].indexOf(d.cssClasses) * 10) + 5)) - 1
    )
    .attr("width", function(j) {
      return xScale(exonEnds[j]) - xScale(exonStarts[j]);
    })
    .attr("height", transcriptHeight + 2);
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.TranscriptTrack.prototype.colorLabels = function() {
  return ["Transcript", "Exons"];
};
