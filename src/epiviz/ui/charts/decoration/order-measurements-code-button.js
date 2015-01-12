/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/11/2015
 * Time: 10:07 PM
 */

goog.provide('epiviz.ui.charts.decoration.OrderMeasurementsCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.CodeButton}
 * @constructor
 */
epiviz.ui.charts.decoration.OrderMeasurementsCodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.CodeButton.call(this, visualization, otherDecoration, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.OrderMeasurementsCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.CodeButton.prototype);
epiviz.ui.charts.decoration.OrderMeasurementsCodeButton.constructor = epiviz.ui.charts.decoration.OrderMeasurementsCodeButton;

/**
 * @returns {function(jQuery): epiviz.ui.controls.CodeControl}
 * @private
 */
epiviz.ui.charts.decoration.OrderMeasurementsCodeButton.prototype._controlCreator = function() {
  var self = this;
  return function(container) {
    var existingOrderMethod = self.visualization().measurementsOrder();
    var orderMethodText;
    if (existingOrderMethod) {
      orderMethodText = existingOrderMethod.toString();
    }

    return new epiviz.ui.controls.OrderMeasurementsCodeControl(container, 'Measurements Order', null, self.visualization(), orderMethodText, orderMethodText != undefined);
  };
};

/**
 * @returns {function(*)}
 * @private
 */
epiviz.ui.charts.decoration.OrderMeasurementsCodeButton.prototype._saveHandler = function() {
  var self = this;
  return function(arg) {
    var orderMethod = null;

    try {
      orderMethod = eval('(' + arg.orderMethodText + ')');
    } catch (e) {
      var dialog = new epiviz.ui.controls.MessageDialog(
        'Error evaluating code',
        {
          Ok: function() {}
        },
        'Could not evaluate the order method code. Error details:<br/>' + e.message,
        epiviz.ui.controls.MessageDialog.Icon.ERROR);
      dialog.show();
    }

    self.visualization().setMeasurementsOrder(orderMethod);
  };
};

/**
 * @returns {function()}
 * @private
 */
epiviz.ui.charts.decoration.OrderMeasurementsCodeButton.prototype._cancelHandler = function() { return function() {}; };
