/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:24 PM
 */

goog.provide('epiviz.ui.charts.decoration.CustomSettingsButton');

/**
 * @param {epiviz.ui.charts.Chart} chart
 * @param {epiviz.ui.charts.decoration.ChartDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartOptionButton}
 * @constructor
 */
epiviz.ui.charts.decoration.CustomSettingsButton = function(chart, otherDecoration) {
  epiviz.ui.charts.decoration.ChartOptionButton.call(this, chart, otherDecoration);
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
    var CustomSettings = epiviz.ui.charts.ChartType.CustomSettings;
    var customSettingsDialog = new epiviz.ui.controls.CustomSettingsDialog(
      'Edit custom settings', {
        ok: function(settingsValues) {
          self.chart().setCustomSettingsValues(settingsValues);
          self.chart().draw();
        },
        cancel: function() {}
      },
      self.chart().properties().customSettingsDefs,
      self.chart().customSettingsValues());
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
