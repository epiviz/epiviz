(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ramda'), require('@davidisaaclee/bst')) :
	typeof define === 'function' && define.amd ? define(['exports', 'ramda', '@davidisaaclee/bst'], factory) :
	(factory((global.IntervalTree = {}),global.R,global.BST));
}(this, (function (exports,R,bst) { 'use strict';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var leftChild = R.lensProp('left'); // rightChild :: Lens IntervalTree IntervalTree

var rightChild = R.lensProp('right'); // item :: Lens IntervalTree Item

var item = R.lensPath(['data', 'item']); // itemID :: Lens IntervalTree ItemID

var itemID = R.compose(item, R.lensProp('id')); // range :: Lens IntervalTree Range

var range = R.compose(item, R.lensProp('range')); // highestEndpointInSubtree :: Lens IntervalTree Index

var highestEndpointInSubtree = R.lensPath(['data', 'highestEndpointInSubtree']); // lowestEndpointInSubtree :: Lens IntervalTree Index

var lowestEndpointInSubtree = R.lensPath(['data', 'lowestEndpointInSubtree']);

var printInterval = function printInterval(interval) {
  return interval == null ? "(empty)" : "((".concat(interval.range.low, ", ").concat(interval.range.high, "), ").concat(interval.id, ")");
};

var messages = {
  negativeLengthInterval: function negativeLengthInterval(interval) {
    return "`high` of interval range must be greater than or equal to `low`:\n\t\t".concat(printInterval(interval));
  },
  wrongLowestEndpointStored: function wrongLowestEndpointStored(expected, node) {
    return "Wrong lowest endpoint stored on node.\n\tExpected: ".concat(expected, "\n\tActual: ").concat(R.view(lowestEndpointInSubtree, node));
  },
  wrongHighestEndpointStored: function wrongHighestEndpointStored(expected, node) {
    return "Wrong highest endpoint stored on node.\n\tExpected: ".concat(expected, "\n\tActual: ").concat(R.view(highestEndpointInSubtree, node));
  }
};

var BST = bst.instantiate({
  shouldBeLeftChild: function shouldBeLeftChild(parentData, childData) {
    return parentData.item.range.low > childData.item.range.low;
  }
}); // Index:: number
// #public
// #typealias
// The type of the bounds of the intervals in an interval tree.
// ItemID:: string
// #public
// #typealias
// A unique ID for an item contained in an interval tree.
// Range:: { low: Index, high: Index }
// #public
// #typealias
// A range of numbers specified by an upper and lower bound.
// Item:: { id: ItemID, range: Range }
// #public
// #typealias
// An item contained in an interval tree.
// IntervalTree:: BST<{ item: Item, highestEndpointInSubtree: Index, lowestEndpointInSubtree: Index }>
// #public
// #typealias
// An augmented interval tree node.
// -- Construction
// empty:: IntervalTree
// #public
// An empty interval tree.

var empty = BST.empty; // Creates a BST.Data object for the specified IntervalTree item.
// Checks for valid range.

var dataForItem = function dataForItem(item$$1) {
  var lowestEndpointInSubtree$$1 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : item$$1.range.low;
  var highestEndpointInSubtree$$1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : item$$1.range.high;

  if (item$$1.range.high < item$$1.range.low) {
    throw new Error(messages.negativeLengthInterval(item$$1));
  }

  return {
    item: item$$1,
    lowestEndpointInSubtree: lowestEndpointInSubtree$$1,
    highestEndpointInSubtree: highestEndpointInSubtree$$1
  };
}; // node:: (Item, IntervalTree, IntervalTree, ?Index, ?Index) -> IntervalTree
// Create a node with a value.


var node = function node(item$$1) {
  var left = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var right = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var lowestEndpointInSubtree$$1 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : item$$1.range.low;
  var highestEndpointInSubtree$$1 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : item$$1.range.high;
  return BST.node(dataForItem(item$$1, lowestEndpointInSubtree$$1, highestEndpointInSubtree$$1), left, right);
}; // -- Mutators
// insert:: (Item) -> (IntervalTree) -> IntervalTree
// #public
// Insert an item into a tree. Does not rebalance the tree.


var insert = R.curry(function (item$$1, tree) {
  return R.pipe(BST.insert, updateExtrema)(dataForItem(item$$1), tree);
}); // remove:: (ItemID) -> (IntervalTree) -> IntervalTree
// #public
// Returns a tree without the item with the specified item ID.
// If multiple items have the same item ID, behavior is undefined.

var remove = R.curry(function (itemID$$1, tree) {
  return R.pipe(BST.remove(function (data) {
    return data.item.id === itemID$$1;
  }), updateExtrema)(tree);
}); // -- Accessors
// isEmpty:: (IntervalTree) -> bool
// #public
// Checks if a specified interval tree is empty.

var isEmpty = BST.isEmpty; // toObject:: (IntervalTree) -> map<ItemID, Item>
// #public
// Lists all intervals in an interval tree in a map from item ID to item.

var toObject = R.pipe(BST.toObject(function (data) {
  return data.item.id;
}), R.map(function (data) {
  return data.item;
})); // queryIntersection:: (Range) -> (IntervalTree) -> map<ItemID, Item>
// #public
// Checks for intersections within the specified range.
// Includes intersections with endpoints of the query range.

function _queryIntersection(range$$1, tree) {
  if (isEmpty(tree)) {
    return {};
  }

  if (rangesIntersect(range$$1, R.view(range, tree))) {
    return R.mergeAll([_defineProperty({}, R.view(itemID, tree), R.view(item, tree)), queryIntersection(range$$1, tree.left), queryIntersection(range$$1, tree.right)]);
  } else if (isEmpty(tree.left)) {
    return queryIntersection(range$$1, R.view(rightChild, tree));
  } else if (R.view(R.compose(leftChild, highestEndpointInSubtree), tree) < range$$1.low) {
    return queryIntersection(range$$1, R.view(rightChild, tree));
  } else if (R.view(R.compose(rightChild, lowestEndpointInSubtree), tree) > range$$1.high) {
    return queryIntersection(range$$1, R.view(leftChild, tree));
  } else {
    return R.merge(queryIntersection(range$$1, R.view(leftChild, tree)), queryIntersection(range$$1, R.view(rightChild, tree)));
  }
}

var queryIntersection = R.curry(_queryIntersection); // validate:: (IntervalTree) -> IntervalTree
// #public
// Checks that the provided tree is a valid `IntervalTree`.
// Throws an error if the tree is invalid.
// Returns the original tree if valid.

function validate(tree) {
  return R.compose(BST.validate, validateIntervalTree)(tree);

  function validateIntervalTree(tree) {
    if (isEmpty(tree)) {
      return tree;
    }

    var range$$1 = R.view(range, tree);

    if (range$$1.low > range$$1.high) {
      throw new Error(error.messages.negativeLengthInterval(R.view(item, tree)));
    }

    var lowestEndpoint = range$$1.low;
    var highestEndpoint = range$$1.high; // Validate children.

    [tree.left, tree.right].forEach(function (child) {
      if (!isEmpty(child)) {
        validateIntervalTree(child);
        lowestEndpoint = Math.min(R.view(lowestEndpointInSubtree, child), lowestEndpoint);
        highestEndpoint = Math.max(R.view(highestEndpointInSubtree, child), highestEndpoint);
      }
    });

    if (lowestEndpoint != R.view(lowestEndpointInSubtree, tree)) {
      throw new Error(messages.wrongLowestEndpointStored(lowestEndpoint, tree));
    }

    if (highestEndpoint != R.view(highestEndpointInSubtree, tree)) {
      throw new Error(messages.wrongHighestEndpointStored(highestEndpoint, tree));
    }

    return tree;
  }
} // -- Private helpers
// rangesIntersect:: (Range) -> (Range) -> Bool
// Checks if two ranges intersect, including their endpoints.


var rangesIntersect = R.curry(function (a, b) {
  return a.high >= b.low && a.low <= b.high;
}); // updateExtrema:: (IntervalTree) -> IntervalTree
// Marks the specified node with its descendents' highest and lowest endpoints.

var updateExtrema = R.pipe(updateHighestEndpointInTree, updateLowestEndpointInTree); // updateHighestEndpointInTree:: (IntervalTree) -> IntervalTree
// Updates the specified node's `highestEndpointInSubtree` property.

function updateHighestEndpointInTree(tree) {
  if (isEmpty(tree)) {
    return tree;
  }

  var updateChildren = R.pipe(R.over(leftChild, updateHighestEndpointInTree), R.over(rightChild, updateHighestEndpointInTree));
  var highestEndpoint = R.converge(Math.max, [R.view(R.compose(range, R.lensProp('high'))), R.pipe(R.view(R.compose(leftChild, highestEndpointInSubtree)), R.defaultTo(-Infinity)), R.pipe(R.view(R.compose(rightChild, highestEndpointInSubtree)), R.defaultTo(-Infinity))]);
  return R.pipe(updateChildren, R.converge(R.set(highestEndpointInSubtree), [highestEndpoint, R.identity]))(tree);
} // updateLowestEndpointInTree:: (IntervalTree) -> IntervalTree
// Updates the specified node's `lowestEndpointInSubtree` property.


function updateLowestEndpointInTree(tree) {
  if (isEmpty(tree)) {
    return tree;
  }

  var updateChildren = R.pipe(R.over(leftChild, updateLowestEndpointInTree), R.over(rightChild, updateLowestEndpointInTree));
  var lowestEndpoint = R.converge(Math.min, [R.view(R.compose(range, R.lensProp('low'))), R.pipe(R.view(R.compose(leftChild, lowestEndpointInSubtree)), R.defaultTo(Infinity)), R.pipe(R.view(R.compose(rightChild, lowestEndpointInSubtree)), R.defaultTo(Infinity))]);
  return R.pipe(updateChildren, R.converge(R.set(lowestEndpointInSubtree), [lowestEndpoint, R.identity]))(tree);
}

exports.empty = empty;
exports.node = node;
exports.insert = insert;
exports.remove = remove;
exports.isEmpty = isEmpty;
exports.toObject = toObject;
exports.queryIntersection = queryIntersection;
exports.validate = validate;

Object.defineProperty(exports, '__esModule', { value: true });

})));
