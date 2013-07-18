/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/5/13
 * Time: 9:07 AM
 * To change this template use File | Settings | File Templates.
 */

BarcodeMeasurementsStore.prototype = new MeasurementsStore();

BarcodeMeasurementsStore.prototype.constructor = BarcodeMeasurementsStore;

function BarcodeMeasurementsStore() {
  this._measurements = null;
  this._columnTypes = null;
  this._columnParents = null;
  this._tree = null;
}

BarcodeMeasurementsStore.prototype.reload = function(measurements) {
  if (measurements) {
    this._measurements = measurements;
  }

  if (!this._measurements) {
    return;
  }

  var struct = this._measurements;

  var allColumns = [];
  var columnTypes = {};
  var columnParents = {};

  var tree = [];
  for (var tissue in struct) {
    var tissueKey = this.nameToKey(tissue);
    allColumns.push(tissueKey);
    columnTypes[tissueKey] = 'tissue';
    columnParents[tissueKey] = null;
    var tNode = {
      type: 'tissue',
      title: tissue,
      tooltip: tissue,
      key: tissueKey,
      expand: false,
      select: false,
      isFolder: true,
      activate: false,
      hideCheckbox: false,
      unselectable: false
    };
    var subtypeNodes = [];
    for (var subtype in struct[tissue]) {
      var subtypeKey = this.nameToKey(tissue, subtype);
      allColumns.push(subtypeKey);
      columnTypes[subtypeKey] = 'subtype';
      columnParents[subtypeKey] = tissueKey;
      var sNode = {
        type: 'subtype',
        title: subtype,
        tooltip: tissue + ' - ' + subtype,
        key: subtypeKey,
        expand: false,
        select: false,
        isFolder: true,
        activate: false,
        hideCheckbox: false,
        unselectable: false
      };

      var sampleNodes = [];
      var samples = struct[tissue][subtype];
      for (var i=0; i<samples.length; ++i) {
        var sampleKey = this.nameToKey(tissue, subtype, samples[i]);
        allColumns.push(sampleKey);
        columnTypes[sampleKey] = 'sample';
        columnParents[sampleKey] = subtypeKey;
        var sampleNode = {
          type: 'sample',
          title: samples[i],
          tooltip: samples[i],
          key: sampleKey,
          expand: false,
          select: false,
          isFolder: false,
          activate: false,
          hideCheckbox: false,
          unselectable: false
        };

        sampleNodes.push(sampleNode);
      }

      sNode.children = sampleNodes;
      subtypeNodes.push(sNode);
    }
    tNode.children = subtypeNodes;
    tree.push(tNode);
  }

  this._columnTypes = columnTypes;
  this._columnParents = columnParents;

  this._tree = tree;
};

BarcodeMeasurementsStore.prototype.keyToName = function(key) {
  var result;
  if (this._columnTypes[key] == 'sample') {
    result = this.keyToName(this._columnParents[key]);
    result.sample = key;
    return result;
  }

  var parts = key.split('___');

  /*for (var i = 0; i < parts.length; ++i) {
    parts[i] = parts[i].replace(/_/g, ' ');
  }*/

  result = {
    tissue: parts[0]
  };

  if (parts.length > 1) {
    result.subtype = parts[1];
  }

  return result;
};

BarcodeMeasurementsStore.prototype.nameToKey = function(tissue, subtype, sample) {
  if (sample) {
    return sample;
  }

  if (!subtype) {
    return tissue.replace(/ /g, '_');
  }

  return tissue.replace(/ /g, '_') + '___' + subtype.replace(/ /g, '_');
};

BarcodeMeasurementsStore.prototype.getTree = function() {
  return this._tree;
};

BarcodeMeasurementsStore.prototype.getColumnType = function(column) {
  return this._columnTypes[column];
};

