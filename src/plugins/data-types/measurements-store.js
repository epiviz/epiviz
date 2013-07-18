/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 4/9/13
 * Time: 11:46 AM
 * To change this template use File | Settings | File Templates.
 */

function MeasurementsStore() {
  this._measurements = null;
}

/*
 * measurements = { key1 : 'Name 1', key2 : 'Name 2', etc. }
 */
MeasurementsStore.prototype.reload = function(measurements) {
  this._measurements = measurements;
};

MeasurementsStore.prototype.getMeasurements = function() {
  return this._measurements;
};
