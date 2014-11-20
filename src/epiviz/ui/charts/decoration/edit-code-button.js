/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:24 PM
 */

goog.provide('epiviz.ui.charts.decoration.EditCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.ChartOptionButton}
 * @constructor
 */
epiviz.ui.charts.decoration.EditCodeButton = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.ChartOptionButton.call(this, visualization, otherDecoration);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartOptionButton.prototype);
epiviz.ui.charts.decoration.EditCodeButton.constructor = epiviz.ui.charts.decoration.EditCodeButton;

/**
 * @returns {Function}
 * @protected
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype._click = function() {
  var self = this;

  var editCodeDialog = new epiviz.ui.controls.CodeEditDialog(
    'Edit Chart Code', {
      save: function(modifiedMethods) {
        self.visualization().setModifiedMethods(modifiedMethods);
      }, cancel: function() {}},
    this.visualization(), 'draw');

  return function(){
    editCodeDialog.show();
  };
};

/**
 * @returns {*} jQuery button render options
 * @protected
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype._renderOptions = function() {
  return {
    icons:{ primary:'ui-icon ui-icon-pencil' },
    text:false
  };
};

/**
 * @returns {string}
 * @protected
 */
epiviz.ui.charts.decoration.EditCodeButton.prototype._text = function() { return 'Edit code'; };
