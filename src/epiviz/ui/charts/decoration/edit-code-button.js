/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:24 PM
 */

goog.provide('epiviz.ui.charts.decoration.EditCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.CodeButton}
 * @constructor
 */
epiviz.ui.charts.decoration.EditCodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.CodeButton.call(this, visualization, otherDecoration, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.CodeButton.prototype);
epiviz.ui.charts.decoration.EditCodeButton.constructor = epiviz.ui.charts.decoration.EditCodeButton;

/**
 * @returns {function(jQuery): epiviz.ui.controls.CodeControl}
 * @private
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype._controlCreator = function() {
  var self = this;
  return function(container) {
    return new epiviz.ui.controls.EditCodeControl(container, 'Edit Code', null, self.visualization(), self.visualization().lastModifiedMethod(), self.visualization().hasModifiedMethods());
  };
};

/**
 * @returns {function(*)}
 * @private
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype._saveHandler = function() {
  var self = this;
  return function(result) {
    if (result.hasModifiedMethods) {
      self.visualization().setModifiedMethods(result.modifiedMethods);
    } else {
      self.visualization().resetModifiedMethods();
    }
  };
};

/**
 * @returns {function()}
 * @private
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype._cancelHandler = function() { return function() {}; };
