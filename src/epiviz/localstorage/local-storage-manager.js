/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/20/2015
 * Time: 7:47 PM
 */

goog.provide('epiviz.localstorage.LocalStorageManager');

goog.require('epiviz.workspaces.Workspace');

/**
 * @constructor
 */
epiviz.localstorage.LocalStorageManager = function(type) {
  this._workspace = type;

  this._availStorage = (typeof(Storage) === "undefined" || localStorage == null) ? false: true;
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
  if(this._availStorage) {
    var rawStr = localStorage.getItem(this._workspace);
    if (!rawStr) { return null; }

    return epiviz.workspaces.Workspace.fromRawObject(JSON.parse(rawStr), chartFactory, config);
  }
};

/**
 * @param {epiviz.workspaces.Workspace} workspace
 * @param {epiviz.Config} config
 */
epiviz.localstorage.LocalStorageManager.prototype.saveWorkspace = function(workspace, config) {
  if(this._availStorage) {
    var raw = workspace.raw(config);
    localStorage.setItem(this._workspace, JSON.stringify(raw));
  }
};

/**
 * clear the workspace for the current instance of localmanager
 */
epiviz.localstorage.LocalStorageManager.prototype.clearWorkspace = function() {
  if(this._availStorage) {
    localStorage.removeItem(this._workspace);
  }
};

/**
 * clears all data in localstorage
 */
epiviz.localstorage.LocalStorageManager.prototype.clearAll = function() {
  if(this._availStorage) {
    localStorage.clear();
  }
};
// TODO: Idea - create a workspace history, for undo/redo functionality!