/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/14/14
 * Time: 11:55 AM
 */

goog.provide('epiviz.ui.charts.transform.clustering.EuclideanMetricHeatmapTimePlot');

/**
 * @constructor
 * @implements {epiviz.ui.charts.transform.clustering.ClusteringMetric}
 */
epiviz.ui.charts.transform.clustering.EuclideanMetricHeatmapTimePlot = function() {};

/**
 * @param {?Array.<number>} item1
 * @param {?Array.<number>} item2
 * @returns {?number}
 */
epiviz.ui.charts.transform.clustering.EuclideanMetricHeatmapTimePlot.prototype.distance = function(item1, item2) {
  if (item1 == undefined || item2 == undefined) {
    return null;
  }
  console.log("in euclidean distance  HeatmapTimePlot calculation");
  // item1 = string.parse(item1);
  // item2 = string.parse(item2);
  // console.log(item1);
  // console.log(item2);


  var len = item1.length; // Assume item1.length == item2.length

  var nDimensions = 0;
  var meanDimDif = 0;
  var dist = 0;

  var i;
  for (i = 0; i < len; ++i) {
    if (item1[i] == undefined || item2[i] == undefined) { continue; }

    ++nDimensions;
    // var dif = item1[i] - item2[i];
    var difArray = [];
    var dif = 0;
    //console.log(item1[i]);
    //console.log(item2[i]);
    var item1TempArray = JSON.parse(item1[i]);
    var item2TempArray = JSON.parse(item2[i]);
    for(j = 0; j < item1TempArray.length; j++){
      difArray.push((item1TempArray[j] - item2TempArray[j]));
    }
    for(k = 0; k < difArray.length; k++){
      dif += difArray[k];
    }
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
epiviz.ui.charts.transform.clustering.EuclideanMetricHeatmapTimePlot.prototype.id = function() { return 'euclidean'; };
