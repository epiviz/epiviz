/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/7/2015
 * Time: 12:47 PM
 */

goog.provide('epiviz.ui.charts.markers.ChartMarker');

/**
 * @param {epiviz.ui.charts.markers.VisualizationMarker.Type} type
 * @param {string} [id]
 * @param {string} [name]
 * @param {function(epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>): InitialVars} [preMark]
 * @param {function(epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem, epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>, InitialVars): MarkResult} [mark]
 * @constructor
 * @template InitialVars, MarkResult
 * @extends {epiviz.ui.charts.markers.VisualizationMarker.<epiviz.measurements.MeasurementHashtable.<epiviz.datatypes.GenomicDataMeasurementWrapper>, InitialVars, epiviz.datatypes.GenomicDataMeasurementWrapper.ValueItem, MarkResult>}
 */
epiviz.ui.charts.markers.ChartMarker = function(type, id, name, preMark, mark) {
  epiviz.ui.charts.markers.VisualizationMarker.call(this, type, id, name, preMark, mark);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.markers.ChartMarker.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.markers.VisualizationMarker.prototype);
epiviz.ui.charts.markers.ChartMarker.constructor = epiviz.ui.charts.markers.ChartMarker;
