/*
 * @Author: Jayaram Kancherla {jkanche at umiacs (dot) umd (dot) edu} 
 * @Date: 2017-12-15 09:00:36 
 */

goog.provide('epiviz.ui.charts.transform.clustering.BinomialMetric');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.BinomialMetric = function() {};

/**
 * @param {?Array.<number>} item1
 * @param {?Array.<number>} item2
 * @returns {?number}
 */
epiviz.ui.charts.transform.clustering.BinomialMetric.prototype.distance = function(item1, item2) {
  if (item1 == undefined || item2 == undefined) {
    return null;
  }

  var len = item1.length;
  var dist = 0;

  for(var i=0; i < len; i++) {
    var ni = item1[i] + item2[i];

    var litem1 = 0; 

    if(item1[i] > 0) {
      litem1 = Math.log(item1[i]/ni);
    }

    var litem2 = 0;

    if(item2[i] > 0) {
      litem1 = Math.log(item2[i]/ni);
    }

    if(ni != 0) {
      dist += ( (item1[i] * litem1)  + (item2[i] * litem2) - ni*Math.log(1/2)) / ni;
    }
  }

  if(dist < 0) {
    dist = 0;
  }

  return dist;
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.BinomialMetric.prototype.id = function() { return 'binomial'; };
