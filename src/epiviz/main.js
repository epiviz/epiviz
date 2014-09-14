/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/8/13
 * Time: 2:26 PM
 */

goog.provide('epiviz.main');

goog.require('epiviz.ui.charts.ChartFactory');
goog.require('epiviz.ui.charts.ChartManager');
goog.require('epiviz.workspaces.WorkspaceManager');
goog.require('epiviz.ui.ControlManager');
goog.require('epiviz.Config');
goog.require('epiviz.EpiViz');

/*
 * Main entry point
 */
epiviz.main = function() {

  var config = new epiviz.Config(epiviz.EpiViz.SETTINGS);

  /** @type {epiviz.ui.LocationManager} */
  var locationManager = new epiviz.ui.LocationManager(config);

  /** @type {epiviz.measurements.MeasurementsManager} */
  var measurementsManager = new epiviz.measurements.MeasurementsManager();

  /** @type {epiviz.ui.charts.ChartFactory} */
  var chartFactory = new epiviz.ui.charts.ChartFactory(config);

  /** @type {epiviz.ui.charts.ChartManager} */
  var chartManager = new epiviz.ui.charts.ChartManager(config);

  /** @type {epiviz.ui.ControlManager} */
  var controlManager = new epiviz.ui.ControlManager(config, chartFactory, chartManager, measurementsManager, locationManager);

  /** @type {epiviz.data.DataProviderFactory} */
  var dataProviderFactory = new epiviz.data.DataProviderFactory(config);

  /** @type {epiviz.data.DataManager} */
  var dataManager = new epiviz.data.DataManager(config, dataProviderFactory);

  /** @type {epiviz.workspaces.WorkspaceManager} */
  var workspaceManager = new epiviz.workspaces.WorkspaceManager(config, locationManager, measurementsManager, chartManager, chartFactory);

  /** @type {epiviz.workspaces.UserManager} */
  var userManager = new epiviz.workspaces.UserManager(config);

  /** @type {epiviz.ui.WebArgsManager} */
  var webArgsManager = new epiviz.ui.WebArgsManager(locationManager, workspaceManager);

  /** @type {epiviz.EpiViz} */
  var epivizHandler = new epiviz.EpiViz(config, locationManager, measurementsManager, controlManager, dataManager, chartFactory, chartManager, workspaceManager, userManager, webArgsManager);

  epiviz.ui.charts.transform.clustering.ClusteringAlgorithmFactory.initialize(config);

  epivizHandler.start();
};

goog.exportSymbol('epiviz.main', epiviz.main);
