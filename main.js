var startColor = "1fbad6",
    endColor = "#EF3C79";

var clicked = undefined;
var circle;

var map;
var directionsDisplay;
var directionsService;
var allData;

var mapBounds = {
    north: 40.87904,
    south: 40.68292,
    west: -74.04773,
    east: -73.90665
};


var workPlace = undefined;

var dialog = document.querySelector('dialog');
if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
}
dialog.querySelector('.closeD').addEventListener('click', function () {
    dialog.close();
});

var getListings;

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
        restriction: {
            latLngBounds: mapBounds,
            strictBounds: false,
        },
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

    dialog.showModal();

    var workPlaceClickListener = map.addListener('click', (e) => {
        var latlng = e.latLng;
        var lat = latlng.lat();
        var long = latlng.lng();
        // console.log(lat, long);

        Popup = createPopupClass();
        popup = new Popup(new google.maps.LatLng(lat, long), document.getElementById('work'));
        popup.setMap(map);

        document.getElementById("pets").removeAttribute("disabled");


        workPlace = [lat, long];
        google.maps.event.removeListener(workPlaceClickListener);

        map.setZoom(14);
        map.panTo(new google.maps.LatLng(workPlace[0], workPlace[1]));

        var url = new URL("http://ec2-34-233-120-144.compute-1.amazonaws.com:8000/matchmaker/start_listings/"),
            params = {
                latitude: lat,
                longitude: long
            }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        fetch(url).then(d => d.json()).then(getListings);
    });

    getListings = (jsonData) => {
        // 
        // smoothZoom(map, 15, map.getZoom());
        // var url = "rental_coords_small_mod.csv"
        // var url = "rental_coords_large.csv"
        // var jsonFile = "sample_data.json";

        // console.log(jsonData);
        // d3.json(jsonFile)
        var rawData = jsonData.map((e, i) => {
            e.fields.id = i + 1;
            // e.field.pk = e.pk;
            return e.fields
        });

        // console.log(data);
        // data = rawData.slice(0, 100)
        // data = data.listings;
        data = rawData;
        allData = data;

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
                        // .attr("r", 10);

                        // d3.select("#listing" + d.value.id)
                        //     .transition().duration(150)
                        //     .attr("r", 10);
                        clicked = undefined;
                    }

                    d3.selectAll("circle").filter(e => e.value.id != d.value.id)
                        .style("fill", startColor)
                    // .transition().duration(400)
                    // .attr("r", 7);

                    clicked = d.value.id;

                    d3.select("#c-address").text(d.value.address);
                    d3.select("#c-price").text(moneyformat(d.value.price));
                    d3.select("#c-bedrooms").text(d.value.bedrooms);
                    d3.select("#c-bathrooms").text(d.value.bathrooms);
                    d3.select("#c-pics").text("Yes");
                    d3.select("#c-pets").text(d.value.pets == 0 ? "No" : "Yes");
                    d3.select("#c-parking").text(d.value.parking == 0 ? "No" : "Yes");
                    d3.select("#c-dishwasher").text(d.value.dishwasher == 0 ? "No" : "Yes");
                    d3.select("#c-wd").text(d.value.wd == 0 ? "No" : "Yes");

                    loadImages(d.value.id % 33);
                    d3.select("#hovercard")
                        .style("visibility", "visible")
                        .classed("fadeOutRight", false)
                        .classed("fadeInRight", true);

                    console.log(d)
                    var start = new google.maps.LatLng(d.value.latitude, d.value.longitude);
                    var end = new google.maps.LatLng(workPlace[0], workPlace[1]);

                    var radios = document.getElementsByName('transit_options');
                    var transit_options;
                    for (var i = 0, length = radios.length; i < length; i++) {
                        if (radios[i].checked) {
                            transit_options = radios[i].value;
                            break;
                        }
                    }
                    var travelm;
                    if (transit_options == "walk") {
                        travelm = google.maps.TravelMode.WALKING;
                    } else if (transit_options == "bike") {
                        travelm = google.maps.TravelMode.DRIVING;
                        // travelm = google.maps.TravelMode.BICYCLING;
                    } else if (transit_options == "transit") {
                        travelm = google.maps.TravelMode.WALKING;
                        // travelm = google.maps.TravelMode.TRANSIT;
                    } else {
                        travelm = google.maps.TravelMode.DRIVING;
                    }

                    var request = {
                        origin: start,
                        destination: end,
                        travelMode: travelm
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
                        // .transition().duration(200)
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

                updateFilters();
            };
        };

        map.addListener('click', (e) => {
            d3.select("#hovercard")
                .classed("fadeOutRight", true)
                .classed("fadeInRight", false);

            if (clicked != undefined) {
                // d3.selectAll("circle")
                //     .transition().duration(400)
                //     .attr("r", 10);

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

        updateFilters();
    }
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
    if (workPlace == undefined) return;
    // get filter values
    var radios = document.getElementsByName('transit_options');

    var transit_options;
    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            transit_options = radios[i].value;
            break;
        }
    }

    var minPrice = +document.getElementById("min-price").value;
    var maxPrice = +document.getElementById("max-price").value;
    var bedrooms = +document.getElementById("bedrooms").value;
    var bathrooms = +document.getElementById("bathrooms").value;
    var pets = document.getElementById("pets").checked ? 1 : 0;
    var parking = document.getElementById("parking").checked ? 1 : 0;
    var dishwasher = document.getElementById("dishwasher").checked ? 1 : 0;
    var wd = document.getElementById("wd").checked ? 1 : 0;

    // console.log(transit_options, minPrice, maxPrice);
    // console.log(bedrooms, bathrooms);
    // console.log(pets, parking, dishwasher, wd);

    // update showings
    if (allData != undefined) {
        d3.selectAll("circle").attr("r", 6);
        allData.forEach(d => {
            if (!(d.price < minPrice || d.price > maxPrice || d.bedrooms != bedrooms || d.bathrooms != bathrooms || d.dishwasher != dishwasher || d.parking != parking || d.pets != pets || d.wd != wd)) {
                console.log(d.price, maxPrice);
                d3.select("#listing" + d.id)
                    // .transition().duration(150)
                    .attr("r", 10);
            }
        });
    }

    // close hover 
    // d3.select("#hovercard")
    //     .classed("fadeOutRight", true)
    //     .classed("fadeInRight", false);

    if (clicked != undefined) {
        // d3.selectAll("circle")
        //     .transition().duration(400)
        //     .attr("r", 10);

        d3.select("#listing" + clicked)
            .transition().duration(150)
            .style("fill", startColor)
            .style("fill-opacity", "0.6");
        clicked = undefined;
    }

    directionsDisplay.setMap(null);

    // getListings();
    getRecommendations(bedrooms, bathrooms, pets, dishwasher, wd, parking);
}

function getRecommendations(bedrooms, bathrooms, pets, dishwasher, wd, parking) {
    var url = new URL("http://ec2-34-233-120-144.compute-1.amazonaws.com:8000/matchmaker/recommendations/"),
        params = {
            latitude: workPlace[0],
            longitude: workPlace[1],
            alpha: 1,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            pets: pets,
            dishwasher: dishwasher,
            wd: wd,
            parking: parking
        }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    fetch(url).then(d => d.json()).then(rawData => {
        var data = rawData.map(e => e.fields);
        // console.log(data);

        for (var i = 0; i < 6; i++) {
            d3.select("#rec" + i).text("#" + (i + 1) + ": " + data[i].address);
        }
    });
}

function createPopupClass() {
    /**
     * A customized popup on the map.
     * @param {!google.maps.LatLng} position
     * @param {!Element} content The bubble div.
     * @constructor
     * @extends {google.maps.OverlayView}
     */
    function Popup(position, content) {
        this.position = position;

        content.classList.add('popup-bubble');

        // This zero-height div is positioned at the bottom of the bubble.
        var bubbleAnchor = document.createElement('div');
        bubbleAnchor.classList.add('popup-bubble-anchor');
        bubbleAnchor.appendChild(content);

        // This zero-height div is positioned at the bottom of the tip.
        this.containerDiv = document.createElement('div');
        this.containerDiv.classList.add('popup-container');
        this.containerDiv.appendChild(bubbleAnchor);

        // Optionally stop clicks, etc., from bubbling up to the map.
        google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
    }
    // ES5 magic to extend google.maps.OverlayView.
    Popup.prototype = Object.create(google.maps.OverlayView.prototype);

    /** Called when the popup is added to the map. */
    Popup.prototype.onAdd = function () {
        this.getPanes().floatPane.appendChild(this.containerDiv);
    };

    /** Called when the popup is removed from the map. */
    Popup.prototype.onRemove = function () {
        if (this.containerDiv.parentElement) {
            this.containerDiv.parentElement.removeChild(this.containerDiv);
        }
    };

    /** Called each frame when the popup needs to draw itself. */
    Popup.prototype.draw = function () {
        var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);

        // Hide the popup when it is far out of view.
        var display =
            Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
            'block' :
            'none';

        if (display === 'block') {
            this.containerDiv.style.left = divPosition.x + 'px';
            this.containerDiv.style.top = divPosition.y + 'px';
        }
        if (this.containerDiv.style.display !== display) {
            this.containerDiv.style.display = display;
        }
    };

    return Popup;
}

var moneyformat = d3.format("$,");