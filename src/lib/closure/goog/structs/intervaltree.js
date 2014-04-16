// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Datastructure: IntervalTree.
 *
 *
 * This file provides the implementation of an Interval-Tree datastructure, based on the AVL-Tree.
 * See http://www.cs.toronto.edu/~krueger/cscB63h/lectures/tut06.txt for details on the
 * implementation.
 * The tree maintains a set of unique values in a sorted order. The values can be
 * accessed efficiently in their sorted order since the tree enforces an O(logn)
 * maximum height. See http://en.wikipedia.org/wiki/Avl_tree for more detail.
 *
 * The big-O notation for all operations are below:
 * <pre>
 *   Method                 big-O
 * ----------------------------------------------------------------------------
 * - add                    O(logn)
 * - remove                 O(logn)
 * - clear                  O(1)
 * - contains               O(logn)
 * - getCount               O(1)
 * - getMinimum             O(1), or O(logn) when optional root is specified
 * - getMaximum             O(1), or O(logn) when optional root is specified
 * - getHeight              O(1)
 * - getValues              O(n)
 * - inOrderTraverse        O(logn + k), where k is number of traversed nodes
 * - reverseOrderTraverse   O(logn + k), where k is number of traversed nodes
 * </pre>
 */


goog.provide('goog.structs.IntervalTree');
goog.provide('goog.structs.IntervalTree.Node');
goog.provide('goog.structs.IntervalTree.Interval');

goog.require('goog.structs.Collection');



/**
 * Constructs an Interval-Tree, which uses the specified comparator to order its
 * values. The values can be accessed efficiently in their sorted order since
 * the tree enforces a O(logn) maximum height.
 *
 * @constructor
 * @implements {goog.structs.Collection}
 */
goog.structs.IntervalTree = function() {
  this.comparator_ = goog.structs.IntervalTree.Interval.compare;
};


/**
 * Pointer to the root node of the tree.
 *
 * @type {goog.structs.IntervalTree.Node}
 * @private
 */
goog.structs.IntervalTree.prototype.root_ = null;


/**
 * Comparison function used to compare intervals in the tree. This function
 * takes two values, a and b, and return x where:
 * <pre>
 *  x < 0 if a.start() < b.start() or (a.start() == b.start() and a.end() > b.end()),
 *  x > 0 if a.start() > b.start() or (a.start() == b.start() and a.end() < b.end()),
 *  x = 0 otherwise
 * </pre>
 *
 * @type {Function}
 * @private
 */
goog.structs.IntervalTree.prototype.comparator_ = null;


/**
 * Pointer to the node with the smallest value in the tree.
 *
 * @type {goog.structs.IntervalTree.Node}
 * @private
 */
goog.structs.IntervalTree.prototype.minNode_ = null;


/**
 * Pointer to the node with the largest value in the tree.
 *
 * @type {goog.structs.IntervalTree.Node}
 * @private
 */
goog.structs.IntervalTree.prototype.maxNode_ = null;


/**
 * Inserts a node into the tree with the specified value if the tree does
 * not already contain a node with the specified value. If the value is
 * inserted, the tree is balanced to enforce the AVL-Tree height property.
 *
 * @param {goog.structs.IntervalTree.Interval} value Value to insert into the tree.
 * @return {boolean} Whether value was inserted into the tree.
 * @override
 */
goog.structs.IntervalTree.prototype.add = function(value) {
  // If the tree is empty, create a root node with the specified value
  if (this.root_ == null) {
    this.root_ = new goog.structs.IntervalTree.Node(value, value.end());
    this.minNode_ = this.root_;
    this.maxNode_ = this.root_;
    return true;
  }

  // This will be set to the new node if a new node is added.
  var newNode = null;

  // Depth traverse the tree and insert the value if we reach a null node
  this.traverse_(function(node) {
    var retNode = null;
    if (this.comparator_(node.value, value) > 0) {
      retNode = node.left;
      if (node.left == null) {
        newNode = new goog.structs.IntervalTree.Node(value, value.end(), node);
        node.left = newNode;
        if (node == this.minNode_) {
          this.minNode_ = newNode;
        }
      }
    } else if (this.comparator_(node.value, value) < 0) {
      retNode = node.right;
      if (node.right == null) {
        newNode = new goog.structs.IntervalTree.Node(value, value.end(), node);
        node.right = newNode;
        if (node == this.maxNode_) {
          this.maxNode_ = newNode;
        }
      }
    }
    return retNode; // If null, we'll stop traversing the tree
  });

  // If a node was added, increment counts and balance tree.
  // Also update the maxEndpoint property.
  if (newNode) {
    this.traverse_(
      function(node) {
        node.count++;
        node.updateMaxEndpoint();
        return node.parent;
      },
      newNode.parent);
    this.balance_(newNode.parent); // Maintain the AVL-tree balance
  }

  // Return true if a node was added, false otherwise
  return !!newNode;
};


/**
 * Removes a node from the tree with the specified value if the tree contains a
 * node with this value. If a node is removed the tree is balanced to enforce
 * the AVL-Tree height property. The value of the removed node is returned.
 *
 * @param {*} value Value to find and remove from the tree.
 * @return {*} The value of the removed node or null if the value was not in
 *     the tree.
 * @override
 */
goog.structs.IntervalTree.prototype.remove = function(value) {
  // Assume the value is not removed and set the value when it is removed
  var retValue = null;

  // Depth traverse the tree and remove the value if we find it
  this.traverse_(function(node) {
    var retNode = null;
    if (this.comparator_(node.value, value) > 0) {
      retNode = node.left;
    } else if (this.comparator_(node.value, value) < 0) {
      retNode = node.right;
    } else {
      retValue = node.value;
      this.removeNode_(node);
    }
    return retNode; // If null, we'll stop traversing the tree
  });

  // Return the value that was removed, null if the value was not in the tree
  return retValue;
};


/**
 * Removes all nodes from the tree.
 */
goog.structs.IntervalTree.prototype.clear = function() {
  this.root_ = null;
  this.minNode_ = null;
  this.maxNode_ = null;
};


/**
 * Returns true if the tree contains a node with the specified value, false
 * otherwise.
 *
 * @param {*} value Value to find in the tree.
 * @return {boolean} Whether the tree contains a node with the specified value.
 * @override
 */
goog.structs.IntervalTree.prototype.contains = function(value) {
  // Assume the value is not in the tree and set this value if it is found
  var isContained = false;

  // Depth traverse the tree and set isContained if we find the node
  this.traverse_(function(node) {
    var retNode = null;
    var test = this.comparator_(node.value, value);
    if (test > 0) {
      retNode = node.left;
    } else if (test < 0) {
      retNode = node.right;
    } else {
      isContained = true;
    }
    return retNode; // If null, we'll stop traversing the tree
  });

  // Return true if the value is contained in the tree, false otherwise
  return isContained;
};


/**
 * Returns the number of values stored in the tree.
 *
 * @return {number} The number of values stored in the tree.
 * @override
 */
goog.structs.IntervalTree.prototype.getCount = function() {
  return this.root_ ? this.root_.count : 0;
};

/**
 * Computes all overlaps for the given interval.
 *
 * @param {goog.structs.IntervalTree.Interval} interval
 * @returns {Array.<goog.structs.IntervalTree.Interval>}
 */
goog.structs.IntervalTree.prototype.overlaps = function(interval) {
  return this.overlaps_(this.root_, interval);
};

/**
 * Merges the current tree with the values in the given tree
 *
 * @param {goog.structs.IntervalTree} other
 * @returns {goog.structs.IntervalTree}
 */
goog.structs.IntervalTree.prototype.mergeWith = function(other) {
  var self = this;
  other.inOrderTraverse(function(value) {
    if (!self.contains(value)) {
      self.add(value);
    }
  });

  return this;
};

/**
 * /**
 * @param {goog.structs.IntervalTree.Node} node
 * @param {goog.structs.IntervalTree.Interval} interval
 *
 * @returns {Array.<goog.structs.IntervalTree.Interval>}
 * @private
 */
goog.structs.IntervalTree.prototype.overlaps_ = function(node, interval) {
  // Don't search nodes that don't exist
  if (node == null) { return []; }

  // If interval is to the right of the rightmost point of any interval
  // in this node and all children, there won't be any matches.
  if (interval.start() > node.maxEndpoint) { return []; }

  var result = [];

  // Search left children
  if (node.left != null) {
    result = result.concat(this.overlaps_(node.left, interval));
  }

  // Check this node
  if (node.value.overlapsWith(interval)) {
    result.push(node.value);
  }

  // If interval is to the left of the start of this interval,
  // then it can't overlap with any child to the right.
  if (interval.end() < node.value.start()) {
    return result;
  }

  // Otherwise, search right children
  if (node.right != null) {
    result = result.concat(this.overlaps_(node.right, interval));
  }

  return result;
};

/**
 * Returns a k-th smallest value, based on the comparator, where 0 <= k <
 * this.getCount().
 * @param {number} k The number k.
 * @return {*} The k-th smallest value.
 */
goog.structs.IntervalTree.prototype.getKthValue = function(k) {
  if (k < 0 || k >= this.getCount()) {
    return null;
  }
  return this.getKthNode_(k).value;
};


/**
 * Returns the value u, such that u is contained in the tree and u < v, for all
 * values v in the tree where v != u.
 *
 * @return {*} The minimum value contained in the tree.
 */
goog.structs.IntervalTree.prototype.getMinimum = function() {
  return this.getMinNode_().value;
};


/**
 * Returns the value u, such that u is contained in the tree and u > v, for all
 * values v in the tree where v != u.
 *
 * @return {*} The maximum value contained in the tree.
 */
goog.structs.IntervalTree.prototype.getMaximum = function() {
  return this.getMaxNode_().value;
};


/**
 * Returns the height of the tree (the maximum depth). This height should
 * always be <= 1.4405*(Math.log(n+2)/Math.log(2))-1.3277, where n is the
 * number of nodes in the tree.
 *
 * @return {number} The height of the tree.
 */
goog.structs.IntervalTree.prototype.getHeight = function() {
  return this.root_ ? this.root_.height : 0;
};


/**
 * Inserts the values stored in the tree into a new Array and returns the Array.
 *
 * @return {Array} An array containing all of the trees values in sorted order.
 */
goog.structs.IntervalTree.prototype.getValues = function() {
  var ret = [];
  this.inOrderTraverse(function(value) {
    ret.push(value);
  });
  return ret;
};


/**
 * Performs an in-order traversal of the tree and calls {@code func} with each
 * traversed node, optionally starting from the smallest node with a value >= to
 * the specified start value. The traversal ends after traversing the tree's
 * maximum node or when {@code func} returns a value that evaluates to true.
 *
 * @param {Function} func Function to call on each traversed node.
 * @param {Object=} opt_startValue If specified, traversal will begin on the
 *    node with the smallest value >= opt_startValue.
 */
goog.structs.IntervalTree.prototype.inOrderTraverse =
  function(func, opt_startValue) {
    // If our tree is empty, return immediately
    if (!this.root_) {
      return;
    }

    // Depth traverse the tree to find node to begin in-order traversal from
    var startNode;
    if (opt_startValue) {
      this.traverse_(function(node) {
        var retNode = null;
        if (this.comparator_(node.value, opt_startValue) > 0) {
          retNode = node.left;
          startNode = node;
        } else if (this.comparator_(node.value, opt_startValue) < 0) {
          retNode = node.right;
        } else {
          startNode = node;
        }
        return retNode; // If null, we'll stop traversing the tree
      });
    } else {
      startNode = this.getMinNode_();
    }

    // Traverse the tree and call func on each traversed node's value
    var node = startNode, prev = startNode.left ? startNode.left : startNode;
    while (node != null) {
      if (node.left != null && node.left != prev && node.right != prev) {
        node = node.left;
      } else {
        if (node.right != prev) {
          /*if (func(node.value)) {
            return;
          }*/
          if (func(node)) {
            return;
          }
        }
        var temp = node;
        node = node.right != null && node.right != prev ?
          node.right :
          node.parent;
        prev = temp;
      }
    }
  };


/**
 * Performs a reverse-order traversal of the tree and calls {@code func} with
 * each traversed node, optionally starting from the largest node with a value
 * <= to the specified start value. The traversal ends after traversing the
 * tree's minimum node or when func returns a value that evaluates to true.
 *
 * @param {Function} func Function to call on each traversed node.
 * @param {Object=} opt_startValue If specified, traversal will begin on the
 *    node with the largest value <= opt_startValue.
 */
goog.structs.IntervalTree.prototype.reverseOrderTraverse =
  function(func, opt_startValue) {
    // If our tree is empty, return immediately
    if (!this.root_) {
      return;
    }

    // Depth traverse the tree to find node to begin reverse-order traversal from
    var startNode;
    if (opt_startValue) {
      this.traverse_(goog.bind(function(node) {
        var retNode = null;
        if (this.comparator_(node.value, opt_startValue) > 0) {
          retNode = node.left;
        } else if (this.comparator_(node.value, opt_startValue) < 0) {
          retNode = node.right;
          startNode = node;
        } else {
          startNode = node;
        }
        return retNode; // If null, we'll stop traversing the tree
      }, this));
    } else {
      startNode = this.getMaxNode_();
    }

    // Traverse the tree and call func on each traversed node's value
    var node = startNode, prev = startNode.right ? startNode.right : startNode;
    while (node != null) {
      if (node.right != null && node.right != prev && node.left != prev) {
        node = node.right;
      } else {
        if (node.left != prev) {
          if (func(node.value)) {
            return;
          }
        }
        var temp = node;
        node = node.left != null && node.left != prev ?
          node.left :
          node.parent;
        prev = temp;
      }
    }
  };


/**
 * Performs a traversal defined by the supplied {@code traversalFunc}. The first
 * call to {@code traversalFunc} is passed the root or the optionally specified
 * startNode. After that, calls {@code traversalFunc} with the node returned
 * by the previous call to {@code traversalFunc} until {@code traversalFunc}
 * returns null or the optionally specified endNode. The first call to
 * traversalFunc is passed the root or the optionally specified startNode.
 *
 * @param {Function} traversalFunc Function used to traverse the tree. Takes a
 *     node as a parameter and returns a node.
 * @param {goog.structs.IntervalTree.Node=} opt_startNode The node at which the
 *     traversal begins.
 * @param {goog.structs.IntervalTree.Node=} opt_endNode The node at which the
 *     traversal ends.
 * @private
 */
goog.structs.IntervalTree.prototype.traverse_ =
  function(traversalFunc, opt_startNode, opt_endNode) {
    var node = opt_startNode ? opt_startNode : this.root_;
    var endNode = opt_endNode ? opt_endNode : null;
    while (node && node != endNode) {
      node = traversalFunc.call(this, node);
    }
  };


/**
 * Ensures that the specified node and all its ancestors are balanced. If they
 * are not, performs left and right tree rotations to achieve a balanced
 * tree. This method assumes that at most 2 rotations are necessary to balance
 * the tree (which is true for AVL-trees that are balanced after each node is
 * added or removed).
 *
 * @param {goog.structs.IntervalTree.Node} node Node to begin balance from.
 * @private
 */
goog.structs.IntervalTree.prototype.balance_ = function(node) {

  this.traverse_(function(node) {
    // Calculate the left and right node's heights
    var lh = node.left ? node.left.height : 0;
    var rh = node.right ? node.right.height : 0;

    // Rotate tree rooted at this node if it is not AVL-tree balanced
    if (lh - rh > 1) {
      if (node.left.right && (!node.left.left ||
        node.left.left.height < node.left.right.height)) {
        this.leftRotate_(node.left);
      }
      this.rightRotate_(node);
    } else if (rh - lh > 1) {
      if (node.right.left && (!node.right.right ||
        node.right.right.height < node.right.left.height)) {
        this.rightRotate_(node.right);
      }
      this.leftRotate_(node);
    }

    // Recalculate the left and right node's heights
    lh = node.left ? node.left.height : 0;
    rh = node.right ? node.right.height : 0;

    // Set this node's height
    node.height = Math.max(lh, rh) + 1;

    // Traverse up tree and balance parent
    return node.parent;
  }, node);

};


/**
 * Performs a left tree rotation on the specified node.
 *
 * @param {goog.structs.IntervalTree.Node} node Pivot node to rotate from.
 * @private
 */
goog.structs.IntervalTree.prototype.leftRotate_ = function(node) {
  // Re-assign parent-child references for the parent of the node being removed
  if (node.isLeftChild()) {
    node.parent.left = node.right;
    node.right.parent = node.parent;
  } else if (node.isRightChild()) {
    node.parent.right = node.right;
    node.right.parent = node.parent;
  } else {
    this.root_ = node.right;
    this.root_.parent = null;
  }

  // Re-assign parent-child references for the child of the node being removed
  var temp = node.right;
  node.right = node.right.left;
  if (node.right != null) node.right.parent = node;
  temp.left = node;
  node.parent = temp;

  // Update counts.
  temp.count = node.count;
  node.count -= (temp.right ? temp.right.count : 0) + 1;

  // Recalculate maxEndpoint for node and temp, in this order,
  // since now node is a child of temp
  node.updateMaxEndpoint();
  temp.updateMaxEndpoint();
};


/**
 * Performs a right tree rotation on the specified node.
 *
 * @param {goog.structs.IntervalTree.Node} node Pivot node to rotate from.
 * @private
 */
goog.structs.IntervalTree.prototype.rightRotate_ = function(node) {
  // Re-assign parent-child references for the parent of the node being removed
  if (node.isLeftChild()) {
    node.parent.left = node.left;
    node.left.parent = node.parent;
  } else if (node.isRightChild()) {
    node.parent.right = node.left;
    node.left.parent = node.parent;
  } else {
    this.root_ = node.left;
    this.root_.parent = null;
  }

  // Re-assign parent-child references for the child of the node being removed
  var temp = node.left;
  node.left = node.left.right;
  if (node.left != null) node.left.parent = node;
  temp.right = node;
  node.parent = temp;

  // Update counts.
  temp.count = node.count;
  node.count -= (temp.left ? temp.left.count : 0) + 1;

  // Recalculate maxEndpoint for node and temp, in this order,
  // since now node is a child of temp
  node.updateMaxEndpoint();
  temp.updateMaxEndpoint();
};


/**
 * Removes the specified node from the tree and ensures the tree still
 * maintains the AVL-tree balance.
 *
 * @param {goog.structs.IntervalTree.Node} node The node to be removed.
 * @private
 */
goog.structs.IntervalTree.prototype.removeNode_ = function(node) {
  // Perform normal binary tree node removal, but balance the tree, starting
  // from where we removed the node
  if (node.left != null || node.right != null) {
    var b = null; // Node to begin balance from
    var r;        // Node to replace the node being removed
    var temp;     // The parent of the replace node, where to begin updating maxEndpoint
    if (node.left != null) {
      r = this.getMaxNode_(node.left);
      temp = r.parent;

      // Update counts.
      this.traverse_(function(node) {
        node.count--;
        return node.parent;
      }, r);

      if (r != node.left) {
        r.parent.right = r.left;
        if (r.left) r.left.parent = r.parent;
        r.left = node.left;
        r.left.parent = r;
        b = r.parent;
      }
      r.parent = node.parent;
      r.right = node.right;
      if (r.right) r.right.parent = r;
      if (node == this.maxNode_) this.maxNode_ = r;
      r.count = node.count;
    } else {
      r = this.getMinNode_(node.right);
      temp = r.parent;

      // Update counts.
      this.traverse_(function(node) {
        node.count--;
        return node.parent;
      }, r);

      if (r != node.right) {
        r.parent.left = r.right;
        if (r.right) r.right.parent = r.parent;
        r.right = node.right;
        r.right.parent = r;
        b = r.parent;
      }
      r.parent = node.parent;
      r.left = node.left;
      if (r.left) r.left.parent = r;
      if (node == this.minNode_) this.minNode_ = r;
      r.count = node.count;
    }

    // Update the parent of the node being removed to point to its replace
    if (node.isLeftChild()) {
      node.parent.left = r;
    } else if (node.isRightChild()) {
      node.parent.right = r;
    } else {
      this.root_ = r;
    }

    // Update maxEndpoint for all nodes involved in the change
    if (temp != null) {
      this.traverse_(function(node) {
        node.updateMaxEndpoint();
        return node.parent;
      }, temp);
    }

    // Balance the tree
    this.balance_(b ? b : r);
  } else {
    // Update counts.
    this.traverse_(function(node) {
      node.count--;
      return node.parent;
    }, node.parent);

    var parent = node.parent;

    // If the node is a leaf, remove it and balance starting from its parent
    if (node.isLeftChild()) {
      this.special = 1;
      node.parent.left = null;
      if (node == this.minNode_) this.minNode_ = node.parent;
      this.balance_(node.parent);
    } else if (node.isRightChild()) {
      node.parent.right = null;
      if (node == this.maxNode_) this.maxNode_ = node.parent;
      this.balance_(node.parent);
    } else {
      this.clear();
    }

    if (parent != null) {
      this.traverse_(function(node) {
        node.updateMaxEndpoint();
        return node.parent;
      }, parent);
    }
  }
};


/**
 * Returns the node in the tree that has k nodes before it in an in-order
 * traversal, optionally rooted at {@code opt_rootNode}.
 *
 * @param {number} k The number of nodes before the node to be returned in an
 *     in-order traversal, where 0 <= k < root.count.
 * @param {goog.structs.IntervalTree.Node=} opt_rootNode Optional root node.
 * @return {goog.structs.IntervalTree.Node} The node at the specified index.
 * @private
 */
goog.structs.IntervalTree.prototype.getKthNode_ = function(k, opt_rootNode) {
  var root = opt_rootNode || this.root_;
  var numNodesInLeftSubtree = root.left ? root.left.count : 0;

  if (k < numNodesInLeftSubtree) {
    return this.getKthNode_(k, root.left);
  } else if (k == numNodesInLeftSubtree) {
    return root;
  } else {
    return this.getKthNode_(k - numNodesInLeftSubtree - 1, root.right);
  }
};


/**
 * Returns the node with the smallest value in tree, optionally rooted at
 * {@code opt_rootNode}.
 *
 * @param {goog.structs.IntervalTree.Node=} opt_rootNode Optional root node.
 * @return {goog.structs.IntervalTree.Node} The node with the smallest value in
 *     the tree.
 * @private
 */
goog.structs.IntervalTree.prototype.getMinNode_ = function(opt_rootNode) {
  if (!opt_rootNode) {
    return this.minNode_;
  }

  var minNode = opt_rootNode;
  this.traverse_(function(node) {
    var retNode = null;
    if (node.left) {
      minNode = node.left;
      retNode = node.left;
    }
    return retNode; // If null, we'll stop traversing the tree
  }, opt_rootNode);

  return minNode;
};


/**
 * Returns the node with the largest value in tree, optionally rooted at
 * opt_rootNode.
 *
 * @param {goog.structs.IntervalTree.Node=} opt_rootNode Optional root node.
 * @return {goog.structs.IntervalTree.Node} The node with the largest value in
 *     the tree.
 * @private
 */
goog.structs.IntervalTree.prototype.getMaxNode_ = function(opt_rootNode) {
  if (!opt_rootNode) {
    return this.maxNode_;
  }

  var maxNode = opt_rootNode;
  this.traverse_(function(node) {
    var retNode = null;
    if (node.right) {
      maxNode = node.right;
      retNode = node.right;
    }
    return retNode; // If null, we'll stop traversing the tree
  }, opt_rootNode);

  return maxNode;
};



/**
 * Constructs an Interval-Tree node with the specified value. If no parent is
 * specified, the node's parent is assumed to be null. The node's height
 * defaults to 1 and its children default to null.
 *
 * @param {*} value Value to store in the node.
 * @param {number} max_endpoint the maximum high endpoint of any of the intervals stored in the
 * subtree rooted at this node (including this node).
 * @param {goog.structs.IntervalTree.Node=} opt_parent Optional parent node.
 * @constructor
 */
goog.structs.IntervalTree.Node = function(value, max_endpoint, opt_parent) {
  /**
   * The value stored by the node.
   *
   * @type {*}
   */
  this.value = value;

  /**
   * The node's parent. Null if the node is the root.
   *
   * @type {goog.structs.IntervalTree.Node}
   */
  this.parent = opt_parent ? opt_parent : null;

  /**
   * The number of nodes in the subtree rooted at this node.
   *
   * @type {number}
   */
  this.count = 1;

  /**
   * The maximum high endpoint of any of the intervals stored in the
   * subtree rooted at this node (including this node).
   *
   * @type {number}
   */
  this.maxEndpoint = max_endpoint;
};


/**
 * The node's left child. Null if the node does not have a left child.
 *
 * @type {goog.structs.IntervalTree.Node?}
 */
goog.structs.IntervalTree.Node.prototype.left = null;


/**
 * The node's right child. Null if the node does not have a right child.
 *
 * @type {goog.structs.IntervalTree.Node?}
 */
goog.structs.IntervalTree.Node.prototype.right = null;


/**
 * The height of the tree rooted at this node.
 *
 * @type {number}
 */
goog.structs.IntervalTree.Node.prototype.height = 1;


/**
 * Returns true iff the specified node has a parent and is the right child of
 * its parent.
 *
 * @return {boolean} Whether the specified node has a parent and is the right
 *    child of its parent.
 */
goog.structs.IntervalTree.Node.prototype.isRightChild = function() {
  return !!this.parent && this.parent.right == this;
};

goog.structs.IntervalTree.Node.prototype.updateMaxEndpoint = function() {
  this.maxEndpoint = this.value.end();
  if (this.right && this.right.maxEndpoint > this.maxEndpoint) {
    this.maxEndpoint = this.right.maxEndpoint;
  }
  if (this.left && this.left.maxEndpoint > this.maxEndpoint) {
    this.maxEndpoint = this.left.maxEndpoint;
  }
};

/**
 * Returns true iff the specified node has a parent and is the left child of
 * its parent.
 *
 * @return {boolean} Whether the specified node has a parent and is the left
 *    child of its parent.
 */
goog.structs.IntervalTree.Node.prototype.isLeftChild = function() {
  return !!this.parent && this.parent.left == this;
};

/**
 * An abstract class for intervals used in the interval tree
 */
goog.structs.IntervalTree.Interval = function() {};

/**
 * @returns {number} start position of the interval
 */
goog.structs.IntervalTree.Interval.prototype.start;

/**
 * @returns {number} end position of the interval
 */
goog.structs.IntervalTree.Interval.prototype.end;

/**
 * @param {goog.structs.IntervalTree.Interval} other
 * @returns {boolean}
 */
goog.structs.IntervalTree.Interval.prototype.overlapsWith = function(other) {
  return !(this.start() > other.end() || this.end() < other.start());
};

/**
 * @param {goog.structs.IntervalTree.Interval} other
 * @returns {number}
 */
goog.structs.IntervalTree.Interval.prototype.compareTo = function(other) {
  if (this.start() < other.start()) {
    return -1;
  }

  if (this.start() > other.start()) {
    return 1;
  }

  if (this.end() > other.end()) {
    return -1;
  }

  if (this.end() < other.end()) {
    return 1;
  }

  return 0;
};

/**
 * @param {goog.structs.IntervalTree.Interval} i1
 * @param {goog.structs.IntervalTree.Interval} i2
 * @returns {number}
 */
goog.structs.IntervalTree.Interval.compare = function(i1, i2) {
  return i1.compareTo(i2);
};
