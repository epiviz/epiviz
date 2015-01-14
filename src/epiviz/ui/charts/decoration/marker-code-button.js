/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/7/2015
 * Time: 2:00 PM
 */

goog.provide('epiviz.ui.charts.decoration.MarkerCodeButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @param {epiviz.Config} [config]
 * @extends {epiviz.ui.charts.decoration.CodeButton}
 * @constructor
 */
epiviz.ui.charts.decoration.MarkerCodeButton = function(visualization, otherDecoration, config) {
  epiviz.ui.charts.decoration.CodeButton.call(this, visualization, otherDecoration, config);
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.CodeButton.prototype);
epiviz.ui.charts.decoration.MarkerCodeButton.constructor = epiviz.ui.charts.decoration.MarkerCodeButton;

/**
 * @returns {function(jQuery): epiviz.ui.controls.CodeControl}
 * @private
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype._controlCreator = function() {
  var self = this;
  return function(container) {
    var existingMark = self.visualization().getMarker(self.markerId());
    var preMark, mark;
    if (existingMark) {
      preMark = existingMark.preMark().toString();
      mark = existingMark.mark().toString();
    }

    preMark = preMark || self.preMarkTemplate();
    mark = mark || self.markTemplate();

    return new epiviz.ui.controls.MarkerCodeControl(container, self.markerLabel(), null, self.visualization(), preMark, mark, existingMark != undefined);
  };
};

/**
 * @returns {function(*)}
 * @private
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype._saveHandler = function() {
  var self = this;
  return function(arg) {
    var preMark = null;
    var mark = null;

    if (arg.enabled) {
      try {
        preMark = eval('(' + arg.preMark + ')');
      } catch (e) {
        var dialog = new epiviz.ui.controls.MessageDialog(
          'Error evaluating code',
          {
            Ok: function() {}
          },
          'Could not evaluate the pre-mark code. Error details:<br/>' + e.message,
          epiviz.ui.controls.MessageDialog.Icon.ERROR);
        dialog.show();
      }

      try {
        mark = eval('(' + arg.mark + ')');
      } catch (e) {
        var dialog = new epiviz.ui.controls.MessageDialog(
          'Error evaluating code',
          {
            Ok: function() {}
          },
          'Could not evaluate the mark code. Error details:<br/>' + e.message,
          epiviz.ui.controls.MessageDialog.Icon.ERROR);
        dialog.show();
      }

      if (!preMark || !mark) { return; }

      self.visualization().putMarker(self.createMarker(preMark, mark));
    } else {
      self.visualization().removeMarker(self.markerId());
    }
  };
};

/**
 * @returns {function()}
 * @private
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype._cancelHandler = function() { return function() {}; };

/**
 * @param {function(Data): InitialVars} [preMark]
 * @param {function(Item, Data, InitialVars): MarkResult} [mark]
 * @template Data, InitialVars, Item, MarkResult
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype.createMarker = function(preMark, mark) {
  return new epiviz.ui.charts.markers.VisualizationMarker(
    this.markerType(),
    this.markerId(),
    this.markerLabel(),
    preMark,
    mark);
};

/**
 * @returns {epiviz.ui.charts.markers.VisualizationMarker.Type}
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype.markerType = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype.markerLabel = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype.markerId = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype.preMarkTemplate = function() { throw Error('unimplemented abstract method'); };

/**
 * @returns {string}
 */
epiviz.ui.charts.decoration.MarkerCodeButton.prototype.markTemplate = function() { throw Error('unimplemented abstract method'); };
