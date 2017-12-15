/*
 * @Author: Jayaram Kancherla {jkanche at umiacs (dot) umd (dot) edu} 
 * @Date: 2017-12-15 09:00:36 
 */

goog.provide('epiviz.ui.charts.transform.clustering.KulzynskiMetric');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.KulzynskiMetric = function() {};

/**
 * @param {?Array.<number>} item1
 * @param {?Array.<number>} item2
 * @returns {?number}
 */
epiviz.ui.charts.transform.clustering.KulzynskiMetric.prototype.distance = function(item1, item2) {
  if (item1 == undefined || item2 == undefined) {
    return null;
  }

  var len = item1.length;

  var sum_item1 = item1.reduce(function(x,y) { return x+y;}, 0);
  var sum_item2 = item2.reduce(function(x,y) { return x+y;}, 0);

  var dist = 0;

  for(var i=0; i < len; i++) {
    dist += (Math.min(item1[i], item2[i]) / sum_item1) + (Math.min(item1[i], item2[i]) / sum_item2);
  }

  return 1 - (0.5 * dist);
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.KulzynskiMetric.prototype.id = function() { return 'kulzynski'; };
