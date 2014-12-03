/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 12/3/2014
 * Time: 9:27 AM
 */

goog.provide('epiviz.ui.charts.DisplayType');

/**
 * TODO: Maybe at some point, switch to this
 * @enum {{name: string, subtypes: epiviz.ui.charts.DisplayType}}
 */
epiviz.ui.charts.DisplayType = {
  MEASUREMENT_VIS: {
    name: 'measurement-vis',
    PLOT: {
      name: 'plot'
    },
    TRACK: {
      name: 'track'
    }
  },
  DATA_STRUCTURE: {
    name: 'data-structure',
    HIERARCHY: {
      name: 'hierarchy'
    }
  }
};

/**
 * @param subtype
 * @param type
 */
epiviz.ui.charts.DisplayType.is = function(subtype, type) {
  var recurseIs = function(subtype, type) {
    if (subtype.name == type.name) { return true; }
    for (var childType in type) {
      if (!type.hasOwnProperty(childType) || childType == 'name') { continue; }
      if (recurseIs(subtype, type[childType])) { return true; }
    }
    return false;
  };
  return recurseIs(subtype, type);
};
