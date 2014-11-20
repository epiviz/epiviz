/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/20/2014
 * Time: 11:59 AM
 */

goog.provide('epiviz.ui.charts.tree.decoration.ToggleSelectButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.tree.decoration.ToggleSelectButton = function(visualization, otherDecoration) {
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
  this._checked = false;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.tree.decoration.ToggleSelectButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.tree.decoration.ToggleSelectButton.constructor = epiviz.ui.charts.tree.decoration.ToggleSelectButton;

/**
 */
epiviz.ui.charts.tree.decoration.ToggleSelectButton.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  var buttonIndex = 0;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.isChartOptionButton) { ++buttonIndex; }
  }

  var self = this;
  var selectButtonId = sprintf('%s-select-button', this.visualization().id());
  this.visualization().container().append(sprintf(
    '<div id="%1$s-container" class="epiviz-button" style="position: absolute; top: 5px; right: %2$spx">' +
    '<input type="checkbox" id="%1$s" %3$s />' +
    '<label for="%1$s"><span class="epiviz-icon icon-cursor"></span></label>' + // Cursor icon
    '</div>', selectButtonId, 5 + buttonIndex * 30, this._checked ? 'checked="checked"' : '', "\ue640"));
  var button = $('#' + selectButtonId);
  var selectButtonContainer = $('#' + selectButtonId + '-container');
  button.button({
    text: false
  }).click(function() {
    self._checked = button.is(':checked');
    self.visualization().setSelectMode(self._checked);
  });


  this.visualization().container()
    .mousemove(function () { selectButtonContainer.show(); })
    .mouseleave(function () { selectButtonContainer.hide(); });
};

/**
 * @returns {boolean}
 */
epiviz.ui.charts.tree.decoration.ToggleSelectButton.prototype.checked = function() { return this._checked; };

