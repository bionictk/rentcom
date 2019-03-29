mapboxgl.accessToken =
    'pk.eyJ1IjoiYmlvbmljdGsiLCJhIjoiY2puYXFmOWo2MDAwNjNwdDZxcWpjMWVyeCJ9.dOLJRxC_rZHsoRuPLHwPWA';

var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/dark-v9', //stylesheet location
    center: [-74.00884, 40.74415], // starting position
    zoom: 12 // starting zoom
});

map.addControl(new mapboxgl.FullscreenControl());
// map.scrollZoom.disable()

// Setup our svg layer that we can manipulate with d3
var container = map.getCanvasContainer()
var svg = d3.select(container).append("svg")

// we calculate the scale given mapbox state (derived from viewport-mercator-project's code)
// to define a d3 projection
function getD3() {
    var bbox = document.body.getBoundingClientRect();
    var center = map.getCenter();
    var zoom = map.getZoom();
    // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
    var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);

    var d3projection = d3.geo.mercator()
        .center([center.lng, center.lat])
        .translate([bbox.width / 2, bbox.height / 2])
        .scale(scale);

    return d3projection;
}
// calculate the original d3 projection
var d3Projection = getD3();

var path = d3.geo.path()

var url = "rental_coords_small_mod.csv"
// var url = "rental_coords_small.csv"
// d3.json(url, function (err, data) {
d3.csv(url, function (err, data) {
    var dots = svg.selectAll("circle.dot")
        .data(data)

    dots.enter().append("circle").classed("dot", true)
        .attr("r", 1)
        .style({
            // fill: "#0082a3",
        })
        // .transition().duration(1000)
        .attr("r", 3)

    function render() {
        d3Projection = getD3();
        path.projection(d3Projection)

        dots
            .attr({
                cx: function (d) {
                    var t = [+d.lat, +d.long];
                    var x = d3Projection(t)[0];
                    return x
                },
                cy: function (d) {
                    var t = [+d.lat, +d.long];
                    var y = d3Projection(t)[1];
                    return y
                },
            })
    }

    // re-render our visualization whenever the view changes
    map.on("viewreset", function () {
        render()
    })
    map.on("move", function () {
        render()
    })

    // render our initial visualization
    render()
})