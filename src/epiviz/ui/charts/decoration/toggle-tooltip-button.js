/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:24 PM
 */

goog.provide('epiviz.ui.charts.decoration.ToggleTooltipButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ToggleTooltipButton = function(visualization, otherDecoration) {
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
epiviz.ui.charts.decoration.ToggleTooltipButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.decoration.ToggleTooltipButton.constructor = epiviz.ui.charts.decoration.ToggleTooltipButton;

/**
 */
epiviz.ui.charts.decoration.ToggleTooltipButton.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  var buttonIndex = 0;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.isChartOptionButton) { ++buttonIndex; }
  }

  var self = this;
  var tooltipButtonId = sprintf('%s-tooltip-button', this.visualization().id());
  this.visualization().container().append(sprintf(
    '<div id="%1$s-container" style="position: absolute; top: 5px; right: %2$spx">' +
    '<input type="checkbox" id="%1$s" %3$s />' +
    '<label for="%1$s" >Toggle tooltip</label>' +
    '</div>', tooltipButtonId, 5 + buttonIndex * 30, this._checked ? 'checked="checked"' : ''));
  var button = $('#' + tooltipButtonId);
  var tooltipButtonContainer = $('#' + tooltipButtonId + '-container');
  button.button({
    text: false,
    icons: {
      primary: 'ui-icon-comment'
    }
  }).click(function() {
    self._checked = button.is(':checked');
  });

  this.visualization().container()
    .mousemove(function () { tooltipButtonContainer.show(); })
    .mouseleave(function () { tooltipButtonContainer.hide(); });
};

/**
 * @returns {boolean}
 */
epiviz.ui.charts.decoration.ToggleTooltipButton.prototype.checked = function() { return this._checked; };
