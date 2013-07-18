/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/25/13
 * Time: 8:39 PM
 * To change this template use File | Settings | File Templates.
 */

function BaseChart() {
  this._id = null;
  this._parentId = null;
  this._d3Parent = null;
  this._jParent = null;

  this._svg = null;
  this._svgId = null;

  this._width = null;
  this._height = null;
  this._parentMargins = null;
  this._margin = null;
  this._title = null;
  this._type = null;

  this._measurements = null;
  this._workspaceData = null;

  this._loaderTimeout = null;

  this._nBins = 100;
  this._binSize = 0;
}

BaseChart.prototype.initialize = function(parentId, width, height, margin, workspaceData) {
  this._id = parentId.substr(1);
  this._svgId = sprintf('%s-svg', this._id);
  this._parentId = parentId;
  this._d3Parent = d3.select(this._parentId);
  this._jParent = $(this._parentId);

  if (workspaceData.length >= 4) {
    width = workspaceData[3][0];
    height = workspaceData[3][1];
  }

  if (height == '100%') { height = this._jParent.height(); }
  if (width == '100%') { width = this._jParent.width(); }

  this._svg = this._d3Parent
    .append('svg:svg')
    .attr('id', this._svgId)
    .attr('class', 'base-chart')
    .attr('width', width)
    .attr('height', height);

  this._width = this._jParent.width();
  this._height = this._jParent.height();
  this._parentMargins = { x: 2, y: 5 };
  this._margin = margin;
  this._title = '';

  var defs = this._svg.append('defs');
  this._addFilters(defs);

  this._workspaceData = workspaceData;
  this._type = workspaceData[0];
  this._measurements = workspaceData[1];

  if (workspaceData.length >= 3 && workspaceData[2]) {
    this._colors = workspaceData[2];
  } else {
    this._colors = this.getChartHandler().getDefaultColors();

    if (this._workspaceData.length <= 2) {
      this._workspaceData.push(this._colors);
    } else {
      this._workspaceData[2] = this._colors;
    }
  }

  EventManager.instance.addEventListener(EventManager.eventTypes.CHART_CONTAINER_RESIZE, this);
};

BaseChart.prototype._addStyles = function() {};

BaseChart.prototype._addFilters = function(defs) {
  var glow = defs.append('filter')
    .attr('id', this._id + '-glow');
  glow.append('feGaussianBlur')
    .attr('id', 'gaussianBlur')
    .attr('stdDeviation', '2')
    .attr('result', 'blurResult');
  glow.append('feComposite')
    .attr('id', 'composite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'blurResult')
    .attr('operator', 'over');

  var contour = defs.append('filter')
    .attr('id', this._id + '-contour');
  contour.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', '1')
    .attr('result', 'blur');
  contour.append('feColorMatrix')
    .attr('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 10 -1 ')
    .attr('result', 'colorMatrix');
  contour.append('feFlood')
    .attr('result', 'fillColor')
    .attr('flood-color', '#800000')
    .attr('in', 'blur');
  contour.append('feComposite')
    .attr('result', 'composite')
    .attr('in', 'fillColor')
    .attr('in2', 'colorMatrix')
    .attr('operator', 'atop');
  contour.append('feComposite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'composite')
    .attr('operator', 'atop');

  var dropShadow = defs.append('filter')
    .attr('id', this._id + '-dropshadow')
    .attr('filterUnits', 'userSpaceOnUse')
    .attr('color-interpolation-filters', 'sRGB');
  var temp = dropShadow.append('feComponentTransfer')
    .attr('in', 'SourceAlpha');
  temp.append('feFuncR')
    .attr('type', 'discrete')
    .attr('tableValues', '1');
  temp.append('feFuncG')
    .attr('type', 'discrete')
    .attr('tableValues', 198/255);
  temp.append('feFuncB')
    .attr('type', 'discrete')
    .attr('tableValues', '0');
  dropShadow.append('feGaussianBlur')
    .attr('stdDeviation', '2');
  dropShadow.append('feOffset')
    .attr('dx', '0')
    .attr('dy', '0')
    .attr('result', 'shadow');
  dropShadow.append('feComposite')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'shadow')
    .attr('operator', 'over');
};

BaseChart.prototype._drawAxes = function(xScale, yScale, xTicks, yTicks, svg, width, height, margin) {
  if (!svg) { svg = this._svg; }
  if (!margin) { margin = { top: this._margin, left: this._margin, bottom: this._margin, right: this._margin }; }
  if (!height) { height = this._height; }
  if (!width) { width = this._width; }

  var axesGroup = svg.select('.axes');
  var xAxisGrid, yAxisGrid, xAxisLine, yAxisLine;
  xAxisGrid = axesGroup.select('.xAxis-grid');
  yAxisGrid = axesGroup.select('.yAxis-grid');
  xAxisLine = axesGroup.select('.xAxis-line');
  yAxisLine = axesGroup.select('.yAxis-line');
  if (axesGroup.empty()) {
    axesGroup = svg.append('g').attr('class', 'axes');
  }

  if (xAxisGrid.empty()) {
    xAxisGrid = axesGroup.append('g').attr('class', 'xAxis xAxis-grid');
  }

  if (yAxisGrid.empty()) {
    yAxisGrid = axesGroup.append('g').attr('class', 'yAxis yAxis-grid');
  }

  if (xAxisLine.empty()) {
    xAxisLine = axesGroup.append('g').attr('class', 'xAxis xAxis-line');
  }

  if (yAxisLine.empty()) {
    yAxisLine = axesGroup.append('g').attr('class', 'yAxis yAxis-line');
  }

  if (xScale) {
    // Draw X-axis grid lines
    xAxisGrid
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
      .selectAll('line.x')
      .data(xScale.ticks(xTicks))
      .enter().append('line')
      .attr('x1', xScale)
      .attr('x2', xScale)
      .attr('y1', 0)
      .attr('y2', height - margin.top - margin.bottom)
      .style('stroke', '#eeeeee')
      .style('shape-rendering', 'crispEdges');

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient('bottom')
      .tickFormat(d3.format('s'));
    xAxisLine
      .attr('transform', 'translate(' + margin.left + ', ' + (height - margin.bottom) + ')')
      .call(xAxis);
  }

  if (yScale) {
    // Draw Y-axis grid lines
    yAxisGrid
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
      .selectAll('line.y')
      .data(yScale.ticks(yTicks))
      .enter().append('line')
      .attr('x1', 0)
      .attr('x2', width - margin.left - margin.right)
      .attr('y1', yScale)
      .attr('y2', yScale)
      .style('stroke', '#eeeeee')
      .style('shape-rendering', 'crispEdges');

    var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient('left');
    yAxisLine
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
      .call(yAxis);
  }
};

BaseChart.prototype._addLoader = function() {
  if (this._loaderTimeout) { clearTimeout(this._loaderTimeout); }

  var self = this;
  this._loaderTimeout = setTimeout(function(){
    var loaderId = self._parentId + '-loader';
    var loaderBg = loaderId + '-background';
    $(loaderId).remove();
    $(loaderBg).remove();

    self._jParent.append('<div class="loader-icon" id="' + loaderId.substr(1) +
      '" style="top: ' + Math.floor(self._height * 0.5) + 'px; left: ' + Math.floor(self._width * 0.5) + 'px"></div>');
    $(loaderId).activity({
      segments: 8,
      steps: 5,
      opacity: 0.3,
      width: 4,
      space: 0,
      length: 10,
      color: '#0b0b0b',
      speed: 1.0
    });

    self._svg
      .append('rect')
      .attr('id', loaderBg.substr(1))
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#ffffff')
      .attr('opacity', 0.7);
  }, 500);
};

BaseChart.prototype._removeLoader = function() {
  if (this._loaderTimeout) { clearTimeout(this._loaderTimeout); }
  var loaderId = this._parentId + '-loader';
  var loaderBg = loaderId + '-background';
  $(loaderId).remove();
  $(loaderBg).remove();
};

BaseChart.prototype.onChartContainerResize = function(event) {
  // TODO: Test to see if we don't have to select the element again
  this.onContainerResize(this._jParent.width(), this._jParent.height());
};


BaseChart.prototype.onContainerResize = function(width, height) {
  if (width) { this._width = width; }
  if (height) { this._height = height; }

  if (width || height) {
    if (this._workspaceData.length <= 4) {
      while (this._workspaceData.length <= 4) {
        this._workspaceData.push(null);
      }
    }
    this._workspaceData[3] = [this._width, this._height];
    Workspace.instance.changed();
  }

  this.draw();
};

/*
 * Virtual. Draw the title of the chart.
 */
BaseChart.prototype._drawTitle = function(measurementsMap) {};

BaseChart.prototype._addStyles = function() {
  var jSvg = this._jParent.find('svg');
  jSvg.append('<style type="text/css"></style>');
};

/*
 * Virtual. Main drawing method.
 */
BaseChart.prototype.draw = function(data) {
  if (data) {
    this._binSize = Math.max(5000, Math.ceil((data.end - data.start) / this._nBins));
  }
};

BaseChart.prototype.createTitle = function(measurementNames) {
  var measurements = this._workspaceData[1];
  var title = '';
  for (var j = 0; j < measurements.length; ++j) {
    title += measurementNames[measurements[j]] + ', ';
  }

  title = title.length >= 2 ? title.substr(0, title.length-2) : '';

  return title;
};

BaseChart.prototype.getChartHandler = function() {
  return ChartFactory.instance.getChartHandlerByChartType(this._type);
};

BaseChart.prototype.getWorkspaceData = function() {
  return this._workspaceData;
};

BaseChart.prototype.getMeasurementColorMap = function() {};

BaseChart.prototype.setColors = function(colors) {
  this._colors = colors;
  this._workspaceData[2] = colors;

  var measurementNames = this.getChartHandler().getDataTypeHandler().getMeasurementsStore().getMeasurements();
  if (measurementNames) {
    this._drawTitle(measurementNames);
  }
};
