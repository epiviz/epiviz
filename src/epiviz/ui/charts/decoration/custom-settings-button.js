/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:24 PM
 */

goog.provide('epiviz.ui.charts.decoration.CustomSettingsButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartOptionButton}
 * @constructor
 */
epiviz.ui.charts.decoration.CustomSettingsButton = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.ChartOptionButton.call(this, visualization, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.CustomSettingsButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartOptionButton.prototype);
epiviz.ui.charts.decoration.CustomSettingsButton.constructor = epiviz.ui.charts.decoration.CustomSettingsButton;

/**
 * @returns {Function}
 * @protected
 */
epiviz.ui.charts.decoration.CustomSettingsButton.prototype._click = function() {
  var self = this;
  return function(){
    var CustomSettings = epiviz.ui.charts.Visualization.CustomSettings;
    var customSettingsDialog = new epiviz.ui.controls.CustomSettingsDialog(
      'Edit custom settings', {
        ok: function(settingsValues) {
          self.visualization().setCustomSettingsValues(settingsValues);
        },
        cancel: function() {}
      },
      self.visualization().properties().customSettingsDefs,
      self.visualization().customSettingsValues());
    customSettingsDialog.show();
  };
};

/**
 * @returns {*} jQuery button render options
 * @protected
 */
epiviz.ui.charts.decoration.CustomSettingsButton.prototype._renderOptions = function() {
  return {
    icons:{ primary:'ui-icon ui-icon-gear' },
    text:false
  };
};

/**
 * @returns {string}
 * @protected
 */
epiviz.ui.charts.decoration.CustomSettingsButton.prototype._text = function() { return 'Custom settings'; };
