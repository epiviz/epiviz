/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/10/14
 * Time: 5:22 PM
 */

goog.provide('epiviztest.performance.testcases.HeatmapPlotTestSuite');

/**
 * @param {{
 *   config: epiviz.Config,
 *   locationManager: epiviz.ui.LocationManager,
 *   measurementsManager: epiviz.measurements.MeasurementsManager,
 *   chartFactory: epiviz.ui.charts.ChartFactory,
 *   chartManager: epiviz.ui.charts.ChartManager,
 *   controlManager: epiviz.ui.ControlManager,
 *   dataProviderFactory: epiviz.data.DataProviderFactory,
 *   dataManager: epiviz.data.DataManager,
 *   workspaceManager: epiviz.workspaces.WorkspaceManager,
 *   userManager: epiviz.workspaces.UserManager,
 *   webArgsManager: epiviz.ui.WebArgsManager,
 *   epivizHandler: epiviz.EpiViz
 * }} epivizFramework
 * @param {number} [nRunsPerTestCase]
 * @constructor
 * @extends {epiviztest.TestSuite}
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite = function(epivizFramework, nRunsPerTestCase) {
  epiviztest.TestSuite.call(this, 'Heatmap Plot Tests', epivizFramework, nRunsPerTestCase, 'epiviz.plugins.charts.HeatmapPlot');
};

/*
 * Copy methods from upper class
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite.prototype = epiviz.utils.mapCopy(epiviztest.TestSuite.prototype);
epiviztest.performance.testcases.HeatmapPlotTestSuite.constructor = epiviztest.performance.testcases.HeatmapPlotTestSuite;

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite.prototype.testAddChartWithCache = function(resultContainer, finishCallback) {
  this.addChartWithCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite.prototype.testAddChartNoCache = function(resultContainer, finishCallback) {
  this.addChartNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite.prototype.testNavigateNoCache = function(resultContainer, finishCallback) {
  this.navigateNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite.prototype.testNavigateWithCache = function(resultContainer, finishCallback) {
  this.navigateWithCache(resultContainer, finishCallback);
};

/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite.prototype.measurements = function() {
  // Prepare chart properties
  var neededMeasurements = 2;
  return this.epivizFramework.measurementsManager.measurements().subset(function(m) {
    if (neededMeasurements && m.datasourceGroup() == 'methylation_coef_big') { --neededMeasurements; return true; }
    return false;
  });
};

/**
 * @returns {Object.<string, *>}
 */
epiviztest.performance.testcases.HeatmapPlotTestSuite.prototype.customSettings = function() {
  var customSettings = {};
  customSettings[epiviz.plugins.charts.HeatmapPlotType.CustomSettings.MAX_COLUMNS] = 50;
  return customSettings;
};
