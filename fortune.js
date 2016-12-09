// https://www.tutorialspoint.com/webgl/webgl_drawing_points.htm

/*================Creating a canvas=================*/
var canvas = document.getElementById('my_Canvas');
var gl = canvas.getContext("experimental-webgl")

/*==========Defining and storing the geometry=======*/
var points = 0;
var site_events = new Array();
var voronoi_lines = new Array();
var num_voronoi_lines = 0;
var site_complete = [];
var parabola_lines = 0;
var vertices = [-1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0];
var colors = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
];
var Q = Array(), current_event;
var processed_sites = [];
var parabola_intervals = [];
var interval_sites = [];
var beachline = new BinarySearchTree();
// var beachline = new Array();

/*
 * From: http://www.dreamincode.net/forums/topic/355940-i-need-to-delete-min-and-max-values-from-array/
 */

Array.prototype.removeMin = function() {
    var p = 0,  min = this[p], arr = [];
    for (var i=0; i<this.length; i++) { arr.push(this[i]);
        if (this[i] < min) { p = i; min = this[i]; }
    }
    this.splice(p,1);
    return min;
};

/*
 * From: https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample3/webgl-demo.js
 */
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);

    // Didn't find an element with the specified ID; abort.

    if (!shaderScript) {
        return null;
    }

    // Walk through the source element's children, building the
    // shader source string.

    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while(currentChild) {
        if (currentChild.nodeType == 3) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    // Now figure out what type of shader script we have,
    // based on its MIME type.

    var shader;

    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;  // Unknown shader type
    }

    // Send the source to the shader object

    gl.shaderSource(shader, theSource);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function render() {


    // Create an empty buffer object to store the vertex buffer
    var vertex_buffer = gl.createBuffer();

    //  Color Buffer
    var colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    //Bind appropriate array buffer to it
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Pass the vertex data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Unbind the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);


    /*=========================Shaders========================*/
    var shaderProgram = gl.createProgram();

    var vertShader = getShader(gl, "shader-vs");
    var fragShader = getShader(gl, "shader-fs");

    // Attach a vertex shader
    gl.attachShader(shaderProgram, vertShader);

    // Attach a fragment shader
    gl.attachShader(shaderProgram, fragShader);

    // Link both programs
    gl.linkProgram(shaderProgram);

    // Use the combined shader program object
    gl.useProgram(shaderProgram);

    /*======== Associating shaders to buffer objects ========*/

    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Get the attribute location
    var coord = gl.getAttribLocation(shaderProgram, "coordinates");

    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

    // Enable the attribute
    gl.enableVertexAttribArray(coord);

    var vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
    /*============= Drawing the primitive ===============*/

    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.9);

    // Enable the depth test
    gl.enable(gl.DEPTH_TEST);

    // Clear the color buffer bit
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set the view port
    gl.viewport(0,0,canvas.width,canvas.height);

    // Draw the beachline
    gl.drawArrays(gl.LINES, 0, 2);

    // Draw the points
    gl.drawArrays(gl.POINTS, 2, points);

    // Draw the parabolas/voronoi lines
    gl.drawArrays(gl.LINES, points + 2, parabola_lines + num_voronoi_lines);
}

// (m, n): minimum (x, y)
// (focus_x, focus_y): focus of parabola
function draw_parabola(parabola) {
    if (parabola[4] <= parabola[3] || parabola[0] === 0.0){
        return;
    }
    var m = parabola[1];
    var n = parabola[2];
    var a = parabola[0];
    var dY = 0.002;
    var y = n;
    var neg_Y = n;

    while (a * Math.pow(y - n, 2) + m > -1.0) {
        if (y + dY < parabola[4] && y > parabola[3]) {
            vertices = vertices.concat([a * Math.pow(y - n,  2) + m, y, 0.0]);
            vertices = vertices.concat([a * Math.pow(y + dY - n,  2) + m, y + dY, 0.0]);
            colors = colors.concat([0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0]);
            parabola_lines += 2;
        }
        if (neg_Y - dY > parabola[3] && neg_Y < parabola[4]) {
            vertices = vertices.concat([a * Math.pow(y - n, 2) + m, neg_Y, 0.0]);
            vertices = vertices.concat([a * Math.pow(y + dY - n,  2) + m, neg_Y - dY, 0.0]);
            colors = colors.concat([0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0]);
            parabola_lines += 2;
        }
        y += dY;
        neg_Y -= dY;
    }
}

function calculate_parabola(focus_x, focus_y, beachX) {
    var m = (beachX + focus_x) / 2;
    var n = focus_y;
    var a = (focus_x - m)/(Math.pow(beachX - focus_x, 2));
    return [a, m, n, -1.0, 1.0];
}

function drawLine(x1, y1, x2, y2) {
    vertices = vertices.concat([x1, y1, 0.0, x2, y2, 0.0]);
    colors = colors.concat([1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0]);
    num_voronoi_lines += 1;
}

function calculate_intersection(parabola_1, parabola_2) {
    var upper_parabola, lower_parabola;
    if (parabola_1[2] > parabola_2[2]) {
        upper_parabola = parabola_1;
        lower_parabola = parabola_2
    } else {
        upper_parabola = parabola_2;
        lower_parabola = parabola_1;
    }
    var a_1 = upper_parabola[0], a_2 = lower_parabola[0];
    var m_1 = upper_parabola[1], m_2 = lower_parabola[1];
    var n_1 = upper_parabola[2], n_2 = lower_parabola[2];
    var a = a_1 - a_2, b = 2 * n_2 * a_2 - 2 * n_1 * a_1, c = m_1 - m_2 - a_2 * Math.pow(n_2, 2) + a_1 * Math.pow(n_1, 2);
    var discriminant = Math.pow(b, 2) - 4 * a * c;
    if (discriminant < 0) {
        return [parabola_1, parabola_2];
    }
    var roots = [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
    var min_root = Math.min(roots[0], roots[1]);
    var max_root = Math.max(roots[0], roots[1]);
    if (a_1 > a_2) {
        // upper_parabola[3] = Math.max(upper_parabola[3], max_root);
        // lower_parabola[4] = Math.min(lower_parabola[4], max_root);
        // if (Math.abs(upper_parabola[3] - lower_parabola[4]) < 0.001)
        //     add_voronoi_point(Math.min(i, j), Math.max(i, j), a_1 * Math.pow(max_root - n_1, 2) + m_1, max_root);
    }
    else {
        // upper_parabola[3] = Math.max(upper_parabola[3], min_root);
        // lower_parabola[4] = Math.min(lower_parabola[4], min_root);
        // if (Math.abs(upper_parabola[3] - lower_parabola[4]) < 0.001)
        //     add_voronoi_point(Math.min(i, j), Math.max(i, j), a_1 * Math.pow(min_root - n_1, 2) + m_1, min_root);
    }
    if (parabola_1[2] > parabola_2[2]) {
        return [upper_parabola, lower_parabola, min_root, max_root,
                upper_parabola[0] * Math.pow(min_root - upper_parabola[2], 2) + upper_parabola[1],
                upper_parabola[0] * Math.pow(max_root - upper_parabola[2], 2) + upper_parabola[1]];
    }
    return [lower_parabola, upper_parabola, min_root, max_root,
            upper_parabola[0] * Math.pow(min_root - upper_parabola[2], 2) + upper_parabola[1],
            upper_parabola[0] * Math.pow(max_root - upper_parabola[2], 2) + upper_parabola[1]];
}

function draw_voronoi_line(line) {
    vertices = vertices.concat([line[0], line[1], 0.0]);
    vertices = vertices.concat([line[2], line[3], 0.0]);
    colors = colors.concat([1.0, 0.647, 0.0, 1.0, 1.0, 0.647, 0.0, 1.0]);
    num_voronoi_lines += 1;
}

var begin_button = document.getElementById("begin");
begin_button.addEventListener('click', function(event) {
    for (var i = 0; i < site_events.length; i++) {
        Q.push(site_events[i]);
    }
    Q.sort(function (a, b) {
        return b[0] - a[0];
    });
});

var next_event_button = document.getElementById("nextEvent");
next_event_button.addEventListener('click', function (event) {
    vertices.splice(3 * (points + 2), vertices.length - 3 * (points + 2));
    colors.splice(4 * (points + 2), colors.length - 4 * (points + 2));
    if (current_event && current_event[2] === 0.0)  processed_sites.push(current_event);
    current_event = Q.pop();
    if (!current_event) {
        vertices[0] = 1.0;
        vertices[3] = 1.0;
    } else {
        vertices[0] = current_event[0];
        vertices[3] = current_event[0];

        if (current_event[2] === 0.0) {
            drawLine(current_event[0], current_event[1], -1.0, current_event[1]);
        }
    }
    var parabolas = Array();
    num_voronoi_lines = 0;
    parabola_lines = 0;
    for (var i = 0; i < processed_sites.length; i++) {
        // if (site_complete[i]) parabolas.push([]);
        // else {
            var new_parabola = calculate_parabola(processed_sites[i][0], processed_sites[i][1], vertices[0]);
            parabolas.push(new_parabola);
            beachline.updateParabola(i, new_parabola);
       // }
    }
    beachline.updateIntersections(parabolas);

    if (current_event && current_event[2] === 0.0) {
        beachline.site_split(current_event[1], processed_sites.length);
        parabolas.push([0, current_event[0], current_event[1], current_event[1], current_event[1]]);
    }
    var counter = 0;
    var end = parabolas.length + 10 * current_event[2];
    // for (var i = 0; i < end; i++) {
    //     for (var j = i + 1; j < end; j++) {
    //         if (i != j && !site_complete[i] && !site_complete[j]) {
    //             var return_val = calculate_intersection(parabolas[i], parabolas[j]);
    //
    //             // parabolas[i] -> leftmost.  parabolas[j] -> rightmost
    //             //beachline.updateIntersection(i, j, return_val[2], return_val[4], return_val[3], return_val[5]);
    //             if (i >= 1 && site_complete[i - 1]) {
    //                 if (return_val[4] > return_val[5]) {
    //                     voronoi_lines[counter][2] = return_val[4];
    //                     voronoi_lines[counter][3] = return_val[2];
    //                 } else {
    //                     voronoi_lines[counter][2] = return_val[5];
    //                     voronoi_lines[counter][3] = return_val[3];
    //                 }
    //             } else {
    //                 voronoi_lines[counter] = [return_val[4], return_val[2], return_val[5], return_val[3]];
    //             }
    //         }
    //         counter++;
    //     }
    // }
    // Check for a circle event
    if (current_event && processed_sites.length > 1) {
        if (current_event[2] === 0.0) {
            var last_three_sites = processed_sites.slice(processed_sites - 2);
            last_three_sites.push(current_event);

            // Calculate the line from the last two points
            var parabola_0 = parabolas[parabolas.length - 3];
            var parabola_1 = parabolas[parabolas.length - 2];
            var return_val_0 = calculate_intersection(parabola_0, parabola_1);
            var m_0 = (return_val_0[2] - return_val_0[3]) /
                (( parabola_0[0] * Math.pow(return_val_0[2] - parabola_0[2], 2) + parabola_0[1]) -
                ( parabola_0[0] * Math.pow(return_val_0[3] - parabola_0[2], 2) + parabola_0[1]));
            var x_0 = parabola_0[0] * Math.pow(return_val_0[3] - parabola_0[2], 2) + parabola_0[1];
            var y_0 = return_val_0[3];
            // Calculate the line between the current event and the last event
            var m_1 = (last_three_sites[1][0] - last_three_sites[2][0]) / (last_three_sites[2][1] - last_three_sites[1][1]);
            var x_1 = (last_three_sites[1][0] + last_three_sites[2][0]) / 2;
            var y_1 = (last_three_sites[1][1] + last_three_sites[2][1]) / 2;

            // Calculate the intersection between the lines
            var x_int = (y_1 - m_1 * x_1 - y_0 + m_0 * x_0) / (m_0 - m_1);
            var y_int = m_0 * (x_int - x_0) + y_0;

            // Calculate the circle event
            var dist = Math.sqrt(Math.pow(last_three_sites[2][0] - x_int, 2) + Math.pow(last_three_sites[2][1] - y_int, 2));
            var circle_event = [x_int + dist, last_three_sites[2][1], -0.1, [x_int, y_int]];

            Q.push(circle_event);
            vertices.splice(3 * (points + 2), 0, x_int, y_int, 0.0);
            colors.splice(4 * (points + 2), 0, 0.4, 0.4, 0.4, 1.0);
            points++;
            Q.sort(function (a, b) {
                return b[0] - a[0];
            });
        } else {
            beachline.circle_split(current_event[3][1]);
        }
    }
    //beachline.draw_lines();
    for (var i = 0; i < voronoi_lines.length; i++) {
        draw_voronoi_line(voronoi_lines[i]);
    }
    var sub_arcs = beachline.calculate_sub_arcs();
    for (var i = 0; i < sub_arcs.length; i++) {
        draw_parabola(sub_arcs[i]);
    }

    render();
});

canvas.addEventListener('click', function(event) {
    site_events.push([(event.pageX - 8) / 400.0 - 1.0, 1.0 - (event.pageY - 8) / 400.0, 0.0]);
    vertices = vertices.concat([(event.pageX - 8) / 400.0 - 1.0, 1.0 - (event.pageY - 8) / 400.0, 0.0]);
    colors = colors.concat([1.0, 0.843, 0.0, 1.0]);
    site_complete = site_complete.concat([false]);
    points++;
    render();
});

render();