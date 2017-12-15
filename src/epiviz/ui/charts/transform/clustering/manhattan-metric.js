/*
 * @Author: Jayaram Kancherla {jkanche at umiacs (dot) umd (dot) edu} 
 * @Date: 2017-12-15 09:00:36 
 */

goog.provide('epiviz.ui.charts.transform.clustering.ManhattanMetric');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.ManhattanMetric = function() {};

/**
 * @param {?Array.<number>} item1
 * @param {?Array.<number>} item2
 * @returns {?number}
 */
epiviz.ui.charts.transform.clustering.ManhattanMetric.prototype.distance = function(item1, item2) {
  if (item1 == undefined || item2 == undefined) {
    return null;
  }

  var len = item1.length;

  var abs_sum = 0;

  for(var i=0; i < len; i++) {
    abs_sum += Math.abs(item1[i] - item2[i]);
  }

  var dist = abs_sum; 

  return dist;
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.ManhattanMetric.prototype.id = function() { return 'manhattan'; };
