// BST Code modified from https://www.nczonline.net/blog/2009/06/09/computer-science-in-javascript-binary-search-tree-part-1/

function BinarySearchTree() {
    this._root = null;
}

BinarySearchTree.prototype = {
    constructor: BinarySearchTree,

    add:  function(value) {
        //create a new item object, place data in
        var node = {
                type: 'arc',
                a: value[0],
                m: value[1],
                n: value[2],
                min: value[3],
                max: value[4],
                left: null,
                right: null
            },
        current;
        if (this._root === null){
            node.type = 'arc';
            this._root = node;
        } else {
            current = this._root;
            while (true) {
                //if the new value's max is less than this node's min, go left
                if (value[4] <= current.min) {

                    //if there's no left, then the new node belongs there
                    if (current.left === null){
                        current.left = node;
                        break;
                    } else {
                        current = current.left;
                    }
                }

                //if the new value's min is greater than this node's max, go right
                else if (value[3] >= current.max) {

                    // if there's no right, then the new node belongs there
                    if (current.right === null) {
                        current.right = node;
                        break;
                    } else {
                        current = current.right;
                    }
                } else {
                    break;
                }
            }
        }
    },
    remove: function(value) {

    },
    calculate_sub_arcs: function(){
        var sub_arcs = Array();
        function helper(node) {
            if (node) {
                if (node.type == 'point') {
                    helper(node.left);
                    helper(node.right);
                }
                else {
                    sub_arcs.push([node.a, node.m, node.n, node.min, node.max]);
                }
            }
        }
        helper(this._root);
        return sub_arcs;
    },

    // takes in a y-value, and returns the parabola that covers that y-value
    contains: function(value) {
        var current = this._root;
        //make sure there's a node to search
        while(current){
            if (value <= current.max && value >= current.min) {
                return current;
            }
            else if (value < current.min) {
                current = current.left;
            } else {
                current = current.right;
            }
        }
        return [];
    },
    updateParabola: function (_site, parabola) {
        function helper(node) {
            if (node) {
                if (node.type == "arc" && node.site === _site) {
                    node.a = parabola[0];
                    node.m = parabola[1];
                    node.n = parabola[2];
                }
                helper(node.left);
                helper(node.right);
            }
        }
        helper(this._root);

    },
    updateIntersection: function (left_site, right_site, min_y, min_x, max_y, max_x) {
        function helper(node) {
            if (node.type == 'point') {
                if (node.left.type == 'arc') {
                    if (node.left.site === left_site) {
                        node.left.max = min_y;
                        node.x = min_x;
                        node.y = min_y;
                    }
                    else if (node.left.site === right_site) {
                        node.left.min = min_y;
                        node.left.max = max_y;
                    }
                }
                else {
                    helper(node.left);
                }
                if (node.right.type == 'arc') {
                    if (node.right.site === left_site) {
                        node.right.min = max_y;
                        node.x = max_x;
                        node.y = max_y;
                    }
                }
                helper(node.right);
            }
        }
        helper(this._root);
    },
    site_split: function(value, _site) {
        var current = this._root;
        var parent = null;
        var dir = null;

        if (!this._root) {
            this._root = {
                    type: 'arc',
                    a: 0,
                    m: 0,
                    n: 0,
                    min: -1.0,
                    max: 1.0,
                    left: null,
                    right: null,
                    site: _site
            };
        }
        //make sure there's a node to search
        while(current){
            if (value <= current.max && value >= current.min) {

                var left_arc = {
                    type: 'arc',
                    a: current.a,
                    m: current.m,
                    n: current.n,
                    min: current.min,
                    max: value,
                    left: null,
                    right: null,
                    site: current.site
                };
                var right_arc = {
                    type: 'arc',
                    a: current.a,
                    m: current.m,
                    n: current.n,
                    min: value,
                    max: current.max,
                    left: null,
                    right: null,
                    site: current.site
                };
                var new_arc = {
                    type: 'arc',
                    a: 0,
                    m: 0,
                    n: 0,
                    min: value,
                    max: value,
                    left: null,
                    right: null,
                    site: _site
                };
                var max_root = {
                    x: current.a * (Math.pow(value - current.n, 2)) + current.m,
                    y: value,
                    type: 'point',
                    left: new_arc,
                    right: right_arc
                };
                var min_root = {
                    x: current.a * (Math.pow(value - current.n, 2)) + current.m,
                    y: value,
                    type: 'point',
                    left: left_arc,
                    right: max_root
                };

                // Remove the original arc by removing pointers
                if (parent) {
                    if (dir == "right") {
                        parent.right = min_root;
                    }
                    else {
                        parent.left = min_root;
                    }
                } else {
                    this._root = min_root;
                }
                return current;
            }
            else if (value < current.min) {
                parent = current;
                dir = "left";
                current = current.left;
            } else {
                parent = current;
                dir = "right";
                current = current.right;
            }
        }
        return [];
    }
};