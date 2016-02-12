/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/20/2015
 * Time: 7:47 PM
 */

goog.provide('epiviz.localstorage.LocalStorageManager');

/**
 * @constructor
 */
epiviz.localstorage.LocalStorageManager = function(type) {
  this._workspace = type;
};

/**
 * @const {string}
 */
//epiviz.localstorage.LocalStorageManager.WORKSPACE = 'workspace';

/**
 * @enum {string}
 */
epiviz.localstorage.LocalStorageManager.MODE = {
  INCOGNITO_MODE: 'incognito_workspace',
  COOKIE_MODE: 'workspace'
};

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
  var rawStr = localStorage.getItem(this._workspace);
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
  localStorage.setItem(this._workspace, JSON.stringify(raw));
};

/**
 * clear the workspace for the current instance of localmanager
 */
epiviz.localstorage.LocalStorageManager.prototype.clearWorkspace = function() {
  if(typeof(Storage) === "undefined") { return; } // No support for Storage in this browser
  localStorage.removeItem(this._workspace);
};

/**
 * clears all data in localstorage
 */
epiviz.localstorage.LocalStorageManager.prototype.clearAll = function() {
  if(typeof(Storage) === "undefined") { return; } // No support for Storage in this browser
  localStorage.clear();
};
// TODO: Idea - create a workspace history, for undo/redo functionality!
