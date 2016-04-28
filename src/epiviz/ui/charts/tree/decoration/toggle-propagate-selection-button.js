/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/13/2015
 * Time: 11:22 AM
 */

goog.provide('epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.VisualizationDecoration.call(this, visualization, otherDecoration);

  /**
   * @type {boolean}
   * @const
   */
  this.isChartOptionButton = true;

  /**
   * @type {boolean}
   * @private
   */
  this._checked = true;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton.constructor = epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton;

/**
 */
epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  var buttonIndex = 0;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.isChartOptionButton) { ++buttonIndex; }
  }

  var self = this;
  var buttonId = sprintf('%s-propagate-selection-button', this.visualization().id());
  this.visualization().container().append(sprintf(
    '<div id="%1$s-container" style="position: absolute; top: 5px; right: %2$spx">' +
    '<input type="checkbox" id="%1$s" %3$s />' +
    '<label for="%1$s" >Toggle propagate selection</label>' +
    '</div>', buttonId, 5 + buttonIndex * 30, this._checked ? 'checked="checked"' : ''));
  var button = $('#' + buttonId);
  var buttonContainer = $('#' + buttonId + '-container');
  button.button({
    text: false,
    icons:{ primary:'ui-icon ui-icon-refresh' }
  }).click(function() {
    self._checked = button.is(':checked');

    self.visualization().setAutoPropagateChanges(self._checked);
  });

  this.visualization().container()
    .mousemove(function () { buttonContainer.show(); })
    .mouseleave(function () { buttonContainer.hide(); });
};

/**
 * @returns {boolean}
 */
epiviz.ui.charts.tree.decoration.TogglePropagateSelectionButton.prototype.checked = function() { return this._checked; };

