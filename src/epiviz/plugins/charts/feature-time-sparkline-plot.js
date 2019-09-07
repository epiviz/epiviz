/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/14/13
 * Time: 11:55 PM
 */

goog.provide('epiviz.plugins.charts.FeatureTimeSparklinePlot');

goog.require('epiviz.ui.charts.Chart');


/**
 * @param {string} id
 * @param {jQuery} container
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Plot}
 * @constructor
 */
epiviz.plugins.charts.FeatureTimeSparklinePlot = function(id, container, properties) {
    // Call superclass constructor
    epiviz.ui.charts.Plot.call(this, id, container, properties);

    // this._dispatch = d3.dispatch("hover", "click");

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

    /**
     * @type {epiviz.events.Event.<{searchTerm: string, callback: function(Array.<{probe: string, gene: string, seqName: string, start: number, end: number}>)}>}
     * @private
     */
    this._searchFeatureChart = new epiviz.events.Event();

    this._registerFeatureGetData = new epiviz.events.Event();

    this._featureType = "featureTimeSparklinePlot";

    this._initialize();
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Plot.prototype);
epiviz.plugins.charts.FeatureTimeSparklinePlot.constructor = epiviz.plugins.charts.FeatureTimeSparklinePlot;

/**
 * @protected
 */
epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype._initialize = function() {
    // Call super
    epiviz.ui.charts.Plot.prototype._initialize.call(this);

    this._svg.classed('scatter-plot', true);

    this._chartContent = this._svg.append('g').attr('class', 'chart-content');
    this._legend = this._svg.append('g').attr('class', 'chart-legend');
    
    var featureName = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.FEATURE_NAME];
    var featureId = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.FEATURE_ID];

    this._drawNavigation(featureName, featureId);
};

/**
 * @param {epiviz.datatypes.GenomicRange} [range]
 * @param {?epiviz.datatypes.GenomicData} [data]
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 */

epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype.draw = function(range, data) {
    epiviz.ui.charts.Plot.prototype.draw.call(this, undefined, undefined);
    var self = this;
    self._lastData = data;
    self._lastRange = range;

    var sBox = $('#search-box-' + self.id());
    sBox.val(self.customSettingsValues()['featureName']);
    var testing_parameter = "AnyDayDiarrhea"; // For use with etec16s dataset
    
    //return self.drawScatter(self._lastRange, self._lastData.data, "sample_id", self._xLabel, "count");
    return self.drawScatter(self._lastRange, self._lastData.data, "sample_id", testing_parameter, "count");
};

epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype.drawScatter = function(range, data, key, dimx, dimy) {

    this.xTag = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.ROW_LABEL];

    var old_x_axis = this._measurementsX[0];
    var tempAnnotation = old_x_axis.annotation();
    this._measurementsX = [];
    var new_x_axis = new epiviz.measurements.Measurement(this.xTag, this.xTag, 'feature', 'ihmp', 'ihmp',
                                           'ihmp', null, null, tempAnnotation,
                                           -1, 1,[]);
    this._measurementsX.push(new_x_axis);
    this.xTag = dimx;

    return this._drawCircles(data, this.xTag, dimy, key);
};

/**
 * @private
 */
epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype._drawNavigation = function(fName, fId) {

    var self = this;

    $('#' + self.id()).prepend('<div style="position:absolute;"><input id="search-box-' + self.id() + '" class="feature-search-box ui-widget-content ui-corner-all" type="text"/></div>');

    var sBox = $('#search-box-' + self.id());

};

epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype.displayTypeName = function() { return 'FeatureTimeSparklinePlot'; };

/**
 * @param {epiviz.datatypes.GenomicRange} range
 * @param {epiviz.datatypes.GenomicData} data
 * @returns {Array.<epiviz.ui.charts.ChartObject>} The objects drawn
 * @private
 */
epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype._drawCircles = function(originalData, dimx, dimy, key) {
    var self = this;
    var Axis = epiviz.ui.charts.Axis;
    var circleRadius = Math.max(1, this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.CIRCLE_RADIUS_RATIO] * Math.min(this.width(), this.height()));
    var gridSquareSize = Math.max(Math.floor(circleRadius), 1);

    var margins = this.margins();
    var width = this.width();
    var height = this.height();

    var CustomSetting = epiviz.ui.charts.CustomSetting;
    var minY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MIN];
    var maxY = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.Y_MAX];
    var minX = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.X_MIN];
    var maxX = this.customSettingsValues()[epiviz.ui.charts.Visualization.CustomSettings.X_MAX];
    var showPoints = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.SHOW_POINTS];
    var logTransform = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.LOG_TRANSFORM];
    var interpolation = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.INTERPOLATION];

    var contourLowerLine = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.CONTOUR_LOWER_LINE];
    var groupSparklines = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.GROUP_SPARKLINES];
    var sparklinePresentation = this.customSettingsValues()[epiviz.plugins.charts.FeatureTimeSparklinePlotType.CustomSettings.SPARKLINE_PRESENTATION];

    showPoints = true;

    var data = originalData;

    var uniqueValues = [];
    var count= 0;
    minYdata = 100000; 
    maxYdata = 0;
    var allTimePoints = [];
    var plotData = [];
    data.forEach(function(m){
        parsed_m = JSON.parse(m[dimy]);
        parsed_m.forEach(function(p, i){
            if (!allTimePoints[i]){
                allTimePoints[i] = [];
            }
            allTimePoints[i].push(p);
        });

        var min = Math.min.apply(null, parsed_m);
        var max = Math.max.apply(null, parsed_m);

        if(uniqueValues.indexOf(m[dimx]) == -1) {
            uniqueValues.push(m[dimx]);
            plotData[count] = [];
            plotData[count][0] = count;
            plotData[count][1] = [];
            count++;
        }

        var index = uniqueValues.indexOf(m[dimx]);
        m._xVal = index+1;
        if(min < minYdata) {
            minYdata = min;
        }
        if(max > maxYdata) {
            maxYdata = max;
        }
        plotData[index][1].push(parsed_m);

    });

    if (sparklinePresentation != 'ALL'){
        var firstGroupTimePointsAverage = [];
        for(var i = 0; i < plotData[0][1][0].length; i++){
            var tempSum = 0;
            for(var j = 0; j < plotData[0][1].length; j++){
                tempSum += plotData[0][1][j][i];
            }
            firstGroupTimePointsAverage.push(tempSum/plotData[0][1].length);
        }


        var secondGroupTimePointsAverage = [];
        for(var i = 0; i < plotData[1][1][0].length; i++){
            var tempSum = 0;
            for(var j = 0; j < plotData[1][1].length; j++){
                console.log(plotData[1][1][j][i]);
                tempSum += plotData[1][1][j][i];
            }
            secondGroupTimePointsAverage.push(tempSum/plotData[1][1].length);
        }

        var firstGroupTimePointsMax = [];
        var firstGroupTimePointsMin = [];
        var secondGroupTimePointsMax = [];
        var secondGroupTimePointsMin = [];

        var firstGroupTimePointsMax = [];
        for(var i = 0; i < plotData[0][1][0].length; i++){
            var tempMax = plotData[0][1][0][0];
            for(var j = 0; j < plotData[0][1].length; j++){
                if (plotData[0][1][j][i] > tempMax){
                    tempMax = plotData[0][1][j][i];
                }
            }
            firstGroupTimePointsMax.push(tempMax);
        }

        var firstGroupTimePointsMin = [];
        for(var i = 0; i < plotData[0][1][0].length; i++){
            var tempMin = plotData[0][1][0][0];
            for(var j = 0; j < plotData[0][1].length; j++){
                if (plotData[0][1][j][i] < tempMin){
                    tempMin = plotData[0][1][j][i];
                }
            }
            firstGroupTimePointsMin.push(tempMin);
        }

        var secondGroupTimePointsMax = [];
        for(var i = 0; i < plotData[1][1][0].length; i++){
            var tempMax = plotData[1][1][0][0];
            for(var j = 0; j < plotData[1][1].length; j++){
                if (plotData[1][1][j][i] > tempMax){
                    tempMax = plotData[1][1][j][i];
                }
            }
            secondGroupTimePointsMax.push(tempMax);
        }

        var secondGroupTimePointsMin = [];
        for(var i = 0; i < plotData[1][1][0].length; i++){
            var tempMin = plotData[1][1][0][0];
            for(var j = 0; j < plotData[1][1].length; j++){
                if (plotData[1][1][j][i] < tempMin){
                    tempMin = plotData[1][1][j][i];
                }
            }
            secondGroupTimePointsMin.push(tempMin);
        }
    }


    // if (minX == CustomSetting.DEFAULT) { minX = this._measurementsX[0].minValue(); }
    if (minY == CustomSetting.DEFAULT) { minY = minYdata;}
    // if (maxX == CustomSetting.DEFAULT) { maxX = this._measurementsX[0].maxValue(); }
    if (maxY == CustomSetting.DEFAULT) { maxY = maxYdata + 1;}

    this.xTickValues = uniqueValues;
    
    if (minX == CustomSetting.DEFAULT) {
        minX = 0;
    }
    if (maxX == CustomSetting.DEFAULT) {
        maxX = uniqueValues.length+1;
    }
    
    var xScale = d3.scale.linear()
        .domain([-3,12])
        .range([0, width - margins.sumAxis(Axis.X)]);

    var yScale = d3.scale.linear()
        .domain([Math.log(minY+1), Math.log(maxY+1)*1.5])
        .range([height - margins.sumAxis(Axis.Y), 0]);

    this._clearAxes(this._chartContent);
    xLabelsPadded = [""];
    uniqueValues.forEach(function(n) {xLabelsPadded.push(n);});
    this._drawAxes(xScale, yScale, xLabelsPadded.length, 15, this._chartContent, width, height, margins, undefined, undefined,xLabelsPadded, undefined, undefined);

    var grid = {};
    var items = [];
    var maxGroupItems = 1;
    if(sparklinePresentation == 'ALL'){
        var seriesIndex = 0; // Assume only 1 pair of datax and datay
        for (var i = 0; i < data.length; ++i) {

            var cellX = data[i]["_xVal"];

            var cellY = JSON.parse(data[i][dimy]);

            
            if (!cellX || !cellY) {
                continue;
            }

            var classes = sprintf('item data-series-%s', seriesIndex);

            var x = xScale(cellX);
            // var y = yScale(cellY);
            var y = []
            cellY.forEach(function(m){
                y.push(yScale(m));
            });

            uiObj = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s', cellX, cellY, seriesIndex, data[i][key]), [key],
                data[i][key], [cellX, cellY], [
                    [data[i]],
                    [data[i]]
                ], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                seriesIndex,
                classes);
            items.push(uiObj);
        }
    }
    // need two arrays, one for min of all group's values, one for max of all group's values  - or just averages
    // cellY on line 447 and line 446 will be array of all values for that group
    // cellX should be the number of time points
    // for computed values, have a uiObj for each group's (case or control) ave, min, or max values across 

    if(sparklinePresentation != 'ALL' && contourLowerLine == "AVERAGE"){
            var firstMaxAveragePolygonVals = [];
            for(var i = 0; i < firstGroupTimePointsMax.length; i++){
                firstMaxAveragePolygonVals.push(firstGroupTimePointsMax[i]);
            }
            for(var i = firstGroupTimePointsAverage.length-1; i >= 0; i--){
                firstMaxAveragePolygonVals.push(firstGroupTimePointsAverage[i]);
            }


            var classes1a = sprintf('item data-series-%s', 0);

            var uiObj1a = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 1, firstMaxAveragePolygonVals, 0, data[0][key], "Max"), 
                //"Max",
                [key],
                data[0][key], [data[0]["_xVal"], firstMaxAveragePolygonVals], [[data[0]],[data[0]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                0, classes1a);
            
            items.push(uiObj1a);

            var secondMaxAveragePolygonVals = [];
            for(var i = 0; i < secondGroupTimePointsMax.length; i++){
                secondMaxAveragePolygonVals.push(secondGroupTimePointsMax[i]);
            }
            for(var i = secondGroupTimePointsAverage.length-1; i >= 0; i--){
                secondMaxAveragePolygonVals.push(secondGroupTimePointsAverage[i]);
            }


            var classes2a = sprintf('item data-series-%s', 1);

            var uiObj2a = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 1, secondMaxAveragePolygonVals, 0, data[0][key], "Max"), 
                //"Max",
                [key],
                data[0][key], [data[0]["_xVal"], secondMaxAveragePolygonVals], [[data[0]],[data[0]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                1, classes2a);
            
            items.push(uiObj2a);
    }
    else if(sparklinePresentation != 'ALL' && contourLowerLine == "MIN"){
            var firstMaxMinPolygonVals = [];
            for(var i = 0; i < firstGroupTimePointsMax.length; i++){
                firstMaxMinPolygonVals.push(firstGroupTimePointsMax[i]);
            }
            for(var i = firstGroupTimePointsMin.length-1; i >= 0; i--){
                firstMaxMinPolygonVals.push(firstGroupTimePointsMin[i]);
            }


            var classes1a = sprintf('item data-series-%s', 0);

            var uiObj1a = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 1, firstMaxMinPolygonVals, 0, data[0][key], "Max"), 
                //"Max",
                [key],
                data[0][key], [data[0]["_xVal"], firstMaxMinPolygonVals], [[data[0]],[data[0]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                0, classes1a);
            
            items.push(uiObj1a);

            var secondMaxMinPolygonVals = [];
            for(var i = 0; i < secondGroupTimePointsMax.length; i++){
                secondMaxMinPolygonVals.push(secondGroupTimePointsMax[i]);
            }
            for(var i = secondGroupTimePointsMin.length-1; i >= 0; i--){
                secondMaxMinPolygonVals.push(secondGroupTimePointsMin[i]);
            }


            var classes2a = sprintf('item data-series-%s', 1);

            var uiObj2a = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 1, secondMaxMinPolygonVals, 0, data[0][key], "Max"), 
                //"Max",
                [key],
                data[0][key], [data[0]["_xVal"], secondMaxMinPolygonVals], [[data[0]],[data[0]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                1, classes2a);
            
            items.push(uiObj2a);
    }
    if(sparklinePresentation == "MIN_MAX_AVERAGE"){
            var classes1a = sprintf('item data-series-%s', 0);

            var uiObj1a = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 1, firstGroupTimePointsMax, 0, data[0][key], "Max"), 
                //"Max",
                [key],
                data[0][key], [data[0]["_xVal"], firstGroupTimePointsMax], [[data[0]],[data[0]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                0, classes1a);
            
            items.push(uiObj1a);

            var classes1b = sprintf('item data-series-%s', 0);

            var uiObj1b = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 1, firstGroupTimePointsMin, 0, data[0][key], "Min"), 
                //"Min",
                [key],
                data[0][key], [data[0]["_xVal"], firstGroupTimePointsMin], [[data[0]],[data[0]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                0, classes1b);

            items.push(uiObj1b);

            var classes1c = sprintf('item data-series-%s', 0);

            var uiObj1c = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 1, firstGroupTimePointsAverage, 0, data[0][key], "Average"), 
                //"Average",
                [key],
                data[0][key], [data[0]["_xVal"], firstGroupTimePointsAverage], [[data[0]],[data[0]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                2, classes1c);

            items.push(uiObj1c);

            var classes2a = sprintf('item data-series-%s', 1);

            var uiObj2a = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 2, secondGroupTimePointsMax, 1, data[1][key], "Max"), 
                //"Max",
                [key],
                data[1][key], [data[1]["_xVal"], secondGroupTimePointsMax], [[data[1]],[data[1]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                1, classes2a);

            items.push(uiObj2a);

            var classes2b = sprintf('item data-series-%s', 1);

            var uiObj2b = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 2, secondGroupTimePointsMin, 1, data[1][key], "Min"), 
                //"Min",
                [key],
                data[1][key], [data[1]["_xVal"], secondGroupTimePointsMin], [[data[1]],[data[1]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                1, classes2b);

            items.push(uiObj2b);

            var classes2c = sprintf('item data-series-%s', 1);

            var uiObj2c = new epiviz.ui.charts.ChartIndexObject(
                sprintf('scatter_%s_%s_%s_%s_%s', 2, secondGroupTimePointsAverage, 1, data[1][key], "Average"), 
                //"Average",
                [key],
                data[1][key], [data[1]["_xVal"], secondGroupTimePointsAverage], [[data[1]],[data[1]]], // valueItems one for each measurement
                ["_xVal", dimy], // measurements
                2, classes2c);

            items.push(uiObj2c);
    }        



    var itemsGroup = this._chartContent.select('.items');


    if (itemsGroup.empty()) {
        itemsGroup = this._chartContent.append('g').attr('class', 'items');
        var selectedGroup = itemsGroup.append('g').attr('class', 'selected');
        itemsGroup.append('g').attr('class', 'hovered');
        selectedGroup.append('g').attr('class', 'hovered');
    }


    itemsGroup.selectAll('path').remove();
    var selection = itemsGroup.selectAll('path').data(items, function(d) {
        return d.id;
    });


  selection
    .enter()
    .append("path")
    .attr("d", function(d, i) {
        if(d.seriesIndex != 2){
            // console.log(d);
            var valuesAsArray = d.values[1];
            var xTransformVal = d.values[0];
            var dataPoints = 12;
            var ratio = .9/dataPoints;
            var lineData = [];
            
            var xData = [];
            var yData = [];
            valuesAsArray.forEach(function(valueElement, j){ 
                        lineData.push({x:((xTransformVal)+j) , y:Math.log(valueElement+1)});
                        xData.push(((xTransformVal)+j));
                        yData.push(Math.log(valueElement+1));

            });

                var lineFunction = d3.svg.line()
                                .x(function(d) { return xScale(d.x); })
                                .y(function(d) { return yScale(d.y); })
                                .interpolate(interpolation);

                return lineFunction(lineData);
        }
        else{
            var valuesAsArray = d.values[1];
            var xTransformVal = d.values[0];
            var dataPoints = 12;
            var ratio = .9/dataPoints;
            var lineData = [];
            
            var xData = [];
            var yData = [];
            valuesAsArray.forEach(function(valueElement, j){ 
                lineData.push({x:((xTransformVal)+j) , y:Math.log(valueElement+1)});
                xData.push(((xTransformVal)+j));
                yData.push(Math.log(valueElement+1));
            });

            var lineFunction = d3.svg.line()
                            .x(function(d) { return xScale(d.x); })
                            .y(function(d) { return yScale(d.y); })
                            .interpolate(interpolation);

            return lineFunction(lineData);
        }        
    })

    .style("stroke-width", "2")
    .style("stroke", function(d){
            if(d.seriesIndex == 0){
                return "orange";
            }
            else if(d.seriesIndex == 1){
                return "green";
            }
    })
    .style("fill", function(d){
        if(sparklinePresentation == "CONTOUR"){
            if(d.seriesIndex == 0){
                return "orange";
            }
            else if(d.seriesIndex == 1){
                return "green";
            }
        } 
        else{
            return none;
        }
    })
    .style("opacity", function(d){
        if(sparklinePresentation == "CONTOUR"){
            return 0.6;
        }
        else{
            return 1;
        }
    })

    .style("stroke-dasharray", function(d){
        if(d.seriesIndex == 2){
            return "3,3";
        }
        else{
            return "10,0";
        }
    })

    .attr("class", "splinecurve");

    selection
        .exit()
        .transition()
        .duration(1000)
        .style('opacity', 0)
        .attr('r', 0)
        .remove();

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

        this._container.find(' .chart-title')
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
    
    return items;
};

/**
 * @returns {Array.<{name: string, color: string}>}
 */
epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype.colorLabels = function() {
    return this._colorLabels;
};

epiviz.plugins.charts.FeatureTimeSparklinePlot.prototype.transformData = function(range, data) {

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
