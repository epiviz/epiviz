/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/10/14
 * Time: 1:57 PM
 */

goog.provide('epiviztest.performance.testcases.LineTrackTestSuite');

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
epiviztest.performance.testcases.LineTrackTestSuite = function(epivizFramework, nRunsPerTestCase) {
  epiviztest.TestSuite.call(this, 'Line Track Tests', epivizFramework, nRunsPerTestCase, 'epiviz.plugins.charts.LineTrack');
};

/*
 * Copy methods from upper class
 */
epiviztest.performance.testcases.LineTrackTestSuite.prototype = epiviz.utils.mapCopy(epiviztest.TestSuite.prototype);
epiviztest.performance.testcases.LineTrackTestSuite.constructor = epiviztest.performance.testcases.LineTrackTestSuite;

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.LineTrackTestSuite.prototype.testAddChartWithCache = function(resultContainer, finishCallback) {
  this.addChartWithCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.LineTrackTestSuite.prototype.testAddChartNoCache = function(resultContainer, finishCallback) {
  this.addChartNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.LineTrackTestSuite.prototype.testNavigateNoCache = function(resultContainer, finishCallback) {
  this.navigateNoCache(resultContainer, finishCallback);
};

/**
 * @param {jQuery} resultContainer
 * @param {function(?Object<string, *>)} finishCallback
 */
epiviztest.performance.testcases.LineTrackTestSuite.prototype.testNavigateWithCache = function(resultContainer, finishCallback) {
  this.navigateWithCache(resultContainer, finishCallback);
};


/**
 * @returns {epiviz.measurements.MeasurementSet}
 */
epiviztest.performance.testcases.LineTrackTestSuite.prototype.measurements = function() {
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
epiviztest.performance.testcases.LineTrackTestSuite.prototype.customSettings = function() {
  var customSettings = {};
  customSettings[epiviz.plugins.charts.LineTrackType.CustomSettings.MAX_POINTS] = 1000;
  return customSettings;
};
