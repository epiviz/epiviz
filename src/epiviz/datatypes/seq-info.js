/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/27/14
 * Time: 9:18 AM
 */

goog.provide('epiviz.datatypes.SeqInfo');

/**
 * @param {string} seqName
 * @param {number} min Minimum location covered inclusive
 * @param {number} max Maximum location covered exclusive
 * @constructor
 * @struct
 */
epiviz.datatypes.SeqInfo = function(seqName, min, max) {
  /**
   * @type {string}
   */
  this.seqName = seqName;

  /**
   * @type {number}
   */
  this.min = min;

  /**
   * @type {number}
   */
  this.max = max;
};

/**
 * @returns {Array} [seqName, min, max]
 */
epiviz.datatypes.SeqInfo.prototype.raw = function() { return [this.seqName, this.min, this.max]; };

/**
 * @param {Array} o [seqName, min, max]
 * @returns {epiviz.datatypes.SeqInfo}
 */
epiviz.datatypes.SeqInfo.fromRawObject = function(o) { return new epiviz.datatypes.SeqInfo(o[0], o[1], o[2]); };

/**
 * @param {epiviz.datatypes.SeqInfo} s1
 * @param {epiviz.datatypes.SeqInfo} s2
 * @returns {number}
 */
epiviz.datatypes.SeqInfo.compare = function(s1, s2) {
  var n1str = s1.seqName.replace(/\D/g, '');
  var n2str = s2.seqName.replace(/\D/g, '');

  if (n1str == '' || n2str == '' ||
    (!epiviz.utils.stringStartsWith(s1.seqName, n1str) && !epiviz.utils.stringEndsWith(s1.seqName, n1str)) ||
    (!epiviz.utils.stringStartsWith(s2.seqName, n2str) && !epiviz.utils.stringEndsWith(s2.seqName, n2str))) {
    return (s1.seqName < s2.seqName) ? -1 : ((s1.seqName > s2.seqName) ? 1 : 0);
  }

  return parseInt(n1str) - parseInt(n2str);
};
