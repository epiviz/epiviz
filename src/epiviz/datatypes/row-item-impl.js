/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/16/2015
 * Time: 1:12 PM
 */

goog.provide('epiviz.datatypes.RowItemImpl');

/**
 * @param {string} id
 * @param {string} seqName
 * @param {number} start
 * @param {number} end
 * @param {number} globalIndex
 * @param {string} strand
 * @param {Object.<string, *>} rowMetadata
 * @constructor
 * @implements {epiviz.datatypes.GenomicData.RowItem}
 */
epiviz.datatypes.RowItemImpl = function(id, seqName, start, end, globalIndex, strand, rowMetadata) {
  /**
   * @type {string}
   * @private
   */
  this._id = id;

  /**
   * @type {string}
   * @private
   */
  this._seqName = seqName;

  /**
   * @type {number}
   * @private
   */
  this._start = start;

  /**
   * @type {number}
   * @private
   */
  this._end = end;

  /**
   * @type {number}
   * @private
   */
  this._globalIndex = globalIndex;

  /**
   * @type {string}
   * @private
   */
  this._strand = strand;

  /**
   * @type {Object.<string, *>}
   * @private
   */
  this._rowMetadata = rowMetadata;
};

/**
 * @returns {string}
 */
epiviz.datatypes.RowItemImpl.prototype.id = function() { return this._id; };

/**
 * @returns {string}
 */
epiviz.datatypes.RowItemImpl.prototype.seqName = function() { return this._seqName; };

/**
 * @returns {number}
 */
epiviz.datatypes.RowItemImpl.prototype.start = function() { return this._start; };

/**
 * @returns {number}
 */
epiviz.datatypes.RowItemImpl.prototype.end = function() { return this._end; };

/**
 * @returns {number}
 */
epiviz.datatypes.RowItemImpl.prototype.globalIndex = function() { return this._globalIndex; };

/**
 * @returns {string}
 */
epiviz.datatypes.RowItemImpl.prototype.strand = function() { return this._strand; };

/**
 * @param {string} column
 * @returns {*}
 */
epiviz.datatypes.RowItemImpl.prototype.metadata = function(column) {
  var ret = this._rowMetadata[column];
  if (ret == undefined) { return null; }
  return ret;
};

/**
 * @returns {Object.<string, *>}
 */
epiviz.datatypes.RowItemImpl.prototype.rowMetadata = function() { return this._rowMetadata; };

