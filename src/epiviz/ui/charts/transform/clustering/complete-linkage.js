/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:53 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.CompleteLinkage');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringLinkage}
 */
epiviz.ui.charts.transform.clustering.CompleteLinkage = function() {};

/**
 * @param {Array.<Array.<number>>} distances
 * @param {Array.<number>} indices
 * @returns {Array.<Array.<number>>}
 */
epiviz.ui.charts.transform.clustering.CompleteLinkage.prototype.link = function(distances, indices) {
  var ret = new Array(distances.length - 1);

  if (indices[0] < indices[1]) {
    var aux = indices[0];
    indices[0] = indices[1];
    indices[1] = aux;
  }

  for (var i = 0, j = 0; i < distances.length; ++i, ++j) {
    if (i == indices[0] || i == indices[1]) {
      --j;
      continue;
    }
    ret[j] = distances[i].slice(0);
    ret[j].splice(indices[0], 1);
    ret[j].splice(indices[1], 1);

    var vals = [
      i < indices[0] ? distances[i][indices[0]] : distances[indices[0]][i],
      i < indices[1] ? distances[i][indices[1]] : distances[indices[1]][i]
    ];
    ret[j].push(Math.max(vals[0], vals[1]));
  }

  ret[ret.length - 1] = new Array(ret.length);

  return ret;
};

/**
 * @returns {string}
 */
epiviz.ui.charts.transform.clustering.CompleteLinkage.prototype.id = function() { return 'complete'; };
