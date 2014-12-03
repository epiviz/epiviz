/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/1/2014
 * Time: 6:47 PM
 */

goog.provide('epiviz.ui.charts.DataStructureVisualization');

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @extends {epiviz.ui.charts.Visualization.<T>}
 * @template T
 * @constructor
 */
epiviz.ui.charts.DataStructureVisualization = function(id, container, properties) {
  // Call superclass constructor
  epiviz.ui.charts.Visualization.call(this, id, container, properties);

  /**
   * @type {string}
   * @private
   */
  this._datasourceGroup = properties.visConfigSelection.datasourceGroup;

  /**
   * @type {string}
   * @private
   */
  this._dataprovider = properties.visConfigSelection.dataprovider;

  if (!this._dataprovider) {
    var self = this;
    properties.visConfigSelection.measurements.foreach(function(m) {
      if (m.dataprovider()) { self._dataprovider = m.dataprovider(); return true; }
    })
  }

  // Events

  /**
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, epiviz.ui.charts.tree.NodeSelectionType>>>}
   * @private
   */
  this._propagateHierarchySelection = new epiviz.events.Event();

  /**
   * event -> event args -> selection -> data
   * @type {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.controls.VisConfigSelection.<T>>>}
   * @private
   */
  this._requestHierarchy = new epiviz.events.Event();
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.DataStructureVisualization.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.Visualization.prototype);
epiviz.ui.charts.DataStructureVisualization.constructor = epiviz.ui.charts.DataStructureVisualization;

/**
 * @returns {epiviz.ui.charts.VisualizationType.DisplayType}
 */
epiviz.ui.charts.DataStructureVisualization.prototype.displayType = function() { return epiviz.ui.charts.VisualizationType.DisplayType.DATA_STRUCTURE; };


/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<Object.<string, epiviz.ui.charts.tree.NodeSelectionType>>>}
 */
epiviz.ui.charts.DataStructureVisualization.prototype.onPropagateHierarchySelection = function() { return this._propagateHierarchySelection; };

/**
 */
epiviz.ui.charts.DataStructureVisualization.prototype.firePropagateHierarchySelection = function() {
  this._propagateHierarchySelection.notify(new epiviz.ui.charts.VisEventArgs(
    this.id(),
    new epiviz.ui.controls.VisConfigSelection(undefined, undefined, this.datasourceGroup(), this.dataprovider(), undefined, undefined, undefined, {})));
};


/**
 * @returns {epiviz.events.Event.<epiviz.ui.charts.VisEventArgs.<epiviz.ui.controls.VisConfigSelection.<T>>>}
 */
epiviz.ui.charts.DataStructureVisualization.prototype.onRequestHierarchy = function() { return this._requestHierarchy; };

/**
 * @returns {string}
 */
epiviz.ui.charts.DataStructureVisualization.prototype.datasourceGroup = function() { return this._datasourceGroup; };

/**
 * @returns {string}
 */
epiviz.ui.charts.DataStructureVisualization.prototype.dataprovider = function() { return this._dataprovider; };
