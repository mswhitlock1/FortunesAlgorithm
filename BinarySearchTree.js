// BST Code modified from https://www.nczonline.net/blog/2009/06/09/computer-science-in-javascript-binary-search-tree-part-1/

function BinarySearchTree() {
    this._root = null;
}

BinarySearchTree.prototype = {
    constructor: BinarySearchTree,

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
    updateIntersections: function(parabolas) {
        function calc_intersection(par_1, par_2) {
            var a_1 = par_1[0], a_2 = par_2[0];
            var m_1 = par_1[1], m_2 = par_2[1];
            var n_1 = par_1[2], n_2 = par_2[2];

            if (a_1 === 0) return [n_2, n_2];
            else if (a_2 === 0) return [n_1, n_1];

            var a = a_1 - a_2, b = 2 * n_2 * a_2 - 2 * n_1 * a_1, c = m_1 - m_2 - a_2 * Math.pow(n_2, 2) + a_1 * Math.pow(n_1, 2);
            var discriminant = Math.pow(b, 2) - 4 * a * c;
            var roots = [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
            var min_root = Math.min(roots[0], roots[1]);
            var max_root = Math.max(roots[0], roots[1]);
            return [min_root, max_root];
        }
        function search_min(node, _site, min_val) {
            while (node.type != 'arc' && node.site != _site) {
                node = node.left;
            }
            node.min = min_val;
        }
        function search_max(node, _site, max_val) {
            while (node.type != 'arc' && node.site != _site) {
                node = node.right;
            }
            node.max = max_val;
        }
        function helper(node, parent) {
            if (node) {
                if (node.type == 'point') {
                    if (node.min_or_max == 'max')
                        node.y = calc_intersection(parabolas[node.site_1], parabolas[node.site_2])[1];
                    else
                        node.y = calc_intersection(parabolas[node.site_1], parabolas[node.site_2])[0];
                    if (node.left.type == 'arc') {
                        if (node.left.a === 0) node.x = node.left.n;
                        else                   node.x = node.left.a * Math.pow(node.y - node.left.n, 2) + node.left.m;
                    } else if (node.right.type == 'arc') {
                        if (node.right.a === 0) node.x = node.right.n;
                        else                    node.x = node.right.a * Math.pow(node.y - node.right.n, 2) + node.right.m;
                    } else {
                        node.x = node.left.x;
                    }
                }
                else {
                    if (parent) {
                        var intersections = calc_intersection(parabolas[parent.site_1], parabolas[parent.site_2]);
                        if (parent.left === node) {
                            if (parent.min_or_max == 'min') {
                                node.max = intersections[0];
                                search_min(parent.right, parent.site_2, intersections[0]);
                            }
                            else {
                                node.min = intersections[0];
                                node.max = intersections[1];
                            }
                        } else {
                            if (parent.min_or_max = 'max') {
                                node.min = intersections[1];
                                search_max(parent.left, parent.site_1, intersections[1]);
                            }
                            else {
                                node.min = intersections[0];
                                node.max = intersections[1];
                            }
                        }
                    }
                }
                helper(node.left, node);
                helper(node.right, node);
            }
        }
        helper(this._root, null);
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
                    n: value,
                    min: -1.0,
                    max: 1.0,
                    left: null,
                    right: null,
                    site: _site
            };
        }
        //make sure there's a node to search
        while(current){
            if (current.type == 'arc' && value <= current.max && value >= current.min){
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
                    n: value,
                    min: value,
                    max: value,
                    left: null,
                    right: null,
                    site: _site
                };
                var max_root = {
                    x: current.a * (Math.pow(value - current.n, 2)) + current.m,
                    y: value,
                    min_or_max: 'max',
                    site_1: current.site,
                    site_2: _site,
                    type: 'point',
                    left: new_arc,
                    right: right_arc
                };
                var min_root = {
                    x: current.a * (Math.pow(value - current.n, 2)) + current.m,
                    y: value,
                    min_or_max: 'min',
                    site_1: current.site,
                    site_2: _site,
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
            else if ((current.type == 'arc' && value < current.min) || (current.type == 'point' && value < current.y)) {
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
    },
    circle_split: function (y_val) {
        var done = false;
        function helper(node, parent) {
            if (node) {
                helper(node.left, node);
                helper(node.right, node);
                if (done) return;
                if (node.type == 'point' && Math.abs(node.y - y_val) < .00001) {
                    var site_to_cancel = node.site_1;
                    if (node.left.type == 'arc' && node.left.site === site_to_cancel) {
                        if (parent.right === node) parent.right = node.right;
                        else                       parent.left = node.right;
                    } else {
                        if (parent.right === node) parent.right = node.left;
                        else                       parent.left = node.left;
                    }
                    done = true;
                }
            }
        }
        helper(this._root, null);
    },
    draw_lines: function() {
        helper(node
    }
};