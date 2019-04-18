var startColor = "1fbad6",
    endColor = "#EF3C79";

var clicked = undefined;
var circle;

var map;
var directionsDisplay;
var directionsService;

var workPlace = [40.74415, -73.94884];

function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer({
        preserveViewport: true,
        suppressMarkers: true
    });
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

    var overlay = new google.maps.OverlayView();

    map.addListener('click', (e) => {
        var latlng = e.latLng;
        var lat = latlng.lat();
        var long = latlng.lng();
        console.log(lat, long);
    });


    var url = "rental_coords_small_mod.csv"
    // var url = "rental_coords_large.csv"
    var jsonFile = "sample_data.json";

    // d3.json(jsonFile)
    d3.csv(url, d => {
            // console.log(d);
            return {
                id: +d.id,
                latitude: +d.long,
                longitude: +d.lat
            };
        })
        .then(data => {
            // console.log(data);
            data = data.slice(0, 100)
            // data = data.listings;

            document.getElementById("control-panel").style.height = window.innerHeight + "px";

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
                    circle = marker.append("circle")
                        .attr("id", d => "listing" + d.value.id)
                        .attr("r", 10)
                        .attr("cx", padding)
                        .attr("cy", padding)
                        .style("fill", startColor)
                        .style("fill-opacity", "0.6");

                    var onClick = (d) => {
                        d3.event.stopPropagation();
                        if (clicked != undefined && clicked != d.value.id) {
                            d3.select("#listing" + clicked)
                                .transition().duration(150)
                                .style("fill", startColor)
                                .style("fill-opacity", "0.6")
                                .attr("r", 10);

                            d3.select("#listing" + d.value.id)
                                .transition().duration(150)
                                .attr("r", 10);
                            clicked = undefined;
                        }

                        d3.selectAll("circle").filter(e => e.value.id != d.value.id)
                            .style("fill", startColor)
                            .transition().duration(400)
                            .attr("r", 7);

                        clicked = d.value.id;

                        loadImages(d.value.id % 33);
                        d3.select("#hovercard")
                            .style("visibility", "visible")
                            .classed("fadeOutRight", false)
                            .classed("fadeInRight", true);

                        // console.log(d.value.id)
                        var start = new google.maps.LatLng(d.value.latitude, d.value.longitude);
                        var end = new google.maps.LatLng(workPlace[0], workPlace[1]);

                        var request = {
                            origin: start,
                            destination: end,
                            travelMode: google.maps.TravelMode.DRIVING
                        };
                        directionsService.route(request, function (response, status) {
                            if (status == google.maps.DirectionsStatus.OK) {
                                directionsDisplay.setMap(map);
                                directionsDisplay.setDirections(response);
                            };
                        });
                    };

                    var onHover = (d) => {
                        d3.select("#listing" + d.value.id)
                            .transition().duration(200)
                            .style("fill", endColor)
                            .style("fill-opacity", "1.0");
                    };

                    var onHoverEnd = (d) => {
                        if (d.value.id != clicked) {
                            d3.select("#listing" + d.value.id)
                                .transition().duration(150)
                                .style("fill", startColor)
                                .style("fill-opacity", "0.6");
                        }
                    };

                    circle.on("click", onClick);
                    circle.on("mouseover", onHover);
                    circle.on("mouseout", onHoverEnd);

                    marker.append("text")
                        .attr("x", padding)
                        .attr("y", padding)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d.value.id;
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

            map.addListener('click', (e) => {
                d3.select("#hovercard")
                    .classed("fadeOutRight", true)
                    .classed("fadeInRight", false);

                if (clicked != undefined) {
                    d3.selectAll("circle")
                        .transition().duration(400)
                        .attr("r", 10);

                    d3.select("#listing" + clicked)
                        .transition().duration(150)
                        .style("fill", startColor)
                        .style("fill-opacity", "0.6");
                    clicked = undefined;
                }

                directionsDisplay.setMap(null);
            });

            // Bind our overlay to the map…
            overlay.setMap(map);
        })
}

function loadImages(homeID) {
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
        var indc_parent = d3.select("#home_image_indicators");

        image_parent.selectAll("div.carousel-item").remove();
        indc_parent.selectAll("li").remove();

        image_parent.selectAll("div.carousel-item")
            .data(images)
            .enter()
            .append("div").classed("carousel-item", true)
            .append("img").classed("d-block w-100", true)
            .attr("src", (d, i) => "rent_imgs/home" + homeID + "/img" + i + ".jpg")
            .style("height", "300px");

        image_parent.select(".carousel-item").classed("active", true);

        indc_parent.selectAll("li")
            .data(images)
            .enter()
            .append("li")
            .attr("data-target", "#carouselExampleIndicators")
            .attr("data-slide-to", (d, i) => i);

        indc_parent.select("li").classed("active", true);
    });
}

function updateFilters() {
    // get filter values

    // update showings

    // close hover 
    d3.select("#hovercard")
        .classed("fadeOutRight", true)
        .classed("fadeInRight", false);

    if (clicked != undefined) {
        d3.select("#listing" + clicked)
            .transition().duration(150)
            .style("fill", startColor)
            .style("fill-opacity", "0.6");
        clicked = undefined;
    }
}