/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 11/5/12
 * Time: 1:39 PM
 * To change this template use File | Settings | File Templates.
 */

LineTrack.prototype = new GenomeTrack();
LineTrack.prototype.constructor = LineTrack;

// Inherit SelectableChart (multiple inheritance)
Inheritance.add(LineTrack, SelectableChart);

function LineTrack() {
  // Call the constructors of all the superclasses but the first:
  SelectableChart.call(this);

  this._addPoints = false;
  this._addLines = true;
}

LineTrack.prototype.initialize = function(parentId, width, height, margin, workspaceData) {
  // Call super
  GenomeTrack.prototype.initialize.call(this, parentId, width, height, margin, workspaceData);

  SelectableChart.prototype.initialize.call(this);

  var measurementNames = this.getChartHandler().getDataTypeHandler().getMeasurementsStore().getMeasurements();
  if (measurementNames) {
    this._drawTitle(measurementNames);
  }

  this._measurements = workspaceData[1];

  this._addStyles();

  this._data = null;

  this._addPointsCheckBox();

  EventManager.instance.addEventListener(EventManager.eventTypes.BEGIN_UPDATE_CHART_DATA, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_DATA_UPDATED, this);
  EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, this);
};

LineTrack.prototype._addPointsCheckBox = function() {
  var self = this;

  var pointsButtonId = 'toggle-points-' + this._id;
  this._jParent.append('<div id="' + pointsButtonId + '-container" style="position: absolute; top: 7px; right: 100px" ><input type="checkbox" id="' + pointsButtonId + '" />' +
    '<label for="' + pointsButtonId + '" >Toggle Show Points</label></div>');
  var pointsButton = $('#' + pointsButtonId);
  var pointsButtonContainer = $('#' + pointsButtonId + '-container');

  pointsButton.button({
      text: false,
      icons: {
        primary: 'ui-icon-bullet'
      }
    })
    .click(function() {
      self._addPoints = pointsButton.is(':checked');
      self.draw();
    });

  // Toggle lines button

  var linesButtonId = 'toggle-lines-' + this._id;
  this._jParent.append(
    '<div id="' + linesButtonId + '-container" style="position: absolute; top: 7px; right: 130px" >' +
      '<input type="checkbox" id="' + linesButtonId + '" checked="checked" />' +
      '<label for="' + linesButtonId + '" >Toggle Show Lines</label>' +
    '</div>');
  var linesButton = $('#' + linesButtonId);
  var linesButtonContainer = $('#' + linesButtonId + '-container');

  linesButton.button({
    text: false,
    icons: {
      primary: 'ui-icon ui-icon-track'// 'ui-icon ui-icon-tag',
    }
  })
    .click(function() {
      self._addLines = linesButton.is(':checked');
      self.draw();
    });

  this._jParent
    .mousemove(function () {
      pointsButtonContainer.show();
      linesButtonContainer.show();
    })
    .mouseleave(function () {
      pointsButtonContainer.hide();
      linesButtonContainer.hide();
    });
};

LineTrack.prototype.draw = function(data, slide){

  BaseChart.prototype.draw.call(this, data);

  var d;
  if (data) {
    d = data;
    this._data = data;
  } else {
    if (!this._data) {
      return;
    }
    d = this._data;
  }

  this._svg
    .attr('width', this._width - this._parentMargins.x)
    .attr('height', this._height - this._parentMargins.y);

  var start = d.start;
  var end = d.end;

  var yMin = ComputedMeasurements.instance.min(d.min, this._measurements[0]);
  var yMax = ComputedMeasurements.instance.max(d.max, this._measurements[0]);

  var xScale = d3.scale.linear()
    .domain([start, end])
    .range([0, this._width-2*this._margin]);
  var yScale = d3.scale.linear()
    .domain([yMin, yMax])
    .range([this._height-2*this._margin, 0]);

  this._svg.selectAll('.xAxis').remove();
  this._svg.selectAll('.yAxis').remove();
  this._drawAxes(xScale, yScale, 10, 5);

  var delta = (!slide) ? 0 : slide * (this._width - 2*this._margin) / (end - start);
  var margin = this._margin;
  var self = this;
  var linesGroup = this._svg.selectAll('.lines');

  if (!linesGroup.empty()) {
    if (!delta) {
      linesGroup.remove();
      self._drawLines(d, xScale, yScale);
    } else {
      linesGroup
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + (-delta + margin) + ', ' + margin + ')')
        .remove()
        .each('end', function() {
          self._drawLines(d, xScale, yScale);
        });
    }
  } else {
    self._drawLines(d, xScale, yScale);
  }

  this.refreshSelection();
};

LineTrack.prototype._drawLines = function(d, xScale, yScale) {

  var svg = this._svg;
  var margin = this._margin;
  var i;

  var colors = this._colors;

  var graph = svg.append('g')
    .attr('class', 'lines')
    .attr('transform', 'translate(' + margin + ', ' + margin + ')');

  for (i = 0; i < this._measurements.length; ++i) {

    var m = this._measurements[i];
    var vars = ComputedMeasurements.instance.getNonComputedVariables(m);
    var indices = d3.range(0, d.data[vars[0]].value.length);

    var x = function(j) {
      if (!ComputedMeasurements.instance.contains(m)) {
        // This is not a computed column
        return xScale(d.data[m].bp[j]);
      }

      return xScale(d.data[vars[0]].bp[j]);
    };

    var y = function(j) {
      return yScale(ComputedMeasurements.instance.evaluate(d.data, m, j,
        function(s, index) { return s.value[index]; }));
    };

    if (this._addLines) {
      // create a line function that can convert data[] into x and y points
      var line = d3.svg.line()
        .x(x)
        .y(y);

      graph.append('g')
        .append('path')
        .attr('class', 'line-series-index-' + i)
        .attr('d', line(indices))
        .style('stroke', colors[i])
        .style('shape-rendering', 'auto')
        .style('stroke-width', '1');
    }

    if (this._addPoints) {
      graph.append('g')
        .selectAll('circle')
        .data(indices).enter()
        .append('circle')
        .attr('class', 'point-series-index-' + i)
        .style('opacity', 1)
        .attr('r', 2)
        .attr('cx', x)
        .attr('cy', y)
        .attr('fill', colors[i])
        .attr('stroke', 'none');
    }
  }

  var self = this;
  var inverseXScale = d3.scale.linear()
    .domain([0, self._width-2*self._margin])
    .range([self._data.start, self._data.end]);
  var hoverFunction = function() {
    EventManager.instance.blockUnhovered();
    var x = inverseXScale(d3.mouse(this)[0]) - self._binSize / 2;
    var start = Math.floor(x / self._binSize) * self._binSize;
    var end = start + self._binSize;
    var o = { start: start, end: end };
    EventManager.instance.blockHovered(o);
  };
  var hoverScreen = graph.append('rect').attr('class', 'hover-screen')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', this._width - 2 * this._margin)
    .attr('height', this._height - 2 * this._margin)
    .attr('opacity', 0)
    .on('mouseover', hoverFunction)
    .on('mousemove', hoverFunction)
    .on('mouseout', function (d) {
      EventManager.instance.blockUnhovered();
    });

};

LineTrack.prototype.onMeasurementsLoaded = function (event) {
  this._drawTitle(event.detail.bpMeasurements);
};

LineTrack.prototype.onBeginUpdateChartData = function(event) {
  if (event.detail.chartId == this._id) {
    this._addLoader();
  }
};

LineTrack.prototype.onChartDataUpdated = function(event) {
  if (event.detail.chartId != this._id) {
    return;
  }

  this._removeLoader();

  var data = event.detail.data.bpData;
  var lastLocation = event.detail.lastLocation;

  if (data.chr != lastLocation.chr
    || data.start != lastLocation.start
    || data.end != lastLocation.end) {
    return;
  }

  var slide = 0;
  if (this.lastLocation &&
    data.chr == this.lastLocation.chr &&
    data.end - data.start == this.lastLocation.end - this.lastLocation.start &&
    Math.abs(data.start - this.lastLocation.start) < data.end - data.start) {
    slide = data.start - this.lastLocation.start;
  }

  this.lastLocation = lastLocation;

  this.draw(data, slide);
};

LineTrack.prototype._addHoverRegion = function(selectionData, itemsGroup) {
  var xScale = d3.scale.linear()
    .domain([this._data.start, this._data.end])
    .range([0, this._width-2*this._margin]);

  var xStart = xScale(Math.floor(selectionData.start / this._binSize) * this._binSize);
  var xEnd = xScale((Math.floor(selectionData.end / this._binSize) + 1) * this._binSize);

  d3.select(itemsGroup[0])
    .insert('rect', ':first-child')
    .attr('class', 'hover-region')
    .attr('x', xStart)
    .attr('y', 0)
    .attr('width', xEnd - xStart)
    .attr('height', this._height - 2 * this._margin)
    .attr('fill', DataSeriesPalette.colors[0])
    .attr('stroke', 'none')
    .attr('opacity', 0.2);
};

LineTrack.prototype._findItems = function() {
  return this._jParent.find('> svg > .lines');
};

LineTrack.prototype.onBlockHovered = function(event) {
  if (!this._binSize) { return; }
  var o = event.detail.data;

  var itemsGroup = this._findItems();
  this._addHoverRegion(o, itemsGroup);
};

LineTrack.prototype.onBlockUnhovered = function(event) {
  var itemsGroup = this._findItems();
  this._removeHoverRegion(itemsGroup);
};

LineTrack.prototype.onBlockSelected = function(event) {
};

LineTrack.prototype.onBlockDeselected = function(event) {
};

LineTrack.prototype.setColors = function(colors) {
  BaseChart.prototype.setColors.call(this, colors);

  for (var i = 0; i < colors.length; ++i) {
    this._svg.selectAll('.line-series-index-' + i).style('stroke', colors[i]);
    this._svg.selectAll('.point-series-index-' + i).style('fill', colors[i]);
  }
};
