/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/20/2014
 * Time: 4:00 PM
 */

goog.provide('epiviz.ui.charts.tree.decoration.PropagateSelectionButton');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton = function(visualization, otherDecoration) {
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
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.constructor = epiviz.ui.charts.tree.decoration.PropagateSelectionButton;

/**
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  var buttonIndex = 0;
  for (var decoration = this.otherDecoration(); decoration; decoration = decoration.otherDecoration()) {
    if (decoration.isChartOptionButton) { ++buttonIndex; }
  }

  var self = this;
  var button = $(sprintf(
    '<button class="epiviz-button" style="position: absolute; top: 5px; right: %spx">' +
      '<span class="epiviz-icon icon-disk3"></span>' +
      '&nbsp;' +
    '</button>',
    5 + buttonIndex * 30))
    .appendTo(this.visualization().container())
    .button({ text: false })
    .click(function() {
      self.visualization().firePropagateSelection();
    });

  this.visualization().container()
    .mousemove(function () { button.show(); })
    .mouseleave(function () { button.hide(); });
};

/**
 * @returns {boolean}
 */
epiviz.ui.charts.tree.decoration.PropagateSelectionButton.prototype.checked = function() { return this._checked; };


