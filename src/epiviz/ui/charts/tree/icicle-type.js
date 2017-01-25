/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/22/2014
 * Time: 12:56 PM
 */

goog.provide('epiviz.ui.charts.tree.IcicleType');

goog.require('epiviz.ui.charts.tree.HierarchyVisualizationType');
goog.require('epiviz.ui.charts.CustomSetting');

/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.tree.HierarchyVisualizationType}
 * @constructor
 */
epiviz.ui.charts.tree.IcicleType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.tree.HierarchyVisualizationType.call(this, config);
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
  return epiviz.ui.charts.tree.HierarchyVisualizationType.prototype.customSettingsDefs.call(this).concat([

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleType.CustomSettings.HOVER_OPACITY,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0.9,
      'Hover Opacity'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleType.CustomSettings.AGG_LEVEL,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      '',
      'Agg Level'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleType.CustomSettings.NODE_SEL,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      '{}',
      'Node Selection')
  ]);
};

/**
 * @enum {string}
 */
epiviz.ui.charts.tree.IcicleType.CustomSettings = {
  HOVER_OPACITY: 'hoverOpacity',
  AGG_LEVEL: 'aggLevel',
  NODE_SEL: 'nodeSel'
};
