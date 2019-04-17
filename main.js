var map;
// animations!!! https://github.com/daneden/animate.css?files=1

function initMap() {
    map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 12,
        center: new google.maps.LatLng(40.74415, -73.94884),
        // mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    var url = "rental_coords_small_mod.csv"
    // var url = "rental_coords_large.csv"

    d3.csv(url, function (err, data) {
        data = data.slice(0, 100)
        var overlay = new google.maps.OverlayView();

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function () {
            var layer = d3.select(this.getPanes().overlayLayer).append("div")
                .attr("class", "places");

            // Draw each marker as a separate SVG element.
            // We could use a single SVG, but what size would it have?
            overlay.draw = function () {
                var projection = this.getProjection(),
                    padding = 10;

                var marker = layer.selectAll("svg")
                    .data(d3.entries(data))
                    .each(transform) // update existing markers
                    .enter().append("svg")
                    .each(transform)
                    .attr("class", "marker");

                // Add a circle.
                marker.append("circle")
                    .attr("r", 6)
                    .attr("cx", padding)
                    .attr("cy", padding);

                // Add a label.
                // marker.append("text")
                //     .attr("x", padding + 7)
                //     .attr("y", padding)
                //     .attr("dy", ".31em")
                //     .text(function (d) {
                //         return "test";
                //     });

                function transform(d) {
                    // console.log(+d.value.lat);
                    d = new google.maps.LatLng(+d.value.long, +d.value.lat);
                    d = projection.fromLatLngToDivPixel(d);
                    // console.log(d);
                    return d3.select(this)
                        .style("left", (d.x - padding) + "px")
                        .style("top", (d.y - padding) + "px")
                    // .style("width", "60px");
                }
            };
        };

        // Bind our overlay to the map…
        overlay.setMap(map);
    })
}

function loadImages() {
    var homeID = Math.random() * 33 | 0;

    var loadImgs = new Promise((resolve, reject) => {
        var bCheckEnabled = true;
        var bFinishCheck = false;

        var img;
        var images = [];
        var i = 0;

        var myInterval = setInterval(loadImage, 1);

        function loadImage() {
            if (bFinishCheck) {
                clearInterval(myInterval);
                resolve(images);
            }

            if (bCheckEnabled) {
                bCheckEnabled = false;

                img = new Image();
                img.onload = _ => {
                    images.push(img);
                    i++;
                    bCheckEnabled = true;
                };
                img.onerror = _ => bFinishCheck = true;
                img.src = 'rent_imgs/home' + homeID + "/img" + i + '.jpg';
            }
        }
    }).then(images => {
        var image_parent = d3.select("#home_images");
        image_parent.selectAll("div.carousel-item")
            .data(images)
            .enter()
            .append("div").classed("carousel-item", true)
            .append("img").classed("d-block w-100", true)
            .attr("src", (d, i) => "rent_imgs/home" + homeID + "/img" + i + ".jpg")
            .style("height", "300px");

        image_parent.select(".carousel-item").classed("active", true);

        var indc_parent = d3.select("#home_image_indicators");
        indc_parent.selectAll("li")
            .data(images)
            .enter()
            .append("li")
            .attr("data-target", "#carouselExampleIndicators")
            .attr("data-slide-to", (d, i) => i);

        indc_parent.select("li").classed("active", true);
    });
}