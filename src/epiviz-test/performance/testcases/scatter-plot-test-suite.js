/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/8/14
 * Time: 4:40 PM
 */

goog.provide('epiviztest.performance.testcases.ScatterPlotTestSuite');

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
 * @param {number} [nRunsPerTestCase] By default, 1
 * @constructor
 * @extends {epiviztest.TestSuite}
 */
epiviztest.performance.testcases.ScatterPlotTestSuite = function(epivizFramework, nRunsPerTestCase) {
  epiviztest.TestSuite.call(this, 'Scatter Plot Tests', epivizFramework, nRunsPerTestCase, 'epiviz.plugins.charts.ScatterPlot');
};

/*
 * Copy methods from upper class
 */
epiviztest.performance.testcases.ScatterPlotTestSuite.prototype = epiviz.utils.mapCopy(epiviztest.TestSuite.prototype);
epiviztest.performance.testcases.ScatterPlotTestSuite.constructor = epiviztest.performance.testcases.ScatterPlotTestSuite;



/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.ScatterPlotTestSuite.prototype.testAddChartWithCache = function(resultContainer, finishCallback) {
  this.addChartWithCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.ScatterPlotTestSuite.prototype.testAddChartNoCache = function(resultContainer, finishCallback) {
  this.addChartNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.ScatterPlotTestSuite.prototype.testNavigateNoCache = function(resultContainer, finishCallback) {
  this.navigateNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.ScatterPlotTestSuite.prototype.testNavigateWithCache = function(resultContainer, finishCallback) {
  this.navigateWithCache(resultContainer, finishCallback);
};

/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviztest.performance.testcases.ScatterPlotTestSuite.prototype.measurements = function() {
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
epiviztest.performance.testcases.ScatterPlotTestSuite.prototype.customSettings = function() {
  var customSettings = {};
  customSettings[epiviz.plugins.charts.ScatterPlotType.CustomSettings.CIRCLE_RADIUS_RATIO] = 0.01;
  return customSettings;
};
