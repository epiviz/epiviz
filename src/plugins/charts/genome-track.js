/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 11/5/12
 * Time: 1:43 PM
 * To change this template use File | Settings | File Templates.
 */

GenomeTrack.prototype = new BaseChart();
GenomeTrack.prototype.constructor = GenomeTrack;

/*
 * Abstract class for time charts.
 *
 * See some of the subclasses for more details: LineTimeChart, BlocksTimeChart
 */
function GenomeTrack() {
}

GenomeTrack.prototype.initialize = function (parentId, width, height, margin, workspaceData) {
  // We only want to save height of tracks to workspace
  if (workspaceData.length >= 4) {
    workspaceData[3][0] = width;
  }

  // Call super
  BaseChart.prototype.initialize.call(this, parentId, width, height, margin, workspaceData);
};

GenomeTrack.prototype.draw = function (data, slide) {
  // Call super
  BaseChart.prototype.draw.call(this);
};

GenomeTrack.prototype._drawTitle = function(measurementsMap) {
  var textLength = 0;
  var title = '';

  var svg = this._svg;
  var measurements = this._measurements;

  var self = this;
  svg.selectAll('.chart-title').remove();
  svg
    .selectAll('.chart-title')
    .data(measurements)
    .enter()
    .append('text')
    .attr('class', 'chart-title')
    .attr('font-weight', 'bold')
    .attr('fill', function(m, i) {
      return self._colors[i];
    })
    .attr('x', function(m, i) {
      if (!measurementsMap[m]) { return textLength; }
      var result = 5 + textLength;
      textLength += measurementsMap[m].length * 6 + 7;
      return result;
    })
    .attr('y', 15)
    .text(function(m, i) {
      if (!measurementsMap[m]) { return ''; }
      title += measurementsMap[m] + ', ';
      return measurementsMap[m];
    });

  this._title = title.length >= 2 ? title.substr(0, title.length-2) : '';
};

GenomeTrack.prototype.getMeasurementColorMap = function() {
  var measurementNames = this.getChartHandler().getDataTypeHandler().getMeasurementsStore().getMeasurements();
  var map = {};

  for (var i = 0; i < this._measurements.length; ++i) {
    map[measurementNames[this._measurements[i]]] = this._colors[i];
  }

  return map;
};

GenomeTrack.prototype.onContainerResize = function(width, height) {
  if (width) { this._width = width; }
  if (height) { this._height = height; }

  if (height) {
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

