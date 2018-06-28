/*
 * @Author: Jayaram Kancherla {jkanche at umiacs (dot) umd (dot) edu} 
 * @Date: 2017-12-15 09:00:36 
 */

goog.provide('epiviz.ui.charts.transform.clustering.HornMetric');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.HornMetric = function() {};

/**
 * @param {?Array.<number>} item1
 * @param {?Array.<number>} item2
 * @returns {?number}
 */
epiviz.ui.charts.transform.clustering.HornMetric.prototype.distance = function(item1, item2) {
  if (item1 == undefined || item2 == undefined) {
    return null;
  }

  var len = item1.length;

  var sum_item1 = item1.reduce(function(x,y) { return x+y;}, 0);
  var sum_item2 = item2.reduce(function(x,y) { return x+y;}, 0);

  var sum = 0;
  var sum_sq1 = 0;
  var sum_sq2 = 0;

  for (var i=0; i < len; i++) {
    sum += item1[i]*item2[i];
    sum_sq1 += item1[i]*item1[i];
    sum_sq2 += item2[i]*item2[i];
  }

  dist = 1 - (2 * sum/(sum_sq1/sum_item1/sum_item1 + sum_sq2/sum_item2/sum_item2)/sum_item1/sum_item2);

  return dist;
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.HornMetric.prototype.id = function() { return 'horn'; };
