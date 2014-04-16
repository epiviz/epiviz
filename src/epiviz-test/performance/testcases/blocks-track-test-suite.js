/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/10/14
 * Time: 5:18 PM
 */

goog.provide('epiviztest.performance.testcases.BlocksTrackTestSuite');

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
epiviztest.performance.testcases.BlocksTrackTestSuite = function(epivizFramework, nRunsPerTestCase) {
  epiviztest.TestSuite.call(this, 'Blocks Track Tests', epivizFramework, nRunsPerTestCase, 'epiviz.plugins.charts.BlocksTrack');
};

/*
 * Copy methods from upper class
 */
epiviztest.performance.testcases.BlocksTrackTestSuite.prototype = epiviz.utils.mapCopy(epiviztest.TestSuite.prototype);
epiviztest.performance.testcases.BlocksTrackTestSuite.constructor = epiviztest.performance.testcases.BlocksTrackTestSuite;

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.BlocksTrackTestSuite.prototype.testAddChartWithCache = function(resultContainer, finishCallback) {
  this.addChartWithCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.BlocksTrackTestSuite.prototype.testAddChartNoCache = function(resultContainer, finishCallback) {
  this.addChartNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.BlocksTrackTestSuite.prototype.testNavigateNoCache = function(resultContainer, finishCallback) {
  this.navigateNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.BlocksTrackTestSuite.prototype.testNavigateWithCache = function(resultContainer, finishCallback) {
  this.navigateWithCache(resultContainer, finishCallback);
};

/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviztest.performance.testcases.BlocksTrackTestSuite.prototype.measurements = function() {
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
epiviztest.performance.testcases.BlocksTrackTestSuite.prototype.customSettings = function() {
  var customSettings = {};
  customSettings[epiviz.plugins.charts.BlocksTrackType.CustomSettings.MIN_BLOCK_DISTANCE] = 3;
  return customSettings;
};
