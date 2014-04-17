/**
 * Created by: Florin Chelaru
 * Date: 9/26/13
 * Time: 8:03 AM
 */

goog.provide('epiviz.datatypes.GenomicRanges');

goog.require('goog.structs.IntervalTree');


/**
 * A collection of genomic ranges
 * @param {Array.<string>} [id]
 * @param {Array.<number>|number} [seqindex]
 * @param {Array.<number>} [start]
 * @param {Array.<number>} [end]
 * @param {Array.<string>|string} [strand]
 * @param {Object.<string, Array>} [values]
 * @param {Array.<string>} [levels]
 * @constructor
 * @implements {epiviz.datatypes.GenomicData}
 * @deprecated
 */
epiviz.datatypes.GenomicRanges = function(id, seqindex, start, end, strand, values, levels) {
  /**
   * @type {Array.<string>}
   * @private
   */
  this._id = id;

  /**
   * @type {Array.<number>|number}
   * @private
   */
  this._seqindex = seqindex;

  /**
   * @type {Array.<number>}
   * @private
   */
  this._start = start;

  /**
   * @type {Array.<number>}
   * @private
   */
  this._end = end;

  /**
   * @type {Array.<string>|string}
   * @private
   */
  this._strand = strand;

  /**
   * @type {Object.<string, Array>}
   * @private
   */
  this._values = values;

  /**
   * @type {Array.<string>}
   * @private
   */
  this._levels = levels;

  /**
   * @type {Array.<goog.structs.IntervalTree>}
   * @private
   */
  this._intervalForest = null;
};

/**
 * A constant denoting the type name
 * @type {string}
 */
epiviz.datatypes.GenomicRanges.TYPE = 'epiviz.datatypes.GenomicRanges';

/**
 *
 * @param {{id: Array.<string>, seqindex: *, start: Array.<number>, end: Array.<number>, strand: *, values: *, levels: Array.<string>}} o A parsed JSON
 * object containing raw data for the genomic ranges. Subfields:
 *   id: an array of string values for the ids of each genomic range
 *   seqindex: an array of chromosome numbers for each range, corresponding to indices in the levels array;
 *     can also contain a single value, in which case all ranges are assumed to belong to the same chromosome.
 *   start: an array of start base pairs for the ranges
 *   end: an array of end base pairs for the ranges
 *   strand: an array of strings corresponding to the direction of the strand of each range;
 *     if instead of an array there's one single value, then all ranges are assumed to belong
 *     to the same strand.
 *   values: a map of column names as keys and arrays as values, containing metadata for the genomic range;
 *     this field is optional.
 *   levels: an array of names for all chromosomes in the instance; the numbers in seqindex correspond to indices
 *     in this array
 *
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.fromRawObject = function(o) {
  return new epiviz.datatypes.GenomicRanges(o.id, o.seqindex, o.start, o.end, o.strand, o.values, o.levels);
};

/**
 *
 * @param {epiviz.datatypes.SeqInfo} seqinfo
 * @param {number} start
 * @param {number} end
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.createQuery = function(seqinfo, start, end) {
  return new epiviz.datatypes.GenomicRanges([null], seqinfo.index(), [start], [end], null, null, seqinfo.levels());
};

/**
 * @protected
 */
epiviz.datatypes.GenomicRanges.prototype._initializeIntervalForest = function() {
  if (this._intervalForest) { return; }

  /** @type {Array.<goog.structs.IntervalTree>} */
  var intervalForest = new Array(this._levels.length);
  this.foreach(
    /** @param {epiviz.datatypes.GenomicRanges.Row} row */
    function(row) {
      var seqindex = row.seqinfo().index();
      if (!intervalForest[seqindex]) {
        intervalForest[seqindex] = new goog.structs.IntervalTree();
      }

      intervalForest[seqindex].add(row);
    });

  this._intervalForest = intervalForest;
};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicRanges.prototype.dataType = function() {
  return epiviz.datatypes.GenomicRanges.TYPE;
};

/**
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.prototype.ranges = function() { return this; };

/**
 * @param {number} i a numeric index of the row
 * @returns {epiviz.datatypes.GenomicRanges.Row}
 */
epiviz.datatypes.GenomicRanges.prototype.get = function(i) {
  if (i < 0 || i >= this.size()) { return null; }

  return new epiviz.datatypes.GenomicRanges.Row(this, i);
};

/**
 * Iterates through all genomic ranges until fun returns something that evaluates to true
 * @param {function(epiviz.datatypes.GenomicRanges.Row)} fun
 */
epiviz.datatypes.GenomicRanges.prototype.foreach = function(fun) {
  var size = this.size();
  for (var i = 0; i < size; ++i) {
    if (fun(this.get(i))) {
      break;
    }
  }
};

/**
 * @returns {number} the total number of rows in the structure
 */
epiviz.datatypes.GenomicRanges.prototype.size = function() {
  return this._id ? this._id.length : 0;
};

/**
 * @param {epiviz.datatypes.GenomicRanges} query
 * @returns {epiviz.datatypes.GenomicRanges.Hits}
 */
epiviz.datatypes.GenomicRanges.prototype.findOverlaps = function(query) {

  this._initializeIntervalForest();

  var self = this;

  // A function that converts the query level indices to
  // this query indices
  var convertQueryLevels = null;
  if (this._levels == query._levels) {
    convertQueryLevels = function(index) { return index; }
  } else {
    var queryLevelsMap = {};
    for (var i = 0; i < query._levels.length; ++i) {
      queryLevelsMap[i] = this._levels.indexOf(query._levels[i]);
    }

    convertQueryLevels = function(index) { return queryLevelsMap[index]; }
  }

  var queryHits = [];
  var subjectHits = [];

  query.foreach(
    /**
     * @param {epiviz.datatypes.GenomicRanges.Row} row
     * @returns {boolean}
     */
    function(row) {
      var seqindex = convertQueryLevels(row.seqinfo().index());

      // The current query row belongs to a chromosome not present in this
      // epiviz.datatypes.GenomicRanges instance
      if (seqindex < 0) { return false; }

      var tree = self._intervalForest[seqindex];

      // The tree corresponding to the current chromosome is empty
      if (!tree) { return false; }

      var overlaps = tree.overlaps(row);
      for (var i = 0; i < overlaps.length; ++i) {
        queryHits.push(row.index());
        subjectHits.push(overlaps[i].index())
      }

      return false;
    });

  return new epiviz.datatypes.GenomicRanges.Hits(queryHits, subjectHits);
};

/**
 *
 * @param query
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.prototype.subsetByOverlaps = function(query) {
  return new epiviz.datatypes.GenomicRanges.Subset(this, this.findOverlaps(query).subject());
};

/**
 * Merges two genomic ranges instances together by location, eliminating common rows (where ids match)
 * TODO: Consider creating a wrapper class for the result of this function, which simply maps indices,
 * without performing a hard copy
 * @param {epiviz.datatypes.GenomicRanges} gr1
 * @param {epiviz.datatypes.GenomicRanges} gr2
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.merge = function(gr1, gr2) {

  // Create a mapping between the chromosomes in the two epiviz.datatypes.GenomicRanges instances
  // and the resulted one.
  var levels = null;

  /** @type {function(number, epiviz.datatypes.GenomicRanges=):number} */
  var levelsMapper = null;

  if (gr1.levels() == gr2.levels()) {
    levels = gr1.levels();
    levelsMapper = function(seqindex) { return seqindex; }
  } else {
    levels = [];
    var levelsMap = {};
    var nLevels = 0;
    var i;
    for (i = 0; i < gr1.levels().length; ++i) {
      levels.push(gr1.levels()[i]);
      levelsMap[gr1.levels()[i]] = nLevels++;
    }
    for (i = 0; i < gr2.levels().length; ++i) {
      if (!(gr2.levels()[i] in levelsMap)) {
        levels.push(gr2.levels()[i]);
        levelsMap[gr2.levels()[i]] = nLevels++;
      }
    }

    /**
     * @param {number} seqindex
     * @param {epiviz.datatypes.GenomicRanges=} gr
     * @returns {number}
     */
    levelsMapper = function(seqindex, gr) {  return levelsMap[gr.levels()[seqindex]]; }
  }

  var id = [], seqindex = [], start = [], end = [], strand = [];
  var values = {};
  var columns = gr1.valueColumns().concat(gr2.valueColumns());
  for (var j = 0; j < columns.length; ++j) {
    values[columns[j]] = [];
  }
  // Unique columns
  columns = Object.keys(values);

  var rangeIds = {};
  var iterator =
    /**
     * @param {epiviz.datatypes.GenomicRanges.Row} row
     * @returns {boolean}
     */
    function(row) {
      if (row.id() in rangeIds) { return false; }

      rangeIds[row.id()] = true;
      id.push(row.id());
      seqindex.push(levelsMapper(row.seqinfo().index(), row.parent()));
      start.push(row.start());
      end.push(row.end());
      strand.push(row.strand());
      for (var i = 0; i < columns.length; ++i) {
        values[columns[i]].push(row.value(columns[i]));
      }

      return false;
    };

  gr1.foreach(iterator);
  gr2.foreach(iterator);

  return new epiviz.datatypes.GenomicRanges(id, seqindex, start, end, strand, values, levels);
};

/**
 * @returns {Array.<string>} the names of the value columns associated with the epiviz.datatypes.GenomicRanges instance
 */
epiviz.datatypes.GenomicRanges.prototype.valueColumns = function() {
  if (this._values) {
    return Object.keys(this._values);
  }

  return [];
};

/**
 * @param {number} index
 * @returns {string}
 */
epiviz.datatypes.GenomicRanges.prototype.id = function(index) {
  return this._id[index];
};

/**
 *
 * @param {number} index
 * @returns {epiviz.datatypes.SeqInfo}
 */
epiviz.datatypes.GenomicRanges.prototype.seqinfo = function(index) {
  var result = Array.isArray(this._seqindex) ? this._seqindex[index] : this._seqindex;

  return new epiviz.datatypes.SeqInfo(this._levels, result);
};

/**
 * @param {number} index
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.prototype.start = function(index) {
  return this._start[index];
};

/**
 * @param {number} index
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.prototype.end = function(index) {
  return this._end[index];
};

/**
 * @param {number} index
 * @returns {string}
 */
epiviz.datatypes.GenomicRanges.prototype.strand = function(index) {
  return Array.isArray(this._strand) ? this._strand[index] : this._strand;
};

/**
 * @param {string} column
 * @param {number} index
 * @returns {*}
 */
epiviz.datatypes.GenomicRanges.prototype.value = function(column, index) {
  if (!this._values || !this._values[column]) { return null; }
  return this._values[column][index];
};

/**
 * @returns {Array.<string>}
 */
epiviz.datatypes.GenomicRanges.prototype.levels = function() {
  return this._levels;
};


goog.provide('epiviz.datatypes.GenomicRanges.Subset');

/**
 *
 * @param {epiviz.datatypes.GenomicRanges} parent
 * @param {Array.<number>} indices A set of unique indices pointing to the data in parent (uniqueness is
 *   enforced in the Subset class, so if duplicate indices exist, only the first of them is considered)
 * @constructor
 * @extends {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.Subset = function(parent, indices) {

  // Call superclass constructor
  epiviz.datatypes.GenomicRanges.call(this);

  /**
   * @type {epiviz.datatypes.GenomicRanges}
   * @private
   */
  this._innerGenomicRanges = parent;

  /**
   * A mapping between the original indices and their corresponding indices in the subset
   * @type {Object.<number, number>}
   * @private
   */
  this._indicesMap = {};
  for (var i = 0; i < indices.length; ++i) {
    if (indices[i] in this._indicesMap) { continue; }
    this._indicesMap[indices[i]] = i;
  }

  /**
   * @type {Array.<number>}
   * @private
   */
  this._indices = Object.keys(this._indicesMap);
};

/**
 * Copy methods from upper class
 */
epiviz.datatypes.GenomicRanges.Subset.prototype = epiviz.utils.mapCopy(epiviz.datatypes.GenomicRanges.prototype);
epiviz.datatypes.GenomicRanges.Subset.constructor = epiviz.datatypes.GenomicRanges.Subset;


epiviz.datatypes.GenomicRanges.Subset.prototype._initializeIntervalForest = function() {
  this._innerGenomicRanges._initializeIntervalForest();
};

/**
 * @param {number|string} i either a numeric index of the row, or an id of the sought id
 * @returns {epiviz.datatypes.GenomicRanges.Row}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.get = function(i) {
  if (i < 0 || i >= this.size()) { return null; }

  return this._innerGenomicRanges.get(this._indices[i]);
};

/**
 * @returns {number} the total number of rows in the structure
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.size = function() {
  return this._indices.length;
};

/**
 * @param {epiviz.datatypes.GenomicRanges} query
 * @returns {epiviz.datatypes.GenomicRanges.Hits}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.findOverlaps = function(query) {
  /** @type {epiviz.datatypes.GenomicRanges.Hits} */
  var hits = this._innerGenomicRanges.findOverlaps(query);

  // Filter indices not present in the current structure
  // and convert all indices to the new indices mapping
  var queryHits = [];
  var subjectHits = [];

  for (var i = 0; i < hits.size(); ++i) {
    if (hits.subject()[i] in this._indicesMap) {
      subjectHits.push(this._indicesMap[hits.subject()[i]]);
      queryHits.push(hits.query()[i]);
    }
  }

  return new epiviz.datatypes.GenomicRanges.Hits(queryHits, subjectHits);
};

/**
 *
 * @param query
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.subsetByOverlaps = function(query) {
  return new epiviz.datatypes.GenomicRanges.Subset(this, this.findOverlaps(query).subject());
};

/**
 * @returns {Array.<string>} the names of the value columns associated with the GenomicRanges instance
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.valueColumns = function() {
  return this._innerGenomicRanges.valueColumns();
};

/**
 * @param {number} index
 * @returns {string}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.id = function(index) {
  return this._innerGenomicRanges.id(this._indices[index]);
};

/**
 *
 * @param {number} index
 * @returns {epiviz.datatypes.SeqInfo}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.seqinfo = function(index) {
  return this._innerGenomicRanges.seqinfo(this._indices[index]);
};

/**
 * @param {number} index
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.start = function(index) {
  return this._innerGenomicRanges.start(this._indices[index]);
};

/**
 * @param {number} index
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.end = function(index) {
  return this._innerGenomicRanges.end(this._indices[index]);
};

/**
 * @param {number} index
 * @returns {string}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.strand = function(index) {
  return this._innerGenomicRanges.strand(this._indices[index]);
};

/**
 * @param {string} column
 * @param {number} index
 * @returns {*}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.value = function(column, index) {
  return this._innerGenomicRanges.value(column, this._indices[index]);
};

/**
 * @returns {Array.<string>}
 */
epiviz.datatypes.GenomicRanges.Subset.prototype.levels = function() {
  return this._innerGenomicRanges.levels();
};



goog.provide('epiviz.datatypes.GenomicRanges.Row');

/**
 *
 * @param {epiviz.datatypes.GenomicRanges} parent
 * @param {number} index
 *
 * @constructor
 * @extends {goog.structs.IntervalTree.Interval}
 */
epiviz.datatypes.GenomicRanges.Row = function(parent, index) {

  // Call superclass constructor
  goog.structs.IntervalTree.Interval.call(this);

  /**
   * @type {number}
   * @private
   */
  this._index = index;

  /**
   * @type {epiviz.datatypes.GenomicRanges}
   * @private
   */
  this._parent = parent;
};

/**
 * Copy methods from upper class
 */
epiviz.datatypes.GenomicRanges.Row.prototype = epiviz.utils.mapCopy(goog.structs.IntervalTree.Interval.prototype);
epiviz.datatypes.GenomicRanges.Row.constructor = epiviz.datatypes.GenomicRanges.Row;


/**
 * @returns {epiviz.datatypes.GenomicRanges}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.parent = function() {
  return this._parent;
};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.id = function() {
  return this._parent.id(this._index);
};

/**
 * @returns {epiviz.datatypes.SeqInfo}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.seqinfo = function() {
  return this._parent.seqinfo(this._index);
};

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.start = function() {
  return this._parent.start(this._index);
};

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.end = function() {
  return this._parent.end(this._index);
};

/**
 * @param {epiviz.datatypes.GenomicRanges.Row} other
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.compareTo = function(other) {
  var result = goog.structs.IntervalTree.Interval.prototype.compareTo.call(this, other);
  if (result != 0) { return result; }

  if (this.strand() != other.strand()) {
    if (this.strand() == null) { return -1; }
    if (other.strand() == null) { return 1; }
    return (this.strand() < other.strand()) ? -1 : 1;
  }

  if (this.id() == other.id()) { return 0; }
  if (this.id() == null) { return -1; }
  if (other.id() == null) { return 1; }

  return (this.id() < other.id()) ? -1 : 1;
};

/**
 * @returns {string}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.strand = function() {
  return this._parent.strand(this._index);
};

/**
 * @param {string} column
 * @returns {*} a key-value map of column names and values
 */
epiviz.datatypes.GenomicRanges.Row.prototype.value = function(column) {
  return this._parent.value(column, this._index);
};

/**
 * @returns {number}
 */
epiviz.datatypes.GenomicRanges.Row.prototype.index = function() {
  return this._index;
};



goog.provide('epiviz.datatypes.GenomicRanges.Hits');

/**
 * Overlap hits resulted from a findOverlaps operation over two GenomicRanges instances
 * @param {Array.<number>} query The hit indices in the query GenomicRanges
 * @param {Array.<number>} subject The hit indices in the subject GenomicRanges
 * @constructor
 */
epiviz.datatypes.GenomicRanges.Hits = function(query, subject) {
  /**
   * @type {Array.<number>}
   * @private
   */
  this._query = query;

  /**
   * @type {Array.<number>}
   * @private
   */
  this._subject = subject;
};

/**
 * The hit indices in the query GenomicRanges
 * @returns {Array.<number>}
 */
epiviz.datatypes.GenomicRanges.Hits.prototype.query = function() {
  return this._query;
};

/**
 * The hit indices in the subject GenomicRanges
 * @returns {Array.<number>}
 */
epiviz.datatypes.GenomicRanges.Hits.prototype.subject = function() {
  return this._subject;
};

/**
 * @returns {Number}
 */
epiviz.datatypes.GenomicRanges.Hits.prototype.size = function() {
  return this._subject.length;
};
