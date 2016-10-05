/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/22/2014
 * Time: 12:56 PM
 */

goog.provide('epiviz.ui.charts.tree.IcicleType');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.tree.HierarchyVisualizationType}
 * @constructor
 */
epiviz.ui.charts.tree.IcicleType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.DataStructureVisualizationType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.IcicleType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.HierarchyVisualizationType.prototype);
epiviz.ui.charts.tree.IcicleType.constructor = epiviz.ui.charts.tree.IcicleType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.ui.charts.tree.Icicle}
 */
epiviz.ui.charts.tree.IcicleType.prototype.createNew = function(id, container, properties) {
  return new epiviz.ui.charts.tree.Icicle(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.IcicleType.prototype.typeName = function() {
  return 'epiviz.ui.charts.tree.Icicle';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.IcicleType.prototype.chartName = function() {
  return 'Icicle';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.IcicleType.prototype.chartHtmlAttributeName = function() {
  return 'icicle';
};

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.ui.charts.tree.IcicleType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.DataStructureVisualizationType.prototype.customSettingsDefs.call(this).concat([

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleType.CustomSettings.HOVER_OPACITY,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0.9,
      'Hover Opacity')
  ]);
};

/**
 * @enum {string}
 */
epiviz.ui.charts.tree.IcicleType.CustomSettings = {
  HOVER_OPACITY: 'hoverOpacity'
};
