/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:24 PM
 */

goog.provide('epiviz.ui.charts.decoration.SplinesSettingsButton');

goog.require('epiviz.ui.charts.decoration.ChartOptionButton');
goog.require('epiviz.ui.controls.SplinesSettingsDialog');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartOptionButton}
 * @constructor
 */
epiviz.ui.charts.decoration.SplinesSettingsButton = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.ChartOptionButton.call(this, visualization, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.SplinesSettingsButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartOptionButton.prototype);
epiviz.ui.charts.decoration.SplinesSettingsButton.constructor = epiviz.ui.charts.decoration.SplinesSettingsButton;

/**
 * @returns {Function}
 * @protected
 */
epiviz.ui.charts.decoration.SplinesSettingsButton.prototype._click = function() {
  var self = this;
  return function(){
    var CustomSettings = epiviz.ui.charts.Visualization.CustomSettings;
    var customSettingsDialog = new epiviz.ui.controls.SplinesSettingsDialog(
      'Edit custom settings', {
        ok: function(settingsValues) {
          // self.visualization().setCustomSettingsValues(settingsValues);
          self.visualization()._splinesSettings.notify(settingsValues);
        },
        cancel: function() {}
      });
    customSettingsDialog.show();
  };
};

/**
 * @returns {*} jQuery button render options
 * @protected
 */
epiviz.ui.charts.decoration.SplinesSettingsButton.prototype._renderOptions = function() {
  return {
    icons:{ primary:'fa-line-chart' },
    text:false
  };
};

/**
 * @returns {string}
 * @protected
 */
epiviz.ui.charts.decoration.SplinesSettingsButton.prototype._text = function() { return 'Splines settings'; };
