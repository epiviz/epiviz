/**
 * Created by Jayaram Kancherla ( jkanche [at] umd [dot] edu )
 * Date: 9/10/20
 * Time: 9:35 AM
 */

goog.provide("epiviz.plugins.charts.SashimiPlotType");

goog.require("epiviz.plugins.charts.SashimiPlot");
goog.require("epiviz.ui.charts.TrackType");
goog.require("epiviz.measurements.Measurement.Type");
goog.require("epiviz.ui.charts.CustomSetting");

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.TrackType}
 * @constructor
 */
epiviz.plugins.charts.SashimiPlotType = function (config) {
  // Call superclass constructor
  epiviz.ui.charts.TrackType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.plugins.charts.SashimiPlotType.prototype = epiviz.utils.mapCopy(
  epiviz.ui.charts.TrackType.prototype
);
epiviz.plugins.charts.SashimiPlotType.constructor =
  epiviz.plugins.charts.SashimiPlotType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.plugins.charts.SashimiPlot}
 */
epiviz.plugins.charts.SashimiPlotType.prototype.createNew = function (
  id,
  container,
  properties
) {
  return new epiviz.plugins.charts.SashimiPlot(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.SashimiPlotType.prototype.typeName = function () {
  return "epiviz.plugins.charts.SashimiPlot";
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.SashimiPlotType.prototype.chartName = function () {
  return "Sashimi Track";
};

/**
 * @returns {string}
 */
epiviz.plugins.charts.SashimiPlotType.prototype.chartHtmlAttributeName =
  function () {
    return "sashimi";
  };

/**
 * @returns {epiviz.measurements.Measurement.Type}
 */

/**
 * @returns {boolean}
 */
epiviz.plugins.charts.SashimiPlotType.prototype.isRestrictedToRangeMeasurements =
  function () {
    return true;
  };

/**
 * @returns {function(epiviz.measurements.Measurement): boolean}
 */
epiviz.plugins.charts.SashimiPlotType.prototype.measurementsFilter =
  function () {
    return function (m) {
      return m.type() == epiviz.measurements.Measurement.Type.FEATURE;
    };
  };

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.plugins.charts.SashimiPlotType.prototype.customSettingsDefs =
  function () {
    return epiviz.ui.charts.TrackType.prototype.customSettingsDefs
      .call(this)
      .concat([
        new epiviz.ui.charts.CustomSetting(
          epiviz.plugins.charts.SashimiPlotType.CustomSettings.SHOW_Y_AXIS,
          epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
          true,
          "Show y-axis"
        ),

        new epiviz.ui.charts.CustomSetting(
          epiviz.plugins.charts.SashimiPlotType.CustomSettings.INTERPOLATION,
          epiviz.ui.charts.CustomSetting.Type.CATEGORICAL,
          "basis",
          "Interpolation",
          [
            "linear",
            "step-before",
            "step-after",
            "basis",
            "basis-open",
            "basis-closed",
            "bundle",
            "cardinal",
            "cardinal-open",
            "monotone",
          ]
        ),

        new epiviz.ui.charts.CustomSetting(
          epiviz.plugins.charts.SashimiPlotType.CustomSettings.POINT_RADIUS,
          epiviz.ui.charts.CustomSetting.Type.NUMBER,
          1,
          "Point radius"
        ),

        new epiviz.ui.charts.CustomSetting(
          epiviz.plugins.charts.SashimiPlotType.CustomSettings.SHOW_POINTS,
          epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
          false,
          "Show points"
        ),

        new epiviz.ui.charts.CustomSetting(
          epiviz.plugins.charts.SashimiPlotType.CustomSettings.SHOW_TRACKS,
          epiviz.ui.charts.CustomSetting.Type.STRING,
          epiviz.ui.charts.CustomSetting.DEFAULT,
          "Hide/Show Tracks"
        ),

        new epiviz.ui.charts.CustomSetting(
          epiviz.plugins.charts.SashimiPlotType.CustomSettings.AUTO_SCALE,
          epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
          true,
          "Fixed y-axis"
        ),
      ]);
  };

/**
 * @enum {string}
 */
epiviz.plugins.charts.SashimiPlotType.CustomSettings = {
  INTERPOLATION: "interpolation",
  SHOW_Y_AXIS: "showYAxis",
  SHOW_POINTS: "showPoints",
  POINT_RADIUS: "pointRadius",
  SHOW_TRACKS: "showTracks",
  AUTO_SCALE: "autoScale",
};

// goog.inherits(epiviz.plugins.charts.BlocksTrackType, epiviz.ui.charts.TrackType);
