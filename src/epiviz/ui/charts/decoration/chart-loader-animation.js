/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/30/2014
 * Time: 12:31 PM
 */

goog.provide('epiviz.ui.charts.decoration.ChartLoaderAnimation');

/**
 * @param {epiviz.ui.charts.Visualization} visualization
 * @param {epiviz.ui.charts.decoration.VisualizationDecoration} [otherDecoration]
 * @extends {epiviz.ui.charts.decoration.VisualizationDecoration}
 * @constructor
 */
epiviz.ui.charts.decoration.ChartLoaderAnimation = function(visualization, otherDecoration) {
  epiviz.ui.charts.decoration.VisualizationDecoration.call(this, visualization, otherDecoration);

  /**
   * @type {number}
   * @private
   */
  this._loaderTimeout = 0;

  /**
   * @type {boolean}
   * @private
   */
  this._animationShowing = false;
};

/*
 * Copy methods from upper class
 */
epiviz.ui.charts.decoration.ChartLoaderAnimation.prototype = epiviz.utils.mapCopy(epiviz.ui.charts.decoration.VisualizationDecoration.prototype);
epiviz.ui.charts.decoration.ChartLoaderAnimation.constructor = epiviz.ui.charts.decoration.ChartLoaderAnimation;

/**
 */
epiviz.ui.charts.decoration.ChartLoaderAnimation.prototype.decorate = function() {
  epiviz.ui.charts.decoration.VisualizationDecoration.prototype.decorate.call(this);

  var self = this;
  this.visualization().onDataWaitStart().addListener(new epiviz.events.EventListener(function() {
    self._addLoaderAnimation();
  }));

  this.visualization().onDataWaitEnd().addListener(new epiviz.events.EventListener(function() {
    self._removeLoaderAnimation();
  }));

  this.visualization().onSizeChanged().addListener(new epiviz.events.EventListener(function() {
    if (self._animationShowing) {
      self._addLoaderAnimation();
    }
  }));
};

epiviz.ui.charts.decoration.ChartLoaderAnimation.prototype._addLoaderAnimation = function() {
  if (this._loaderTimeout) { clearTimeout(this._loaderTimeout); }

  var doAddLoaderAnimation = function() {
    self._animationShowing = true;
    var loaderCls = 'chart-loader';

    var visualization = self.visualization();
    var container = visualization.container();
    container.find('.' + loaderCls).remove();

    container.append(sprintf(
      '<div class="loader-icon %s" style="top: %spx; left: %spx;"></div>',
      loaderCls,
      Math.floor(visualization.height() * 0.5),
      Math.floor(visualization.width() * 0.5)));
    container.find('.' + loaderCls).activity({
      segments: 8,
      steps: 5,
      opacity: 0.3,
      width: 4,
      space: 0,
      length: 10,
      color: '#0b0b0b',
      speed: 1.0
    });
  };

  var self = this;

  if (!this._animationShowing) {
    this._loaderTimeout = setTimeout(doAddLoaderAnimation, 500);
  } else {
    doAddLoaderAnimation();
  }
};

epiviz.ui.charts.decoration.ChartLoaderAnimation.prototype._removeLoaderAnimation = function() {
  if (this._loaderTimeout) { clearTimeout(this._loaderTimeout); }
  this._animationShowing = false;
  var loaderCls = 'chart-loader';
  this.visualization().container().find('.' + loaderCls).remove();
};
