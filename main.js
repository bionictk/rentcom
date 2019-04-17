var map;
// animations!!! https://github.com/daneden/animate.css?files=1

function initMap() {
    map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 12,
        center: new google.maps.LatLng(40.74415, -73.94884),
        // mapTypeId: google.maps.MapTypeId.TERRAIN
        gestureHandling: 'greedy',
        streetViewControl: false,
        fullscreenControl: false,
        styles: [{
                "featureType": "administrative.land_parcel",
                "elementType": "labels",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "poi.business",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text",
                "stylers": [{
                    "visibility": "off"
                }]
            },
            {
                "featureType": "road.local",
                "elementType": "labels",
                "stylers": [{
                    "visibility": "off"
                }]
            }
        ]
    });

    var url = "rental_coords_small_mod.csv"
    // var url = "rental_coords_large.csv"

    // d3.json(jsonFile)
    d3.csv(url, d => {
        // console.log(d);
        return {
            id: +d.id,
            latitude: +d.long,
            longitude: +d.lat
        };
    }).then(data => {
        data = data.slice(0, 100)
        var overlay = new google.maps.OverlayView();

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function () {
            var layer = d3.select(this.getPanes().floatPane).append("div")
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
                var circle = marker.append("circle")
                    .attr("r", 10)
                    .attr("cx", padding)
                    .attr("cy", padding);

                var onClick = (d) => {
                    d3.event.stopPropagation();
                    d3.select("#hovercard").style("visibility", "visible");
                    d3.select("#hovercard").classed("fadeOutRight", false);
                    d3.select("#hovercard").classed("fadeInRight", true);

                    console.log(d.value.id)
                };
                var onHover = (d) => {};

                circle.on("click", onClick);
                circle.on("mouseover", onHover);

                marker.append("text")
                    .attr("x", padding - 5)
                    .attr("y", padding)
                    // .attr("dy", ".31em")
                    .text(function (d) {
                        return "test";
                    })
                    .style("pointer-events", "none");

                function transform(d) {
                    // console.log(d);
                    d = d.value;
                    d = new google.maps.LatLng(d.latitude, d.longitude);
                    d = projection.fromLatLngToDivPixel(d);

                    return d3.select(this)
                        .style("left", (d.x - padding) + "px")
                        .style("top", (d.y - padding) + "px")
                }
            };
        };

        map.addListener('click', () => {
            d3.select("#hovercard").classed("fadeOutRight", true);
            d3.select("#hovercard").classed("fadeInRight", false);
        });
        // Bind our overlay to the map…
        overlay.setMap(map);
    })
}

function loadImages(id) {
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