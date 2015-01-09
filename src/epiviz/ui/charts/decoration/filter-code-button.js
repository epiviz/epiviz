/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/7/2015
 * Time: 2:00 PM
 */

goog.provide('epiviz.ui.charts.decoration.FilterCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.CodeButton}
 * @constructor
 */
epiviz.ui.charts.decoration.FilterCodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.CodeButton.call(this, visualization, otherDecoration, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.FilterCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.CodeButton.prototype);
epiviz.ui.charts.decoration.FilterCodeButton.constructor = epiviz.ui.charts.decoration.FilterCodeButton;

/**
 * @type {string}
 * @const
 */
epiviz.ui.charts.decoration.FilterCodeButton.FILTER_ID = 'user-filer';

/**
 * @returns {function(jQuery): epiviz.ui.controls.CodeControl}
 * @private
 */
epiviz.ui.charts.decoration.FilterCodeButton.prototype._controlCreator = function() {
  var self = this;
  return function(container) {
    var existingFilter = self.visualization().getMarker(epiviz.ui.charts.decoration.FilterCodeButton.FILTER_ID);
    var preFilter, filter;
    if (existingFilter) {
      preFilter = existingFilter.preMark().toString();
      filter = existingFilter.mark().toString();
    }
    return new epiviz.ui.controls.FilterCodeControl(container, 'Filter Code', null, self.visualization(), preFilter, filter, existingFilter != undefined);
  };
};

/**
 * @returns {function(*)}
 * @private
 */
epiviz.ui.charts.decoration.FilterCodeButton.prototype._saveHandler = function() {
  var self = this;
  return function(arg) {
    var preMark = null;
    var mark = null;

    if (arg.enabled) {
      try {
        preMark = eval('(' + arg.preFilter + ')');
      } catch (e) {
        var dialog = new epiviz.ui.controls.MessageDialog(
          'Error evaluating code',
          {
            Ok: function() {}
          },
          'Could not evaluate the Pre-Filter code. Error details:<br/>' + e.message,
          epiviz.ui.controls.MessageDialog.Icon.ERROR);
        dialog.show();
      }

      try {
        mark = eval('(' + arg.filter + ')');
      } catch (e) {
        var dialog = new epiviz.ui.controls.MessageDialog(
          'Error evaluating code',
          {
            Ok: function() {}
          },
          'Could not evaluate the Filter code. Error details:<br/>' + e.message,
          epiviz.ui.controls.MessageDialog.Icon.ERROR);
        dialog.show();
      }

      if (!preMark || !mark) { return; }

      self.visualization().putMarker(new epiviz.ui.charts.markers.ChartMarker(
        epiviz.ui.charts.markers.ChartMarker.Type.FILTER,
        epiviz.ui.charts.decoration.FilterCodeButton.FILTER_ID, 'User Filter', preMark, mark));
    } else {
      self.visualization().removeMarker(epiviz.ui.charts.decoration.FilterCodeButton.FILTER_ID);
    }
  };
};

/**
 * @returns {function()}
 * @private
 */
epiviz.ui.charts.decoration.FilterCodeButton.prototype._cancelHandler = function() { return function() {}; };

