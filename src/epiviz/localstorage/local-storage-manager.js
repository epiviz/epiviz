/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/20/2015
 * Time: 7:47 PM
 */

goog.provide('epiviz.localstorage.LocalStorageManager');

/**
 * @constructor
 */
epiviz.localstorage.LocalStorageManager = function() {};

/**
 * @const {string}
 */
epiviz.localstorage.LocalStorageManager.WORKSPACE = 'workspace';

/**
 */
epiviz.localstorage.LocalStorageManager.prototype.initialize = function() {};

/**
 * @param {epiviz.ui.charts.ChartFactory} chartFactory
 * @param {epiviz.Config} config
 * @returns {epiviz.workspaces.Workspace}
 */
epiviz.localstorage.LocalStorageManager.prototype.getWorkspace = function(chartFactory, config) {
  if(typeof(Storage) === "undefined") { return null; } // No support for Storage in this browser
  var rawStr = localStorage.getItem(epiviz.localstorage.LocalStorageManager.WORKSPACE);
  if (!rawStr) { return null; }

  return epiviz.workspaces.Workspace.fromRawObject(JSON.parse(rawStr), chartFactory, config);
};

/**
 * @param {epiviz.workspaces.Workspace} workspace
 * @param {epiviz.Config} config
 */
epiviz.localstorage.LocalStorageManager.prototype.saveWorkspace = function(workspace, config) {
  if(typeof(Storage) === "undefined") { return; } // No support for Storage in this browser
  var raw = workspace.raw(config);
  localStorage.setItem(epiviz.localstorage.LocalStorageManager.WORKSPACE, JSON.stringify(raw));
};

// TODO: Idea - create a workspace history, for undo/redo functionality!
