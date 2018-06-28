/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/22/2014
 * Time: 12:56 PM
 */

goog.provide('epiviz.ui.charts.tree.IcicleFunctionalType');

goog.require('epiviz.ui.charts.tree.IcicleType');
goog.require('epiviz.ui.charts.CustomSetting');
goog.require('epiviz.ui.charts.tree.IcicleFunctional');


/**
 * @param {epiviz.Config} config
 * @extends {epiviz.ui.charts.tree.IcicleType}
 * @constructor
 */
epiviz.ui.charts.tree.IcicleFunctionalType = function(config) {
  // Call superclass constructor
  epiviz.ui.charts.tree.IcicleType.call(this, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.IcicleFunctionalType.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.tree.IcicleType.prototype);
epiviz.ui.charts.tree.IcicleFunctionalType.constructor = epiviz.ui.charts.tree.IcicleType;

/**
 * @param {string} id
 * @param {jQuery} container The div where the chart will be drawn
 * @param {epiviz.ui.charts.VisualizationProperties} properties
 * @returns {epiviz.ui.charts.tree.Icicle}
 */
epiviz.ui.charts.tree.IcicleFunctionalType.prototype.createNew = function(id, container, properties) {
  return new epiviz.ui.charts.tree.IcicleFunctional(id, container, properties);
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.IcicleFunctionalType.prototype.typeName = function() {
  return 'epiviz.ui.charts.tree.Icicle';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.IcicleFunctionalType.prototype.chartName = function() {
  return 'Navigation Control';
};

/**
 * @returns {string}
 */
epiviz.ui.charts.tree.IcicleFunctionalType.prototype.chartHtmlAttributeName = function() {
  return 'icicle';
};

/**
 * @returns {Array.<epiviz.ui.charts.CustomSetting>}
 */
epiviz.ui.charts.tree.IcicleFunctionalType.prototype.customSettingsDefs = function() {
  return epiviz.ui.charts.tree.IcicleType.prototype.customSettingsDefs.call(this).concat([

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleFunctionalType.CustomSettings.HOVER_OPACITY,
      epiviz.ui.charts.CustomSetting.Type.NUMBER,
      0.9,
      'Hover Opacity'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleFunctionalType.CustomSettings.AGG_LEVEL,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      '',
      'Agg Level'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleFunctionalType.CustomSettings.NODE_SEL,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      '{}',
      'Node Selection'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleFunctionalType.CustomSettings.ICICLE_ROOT,
      epiviz.ui.charts.CustomSetting.Type.STRING,
      '',
      'Current Root of the tree'),

    new epiviz.ui.charts.CustomSetting(
      epiviz.ui.charts.tree.IcicleFunctionalType.CustomSettings.AUTO_PROPAGATE,
      epiviz.ui.charts.CustomSetting.Type.BOOLEAN,
      true,
      'Auto Propogate Range')
  ]);
};

/**
 * @enum {string}
 */
epiviz.ui.charts.tree.IcicleFunctionalType.CustomSettings = {
  HOVER_OPACITY: 'hoverOpacity',
  AGG_LEVEL: 'aggLevel',
  NODE_SEL: 'nodeSel',
  ICICLE_ROOT: 'icicleRoot',
  AUTO_PROPAGATE: 'icicleAutoPropagate'
};
