/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:55 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.EuclideanMetric');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.EuclideanMetric = function() {};

/**
 * @param {?Array.<number>} item1
 * @param {?Array.<number>} item2
 * @returns {?number}
 */
epiviz.ui.charts.transform.clustering.EuclideanMetric.prototype.distance = function(item1, item2) {
  if (item1 == undefined || item2 == undefined) {
    return null;
  }

  var len = item1.length; // Assume item1.length == item2.length

  var nDimensions = 0;
  var meanDimDif = 0;
  var dist = 0;

  var i;
  for (i = 0; i < len; ++i) {
    if (item1[i] == undefined || item2[i] == undefined) { continue; }

    ++nDimensions;
    var dif = item1[i] - item2[i];
    meanDimDif += dif;
    dist += dif * dif;
  }

  if (nDimensions > 0) {
    meanDimDif /= nDimensions;
  }

  // All undefined dimensions are replaced with the mean dimension difference
  dist += (len - nDimensions) * meanDimDif * meanDimDif;

  return dist;
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.EuclideanMetric.prototype.id = function() { return 'euclidean'; };
