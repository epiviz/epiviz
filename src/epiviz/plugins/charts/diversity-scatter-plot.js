/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 11:55 PM
 */

goog.provide('epiviz.plugins.charts.DiversityScatterPlot');

goog.require('epiviz.ui.charts.Plot');
goog.require('epiviz.ui.charts.Axis');
goog.require('epiviz.ui.charts.VisEventArgs');
goog.require('epiviz.ui.charts.Visualization');
goog.require('epiviz.utils');
goog.require('epiviz.measurements.Measurement');
goog.require('epiviz.ui.charts.CustomSetting');
goog.require('epiviz.ui.charts.ChartIndexObject');
goog.require('epiviz.deferred.Deferred');


/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.DiversityScatterPlot = function(id, container, properties) {
    // Call superclass constructor
    epiviz.ui.charts.Plot.call(this, id, container, properties);

    this._dispatch = d3.dispatch("hover", "click");

    /**
     * D3 chart container
     * @type {*}
     * @private
     */
    this._chartContent = null;

    /**
     * D3 legend container
     * @type {*}
     * @private
     */
    this._legend = null;

    /**
     * @type {Array.<epiviz.measurements.Measurement>}
     * @private
     */
    this._measurementsX = [];

    /**
     * @type {Array.<epiviz.measurements.Measurement>}
     * @private
     */
    this._measurementsY = [];

    var self = this;
    this.measurements().foreach(function(m, i) {
        if (i % 2 == 0) { self._measurementsX.push(m); } else { self._measurementsY.push(m); }
    });

    /**
     * @type {string}
     * @private
     */
    this._xLabel = '';

    /**
     * @type {string}
     * @private
     */
    this._yLabel = '';

    for (var i = 0; i < Math.min(this._measurementsX.length, this._measurementsY.length); ++i) {
        if (i > 0) {
            this._xLabel += ', ';
            this._yLabel += ', ';
        }
        this._xLabel += this._measurementsX[i].name();
        this._yLabel += this._measurementsY[i].name();
    }

    /**
     * @type {Array.<string>}
     * @private
     */
    this._colorLabels = [];

    this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.DiversityScatterPlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.DiversityScatterPlot.constructor = epiviz.plugins.charts.DiversityScatterPlot;

/**
 * @protected
 */
epiviz.plugins.charts.DiversityScatterPlot.prototype._initialize = function() {
    // Call super
    epiviz.ui.charts.Plot.prototype._initialize.call(this);

    this._svg.classed('scatter-plot', true);

    this._chartContent = this._svg.append('g').attr('class', 'chart-content');
    this._legend = this._svg.append('g').attr('class', 'chart-legend');
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */

epiviz.plugins.charts.DiversityScatterPlot.prototype.draw = function() {
    epiviz.ui.charts.Plot.prototype.draw.call(this, undefined, undefined);
    var self = this;

    self.drawScatter(self._lastRange, self._lastData.data, "sample_id", self._xLabel, "alphaDiversity");
};

epiviz.plugins.charts.DiversityScatterPlot.prototype.drawScatter = function(range, data, key, dimx, dimy) {

    // epiviz.ui.charts.Plot.prototype.draw.call(this, range, data);

    // If data is defined, then the base class sets this._lastData to data.
    // If it isn't, then we'll use the data from the last draw call
    // data = this._lastData;
    //range = this._lastRange;

    // If data is not defined, there is nothing to draw
    // if (!data || !range) {
    //     return [];
    // }

    // group data by keys

    // var keysList = Objects.keys(tempData);

    // var groupData = d3.nest().key(function(d) { return d[key]; }).entries(data);

    // collapse data points -> dataX, dataY (assume same length dataX, and dataY)

    // joint dataX, dataY on common keys -> data (array of objects)

    this.xTag = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL];
    // if (this.xTag == "name"){
    //     var keys = Object.keys(data[0]);
    //     for(k = 0; k < keys.length; k++){
    //         var key = keys[k];
    //         var values = data.map(function(i) {return i[key];});
    //         if (values.length > 2){
    //             this.xTag = key;
    //             break;
    //         }
    //     }
    // }
    var old_x_axis = this._measurementsX[0];
    var tempAnnotation = old_x_axis.annotation();
    this._measurementsX = [];
    var new_x_axis = new epiviz.measurements.Measurement(this.xTag, this.xTag, 'feature', 'ihmp', 'ihmp',
                                           'ihmp', null, null, tempAnnotation,
                                           -1, 1,[]);
    this._measurementsX.push(new_x_axis);
    return this._drawCircles(data, this.xTag, dimy, key);
};

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.DiversityScatterPlot.prototype._drawCircles = function(data, dimx, dimy, key) {
    var self = this;
    var Axis = epiviz.ui.charts.Axis;
    var circleRadius = Math.max(1, this.customSettingsValues()[epiviz.plugins.charts.DiversityScatterPlotType.CustomSettings.CIRCLE_RADIUS_RATIO] * Math.min(this.width(), this.height()));
    var gridSquareSize = Math.max(Math.floor(circleRadius), 1);
    // var nSeries = Math.min(this._measurementsX.length, this._measurementsY.length);

    // var firstGlobalIndex = data.firstSeries().globalStartIndex();
    // var lastGlobalIndex = data.firstSeries().globalEndIndex();
    // data.foreach(function(measurement, series) {

    //     var firstIndex = series.globalStartIndex();
    //     var lastIndex = series.globalEndIndex();

    //     if (firstIndex > firstGlobalIndex) { firstGlobalIndex = firstIndex; }
    //     if (lastIndex < lastGlobalIndex) { lastGlobalIndex = lastIndex; }
    // });

    // var nItems = lastGlobalIndex - firstGlobalIndex;

    var margins = this.margins();
    var width = this.width();
    var height = this.height();

    var CustomSetting = epiviz.ui.charts.CustomSetting;
    var minY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MIN];
    var maxY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MAX];
    var minX = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.X_MIN];
    var maxX = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.X_MAX];

    // if (minX == CustomSetting.DEFAULT) { minX = this._measurementsX[0].minValue(); }
    if (minY == CustomSetting.DEFAULT) { minY = this._measurementsY[0].minValue(); }
    // if (maxX == CustomSetting.DEFAULT) { maxX = this._measurementsX[0].maxValue(); }
    if (maxY == CustomSetting.DEFAULT) { maxY = this._measurementsY[0].maxValue(); }



    var allValues = []
    data.forEach(function(m) { allValues.push(m[dimx]);});

    var uniqueValues = [];

    allValues.forEach(function(m) {
        if(uniqueValues.indexOf(m) == -1) {
            uniqueValues.push(m);
        }
    });

    console.log(uniqueValues);
    this.xTickValues = uniqueValues;
    data.forEach(function(n) {
        var index = uniqueValues.indexOf(n[dimx]);
        n._xVal = index+1;
    } );

    var count= 0;
    var plotData = [];
    uniqueValues.forEach(function(m) {
        plotData[count] = [];
        plotData[count][0] = count;
        plotData[count][1] = [];
        count++;
    });

    data.forEach(function(d) {
        var ind = uniqueValues.indexOf(d[dimx]);

        plotData[ind][1].push(d[dimy]);
    });

    if (minX == CustomSetting.DEFAULT) {
        minX = 0;
    }
    if (maxX == CustomSetting.DEFAULT) {
        maxX = uniqueValues.length+1;
    }
    
    // if (minY == CustomSetting.DEFAULT) {
    //     minY = d3.min(data, function(d) {
    //         return d[dimy];
    //     });
    // }
    // if (maxY == CustomSetting.DEFAULT) {
    //     maxY = d3.max(data, function(d) {
    //         return d[dimy];
    //     });
    // }

    // var dataHasGenomicLocation = epiviz.measurements.Measurement.Type.isOrdered(this._measurementsX[0].type());

    var xScale = d3.scale.linear()
        .domain([minX, maxX])
        .range([0, width - margins.sumAxis(Axis.X)]);
    var yScale = d3.scale.linear()
        .domain([minY, maxY])
        .range([height - margins.sumAxis(Axis.Y), 0]);

    this._clearAxes(this._chartContent);
    //this._drawAxes(xScale, yScale, 15, 15, this._chartContent);
    //this._drawAxes(xScale, yScale, uniqueValues.length, 15, this._chartContent);
    //this._drawAxes(xScale, yScale, xTicks, yTicks, svg, width, height, margins, undefined, undefined,this.xTickValues, undefined, undefined)
    xLabelsPadded = [""];
    uniqueValues.forEach(function(n) {xLabelsPadded.push(n);});
    console.log(xLabelsPadded);
    this._drawAxes(xScale, yScale, xLabelsPadded.length, 15, this._chartContent, width, height, margins, undefined, undefined,xLabelsPadded, undefined, undefined)

    // var i, index;
    // var indices = []; //epiviz.utils.range(nSeries * nItems);
    // for (i = 0; i < nItems; ++i) {
    //     index = i + firstGlobalIndex;
    //     var item = data.getSeries(this._measurementsX[0]).getRowByGlobalIndex(index);
    //     if (!item) {
    //         continue;
    //     }
    //     if (!dataHasGenomicLocation ||
    //         (range.start() == undefined || range.end() == undefined) ||
    //         (item.start() < range.end() && item.end() > range.start())) {

    //         for (var j = 0; j < nSeries; ++j) {
    //             indices.push(j * nItems + i);
    //         }
    //     }
    // }

    // var grid = {};
    // var items = [];
    // var maxGroupItems = 1;
    // for (i = 0; i < indices.length; ++i) {
    //     index = indices[i] % nItems;
    //     var globalIndex = index + firstGlobalIndex;
    //     var seriesIndex = Math.floor(indices[i] / nItems);
    //     var mX = self._measurementsX[seriesIndex];
    //     var mY = self._measurementsY[seriesIndex];
    //     var cellX = data.getSeries(mX).getByGlobalIndex(globalIndex);
    //     var cellY = data.getSeries(mY).getByGlobalIndex(globalIndex);

    //     if (!cellX || !cellY) {
    //         continue;
    //     }

    //     var classes = sprintf('item data-series-%s', seriesIndex);

    //     var x = xScale(cellX.value);
    //     var y = yScale(cellY.value);
    //     var gridX = Math.floor(x / gridSquareSize) * gridSquareSize;
    //     var gridY = Math.floor(y / gridSquareSize) * gridSquareSize;

    //     var uiObj = null;
    //     if (grid[gridY] && grid[gridY][gridX]) {
    //         uiObj = grid[gridY][gridX];
    //         uiObj.id += '_' + cellX.globalIndex;
    //         uiObj.start = Math.min(uiObj.start, cellX.rowItem.start());
    //         uiObj.end = Math.max(uiObj.end, cellX.rowItem.end());
    //         uiObj.values[0] = (uiObj.values[0] * uiObj.valueItems[0].length + cellX.value) / (uiObj.valueItems[0].length + 1);
    //         uiObj.values[1] = (uiObj.values[1] * uiObj.valueItems[1].length + cellY.value) / (uiObj.valueItems[1].length + 1);
    //         uiObj.valueItems[0].push(cellX);
    //         uiObj.valueItems[1].push(cellY);

    //         if (uiObj.valueItems[0].length > maxGroupItems) {
    //             maxGroupItems = uiObj.valueItems[0].length;
    //         }

    //         continue;
    //     }


    //     uiObj = new epiviz.ui.charts.ChartObject(
    //         sprintf('scatter_%s_%s', seriesIndex, cellX.globalIndex),
    //         cellX.rowItem.start(),
    //         cellX.rowItem.end(), [cellX.value, cellY.value],
    //         seriesIndex, [
    //             [cellX],
    //             [cellY]
    //         ], // valueItems one for each measurement
    //         [mX, mY], // measurements
    //         classes);

    //     if (!grid[gridY]) { grid[gridY] = {}; }
    //     grid[gridY][gridX] = uiObj;

    //     items.push(uiObj);
    // }





    var grid = {};
    var items = [];
    var maxGroupItems = 1;
    var seriesIndex = 0; // Assume only 1 pair of datax and datay
    for (var i = 0; i < data.length; ++i) {

        console.log(data[i]);
        //index = indices[i] % nItems;
        //var globalIndex = index + firstGlobalIndex;
        //var seriesIndex = Math.floor(indices[i] / nItems);
        //var mX = self._measurementsX[seriesIndex];
        //var mY = self._measurementsY[seriesIndex];
        //var cellX = data.getSeries(mX).getByGlobalIndex(globalIndex);
        //var cellY = data.getSeries(mY).getByGlobalIndex(globalIndex);
        var cellX = data[i]["_xVal"];
        var cellY = data[i][dimy];
        if (!cellX || !cellY) {
            continue;
        }

        var classes = sprintf('item data-series-%s', seriesIndex);

        var x = xScale(cellX);
        var y = yScale(cellY);

        var gridX = Math.floor(x / gridSquareSize) * gridSquareSize;
        var gridY = Math.floor(y / gridSquareSize) * gridSquareSize;

        var uiObj = null;
        if (grid[gridY] && grid[gridY][gridX]) {
            uiObj = grid[gridY][gridX];
            uiObj.id += '_' + data[i][key];
            uiObj.values[0] = (uiObj.values[0] * uiObj.valueItems[0].length + cellX) / (uiObj.valueItems[0].length + 1);
            uiObj.values[1] = (uiObj.values[1] * uiObj.valueItems[1].length + cellY) / (uiObj.valueItems[1].length + 1);
            uiObj.valueItems[0].push(data[i]);
            uiObj.valueItems[1].push(data[i]);
            if (uiObj.valueItems[0].length > maxGroupItems) {
                maxGroupItems = uiObj.valueItems[0].length;
            }
            continue;
        }

        uiObj = new epiviz.ui.charts.ChartIndexObject(
            sprintf('scatter_%s_%s_%s_%s', cellX, cellY, seriesIndex, data[i][key]), [key],
            data[i][key], [cellX, cellY], [
                [data[i]],
                [data[i]]
            ], // valueItems one for each measurement
            ["_xVal", dimy], // measurements
            seriesIndex,
            classes);

        if (!grid[gridY]) { grid[gridY] = {}; }
        grid[gridY][gridX] = uiObj;

        items.push(uiObj);
    }

    console.log("after loop");


    var itemsGroup = this._chartContent.select('.items');

    if (itemsGroup.empty()) {
        itemsGroup = this._chartContent.append('g').attr('class', 'items');
        var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
        itemsGroup.append('g').attr('class', 'hovered');
        selectedGroup.append('g').attr('class', 'hovered');
    }



    var selection = itemsGroup.selectAll('circle').data(items, function(d) {
        return d.id;
    });

    // selection
    //     .enter()
    //     .insert('circle', ':first-child')
    //     .attr('id', function(d) {
    //         return sprintf('%s-item-%s-%s', self.id(), d.seriesIndex, d.valueItems[0][0].globalIndex);
    //     })
    //     .style('opacity', 0)
    //     .style('fill-opacity', 0)
    //     .attr('r', 0);
    // selection
    //     .each(
    //         /**
    //          * @param {epiviz.ui.charts.ChartObject} d
    //          */
    //         function(d) {
    //             var circle = d3.select(this);

    //             var fill;
    //             if (!self._globalIndexColorLabels) { fill = self.colors().get(d.seriesIndex); } else {
    //                 fill = self.colors().getByKey(self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]);
    //             }
    //             circle
    //                 .attr('cx', margins.left() + (d.values[0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    //                 .attr('cy', height - margins.bottom() - ((d.values[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    //                 .attr('class', d.cssClasses)
    //                 .style('fill', fill);
    //         });

    selection
        .enter()
        .insert('circle', ':first-child')
        .attr('id', function(d) {
            return sprintf('%s-item-%s', self.id(), d.seriesIndex);
        })
        .style('opacity', 0)
        .style('fill-opacity', 0)
        .attr('r', 0);
    selection
        .each(
            /**
             * @param {epiviz.ui.charts.ChartObject} d
             */
            function(d) {
                var circle = d3.select(this);

                var fill = self.colors().get(d.seriesIndex);
                // if (!self._globalIndexColorLabels) { fill = self.colors().get(d.seriesIndex); } else {
                //     fill = self.colors().getByKey(self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]);
                // }
                circle
                    .attr('cx', margins.left() + (d.values[0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
                    .attr('cy', height - margins.bottom() - ((d.values[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
                    .attr('class', d.cssClasses)
                    .style('fill', fill);
            });


    selection
        .transition()
        .duration(1000)
        .style('fill-opacity', function(d) {
            //return Math.max(0.3, d.valueItems[0].length / maxGroupItems);
            return Math.max(0.6, d.valueItems[0].length / maxGroupItems);
        })
        .style('opacity', null)
        .attr('r', circleRadius);

    selection
        .exit()
        .transition()
        .duration(1000)
        .style('opacity', 0)
        .attr('r', 0)
        .remove();

    selection
        //.on('mouseover', function(d) {
        //    console.log("mouseover");
        //    console.log(d);
        //    self._hover.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
        //    self._dispatch.hover(self.id(), d);
        //})
        //.on('mouseout', function() {
        //    self._unhover.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
        //    self._dispatch.hover(self.id(), null);
        //
        //})
        .on('click', function(d) {
            console.log("click");
            console.log(d);
            self._deselect.notify(new epiviz.ui.charts.VisEventArgs(self.id()));
            self._select.notify(new epiviz.ui.charts.VisEventArgs(self.id(), d));
            self._dispatch.click(self.id(), null);

            d3.event.stopPropagation();
        });

    // Draw legend if necessary
    if (this._globalIndexColorLabels) {
        var colorLabelsMap = {};
        for (j = firstGlobalIndex; j < lastGlobalIndex; ++j) {
            colorLabelsMap[this._globalIndexColorLabels[j]] = this._globalIndexColorLabels[j];
        }
        this._colorLabels = Object.keys(colorLabelsMap);

        this._svg.selectAll('.chart-title').remove();
        this._svg.selectAll('.chart-title-color ').remove();
        var titleEntries = this._svg
            .selectAll('.chart-title')
            .data(this._colorLabels);
        titleEntries
            .enter()
            .append('text')
            .attr('class', 'chart-title')
            .attr('font-weight', 'bold')
            .attr('y', self.margins().top() - 5);
        titleEntries
            .attr('fill', function(label, i) {
                return self.colors().getByKey(label);
            })
            .text(function(label) {
                return label;
            });
        var textLength = 0;
        var titleEntriesStartPosition = [];

        $('#' + this.id() + ' .chart-title')
            .each(function(i) {
                titleEntriesStartPosition.push(textLength);
                textLength += this.getBBox().width + 15;
            });

        titleEntries.attr('x', function(column, i) {
            return self.margins().left() + 10 + titleEntriesStartPosition[i];
        });

        var colorEntries = this._svg
            .selectAll('.chart-title-color')
            .data(this._colorLabels)
            .enter()
            .append('circle')
            .attr('class', 'chart-title-color')
            .attr('cx', function(column, i) {
                return self.margins().left() + 4 + titleEntriesStartPosition[i];
            })
            .attr('cy', self.margins().top() - 9)
            .attr('r', 4)
            .style('shape-rendering', 'auto')
            .style('stroke-width', '0')
            .attr('fill', function(label, i) {
                return self.colors().getByKey(label);
            })
            .style('stroke-width', 0)
    } else {
        var n = Math.min(this._measurementsX.length, this._measurementsY.length);
        var colors = new Array(n);

        for (j = 0; j < n; ++j) {
            colors[j] = sprintf('%s vs %s', this._measurementsX[j].name(), this._measurementsY[j].name());
        }

        this._colorLabels = colors;
    }

    var rectBox = itemsGroup;
    
    console.log(uniqueValues);

    rectBox.selectAll('.iqr-range').remove();
    rectBox.selectAll('.whisker').remove();
    for(i = 0; i < plotData.length; i++){
        var findIQR = plotData[i][1];
        console.log(findIQR);
        var lower_upper = [];
        lower_upper = quartiles(findIQR);
        console.log(lower_upper);  
        
        var iqr_result = lower_upper[1] - lower_upper[0];
        var iqr_15 = iqr_result * 1.5;

        var whisker_lower_index = 0;
        var whisker_upper_index = findIQR.length-1;
        for(j = 0; j < findIQR.length; j++){
            if(findIQR[j] < lower_upper[0] - iqr_15) {
                whisker_lower_index = j;
            }
            else {
                break;
            }
        }
        for(k = findIQR.length-1; k > 0; k--){
            if(findIQR[k] > (lower_upper[1] + iqr_15)) {
                whisker_upper_index = k;
            }
            else {
                break;
            }
        }
    rectBox.append("rect")
    //.attr('id', function(d) {console.log(d[0]); return d[0];})
    .attr('id', "0")
    .attr('class', 'iqr-range')
    .style('opacity', 1)
    .style('fill-opacity', 0.2)
    //.attr('x', xScale(.6))
    //.attr('y', yScale(1-.2))
    .attr('x', margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y', height - margins.bottom() - ((lower_upper[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    //.attr('y', function(d) { d = plotData[i]; console.log(d[1][0]); return height + 2*(margins._bottom) - margins._top - yScale(.25); })
    .attr('width', xScale(.8))
    .attr('height', Math.abs((yScale(lower_upper[1])-yScale(lower_upper[0]))))
    //.attr('height', Math.abs(((yScale(.3)-yScale(.25)))))
    //.attr('height', lower_upper[1]-lower_upper[0])
    //.attr('height', Math.abs(yScale(.5)))
    .attr('fill', '#1E90FF');


     rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((lower_upper[1] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_upper_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((lower_upper[0] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_lower_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

     rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((findIQR[whisker_upper_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_upper_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    rectBox.append("line")
    .style("stroke", "gray")
    .attr('class', 'whisker')
    .attr("x1", margins.left() + (0.6 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y1', height - margins.bottom() - ((findIQR[whisker_lower_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY)))
    .attr("x2", margins.left() + (1.4 + plotData[i][0] - minX) * (width - margins.sumAxis(Axis.X)) / (maxX - minX))
    .attr('y2', (height - margins.bottom() - ((findIQR[whisker_lower_index] - minY) * (height - margins.sumAxis(Axis.Y)) / (maxY - minY))));

    }
    // .style('fill', function(d, i) {
    //   if (!self._globalIndexColorLabels) { return self._colorScale(d.values[0]); }
    //   return colorScales[self._globalIndexColorLabels[d.valueItems[0][0].globalIndex]](d.values[0]);
    // });

    function quartiles(d) {
        d.sort(d3.ascending);
        var q1 = d3.quantile(d, .25);
        var q3 = d3.quantile(d, .75);
        return [q1, q3];
    };



    return items;
};



/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.DiversityScatterPlot.prototype.colorLabels = function() {
    return this._colorLabels;
};

/**
 * @param xScale D3 linear scale for the x axis
 * @param yScale D3 linear scale for the y axis
 * @param {number} [xTicks]
 * @param {number} [yTicks]
 * @param [svg] D3 svg container for the axes
 * @param {number} [width]
 * @param {number} [height]
 * @param {epiviz.ui.charts.Margins} [margins]
 * @protected
 */
epiviz.plugins.charts.DiversityScatterPlot.prototype._drawAxesOld = function(xScale, yScale, xTicks, yTicks, svg, width, height, margins) {
    epiviz.ui.charts.Plot.prototype._drawAxes(xScale, yScale, xTicks, yTicks,
    svg, width, height, margins, undefined, undefined,
    this.xTickValues, undefined, undefined);
    //epiviz.ui.charts.Plot.prototype._drawAxes.call(this, xScale, yScale, xTicks, yTicks, svg, width, height, margins);

    this._legend.selectAll('text').remove();

    var xMeasurements = this._measurementsX;
    var self = this;
    this._legend.selectAll('.x-measurement').remove();
    this._legend.selectAll('.x-measurement-color').remove();

    var xEntries = this._legend
        .selectAll('.x-measurement')
        .data(xMeasurements)
        .enter()
        .append('text')
        .attr('class', 'x-measurement')
        .attr('font-weight', 'bold')
        .attr('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#000000" : self.colors().get(i);
        })
        .attr('y', (this.height() - this.margins().bottom() + 35))
        .text(function(m, i) {
            return m.name();
        });

    var xTextLength = 0;
    var xTitleEntriesStartPosition = [];

    $('#' + this.id() + ' .x-measurement')
        .each(function(i) {
            xTitleEntriesStartPosition.push(xTextLength);
            xTextLength += this.getBBox().width + 15;
        });

    xEntries.attr('x', function(column, i) {
        return (self.width() - xTextLength) * 0.5 + 7 + xTitleEntriesStartPosition[i];
    });

    var xColorEntries = this._legend
        .selectAll('.x-measurement-color')
        .data(xMeasurements)
        .enter()
        .append('circle')
        .attr('class', 'x-measurement-color')
        .attr('cx', function(column, i) {
            return (self.width() - xTextLength) * 0.5 + 1 + xTitleEntriesStartPosition[i];
        })
        .attr('cy', (this.height() - this.margins().bottom() + 31))
        .attr('r', 4)
        .style('shape-rendering', 'auto')
        .style('stroke-width', '0')
        .style('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#ffffff" : self.colors().get(i);
        });


    var yMeasurements = ['alphaDiversity'];
    this._legend.selectAll('.y-measurement').remove();
    this._legend.selectAll('.y-measurement-color').remove();

    var yEntries = this._legend
        .selectAll('.y-measurement')
        .data(yMeasurements)
        .enter()
        .append('text')
        .attr('class', 'y-measurement')
        .attr('font-weight', 'bold')
        .attr('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#000000" : self.colors().get(i);
        })
        .attr('y', (this.margins().left() - 35))
        .attr('transform', 'rotate(-90)')
        .text(function(m, i) {
            return m;
        });

    var yTextLength = 0;
    var yTitleEntriesStartPosition = [];

    $('#' + this.id() + ' .y-measurement')
        .each(function(i) {
            yTitleEntriesStartPosition.push(yTextLength);
            yTextLength += this.getBBox().width + 15;
        });

    yEntries.attr('x', function(column, i) {
        return -self.height() + (self.height() - yTextLength) * 0.5 + 12 + self.margins().top() + yTitleEntriesStartPosition[i];
    });

    var yColorEntries = this._legend
        .selectAll('.y-measurement-color')
        .data(yMeasurements)
        .enter()
        .append('circle')
        .attr('class', 'y-measurement-color')
        .attr('cx', function(column, i) {
            return -self.height() + (self.height() - yTextLength) * 0.5 + 6 + self.margins().top() + yTitleEntriesStartPosition[i];
        })
        .attr('cy', (this.margins().left() - 39))
        .attr('transform', 'rotate(-90)')
        .attr('r', 4)
        .style('shape-rendering', 'auto')
        .style('stroke-width', '0')
        .style('fill', function(m, i) {
            return self._globalIndexColorLabels ?
                "#ffffff" : self.colors().get(i);
        });
};

epiviz.plugins.charts.DiversityScatterPlot.prototype.transformData = function(range, data) {
  var lastRange = this._lastRange;

  if (range != undefined) {
    this._lastRange = range;
  }
  if (data != undefined) {
    this._lastData = data;
    this._unalteredData = data;
  }

  var deferred = new epiviz.deferred.Deferred();
  deferred.resolve();
  return deferred;
};


// goog.inherits(epiviz.plugins.charts.DiversityScatterPlot, epiviz.ui.charts.Plot);
