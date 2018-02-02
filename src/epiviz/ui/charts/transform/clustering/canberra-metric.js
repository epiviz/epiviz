/*
 * @Author: Jayaram Kancherla {jkanche at umiacs (dot) umd (dot) edu} 
 * @Date: 2017-12-15 09:00:36 
 */

goog.provide('epiviz.ui.charts.transform.clustering.CanberraMetric');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.CanberraMetric = function() {};

/**
 * @param {?Array.<number>} item1
 * @param {?Array.<number>} item2
 * @returns {?number}
 */
epiviz.ui.charts.transform.clustering.CanberraMetric.prototype.distance = function(item1, item2) {
  if (item1 == undefined || item2 == undefined) {
    return null;
  }

  var len = item1.length;

  var dist = 0;

  for(var i=0; i < len; i++) {

    if((Math.abs(item1[i]) + Math.abs(item2[i])) > 0) {
      dist += Math.abs(item1[i] - item2[i]) / (Math.abs(item1[i]) + Math.abs(item2[i]));
    }
    
  }

  return dist/len;
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.CanberraMetric.prototype.id = function() { return 'canberra'; };
