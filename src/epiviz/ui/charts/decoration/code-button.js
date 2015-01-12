/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/6/2015
 * Time: 12:59 PM
 */

goog.provide('epiviz.ui.charts.decoration.CodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.ChartOptionButton}
 * @constructor
 */
epiviz.ui.charts.decoration.CodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.ChartOptionButton.call(this, visualization, otherDecoration, config);

  /**
   * @type {boolean}
   * @const
   */
  this.isCodeButton = true;

  /**
   * @type {Array.<{creator: function(jQuery): epiviz.ui.controls.CodeControl, save: function(*), cancel: function()}>}
   * @private
   */
  this._controlCreators = [];

  var isChartOptionButton = true;
  var lastCodeButtonDecoration;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.isCodeButton) {
      isChartOptionButton = false;
      lastCodeButtonDecoration = decoration;
    }
  }
  if (lastCodeButtonDecoration) {
    lastCodeButtonDecoration._addControlCreator(this._controlCreator(), this._saveHandler(), this._cancelHandler());
  }
  this.isChartOptionButton = isChartOptionButton;
  if (isChartOptionButton) {
    this._addControlCreator(this._controlCreator(), this._saveHandler(), this._cancelHandler());
  }
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.CodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.ChartOptionButton.prototype);
epiviz.ui.charts.decoration.CodeButton.constructor = epiviz.ui.charts.decoration.CodeButton;

/**
 * @returns {Function}
 * @protected
 */
epiviz.ui.charts.decoration.CodeButton.prototype._click = function() {
  var self = this;

  return function() {
    var editCodeDialog = new epiviz.ui.controls.CodeDialog(
      'Chart Code',
      {
        save: function(results) {
          results.forEach(function(result, i) {
            self._controlCreators[i].save(result);
          });
        },
        cancel: function() {
          self._controlCreators.forEach(function(o) { o.cancel(); })
        }
      },
      self._controlCreators.map(function(o) { return o.creator; }));
    editCodeDialog.show();
  };
};

/**
 * @returns {*} jQuery button render options
 * @protected
 */
epiviz.ui.charts.decoration.CodeButton.prototype._renderOptions = function() {
  return {
    icons:{ primary:'ui-icon ui-icon-pencil' },
    text:false
  };
};

/**
 * @returns {string}
 * @protected
 */
epiviz.ui.charts.decoration.CodeButton.prototype._text = function() { return 'Code'; };

/**
 * @param {function(jQuery): epiviz.ui.controls.CodeControl} creator
 * @param {function(*)} [saveHandler]
 * @param {function()} [cancelHandler]
 * @protected
 */
epiviz.ui.charts.decoration.CodeButton.prototype._addControlCreator = function(creator, saveHandler, cancelHandler) {
  this._controlCreators.push({creator: creator, save: saveHandler, cancel: cancelHandler});
};

/**
 * @returns {function(jQuery): epiviz.ui.controls.CodeControl}
 * @protected
 */
epiviz.ui.charts.decoration.CodeButton.prototype._controlCreator = function() { return null; };

/**
 * @returns {function(*)}
 * @private
 */
epiviz.ui.charts.decoration.CodeButton.prototype._saveHandler = function() { return null; };

/**
 * @returns {function()}
 * @private
 */
epiviz.ui.charts.decoration.CodeButton.prototype._cancelHandler = function() { return null; };
