var map = L.map('map');

map.setView([ 55.7422, 37.5719 ], 8);
// create the tile layer with correct attribution
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
var osm = new L.TileLayer(osmUrl, {
	minZoom : 2,
	maxZoom : 18,
	attribution : osmAttrib
});
map.addLayer(osm);

var loc1;
var loc2;
var routeCoordinates = {};
var polyline;

map.on('click', function(e) {
	onMapClick(e);
});

function onMapClick(e) {
	if (loc1 == null) {
		loc1 = new L.marker(e.latlng, {
			draggable : 'true',
			title : 'loc1',
			opacity : 0.8
		});
		loc1.on('dragend', function(event) {
			// отправляем запрос маршрута
			drawRoute();
		});
		map.addLayer(loc1);
	} else if (loc2 == null) {
		loc2 = new L.marker(e.latlng, {
			draggable : 'true',
			title : 'loc2',
			opacity : 0.8
		});
		loc2.on('dragend', function(event) {
			// отправляем запрос марурута
			drawRoute();
		});
		map.addLayer(loc2);
		// отправляем запрос маршрута
		drawRoute();
	}
}

function getRouteGeometryString() {
	var xhr = new XMLHttpRequest();
	var loc1LatLng = String(loc1.getLatLng().lat) + ',' + String(loc1.getLatLng().lng);
	var loc2LatLng = String(loc2.getLatLng().lat) + ',' + String(loc2.getLatLng().lng);
	var params = 'loc=' + loc1LatLng + '&loc=' + loc2LatLng + '&instructions=true';
	xhr.open("GET", 'http://0.0.0.0:5000/viaroute?' + params, false); //TODO change to async (true)
	//xhr.onreadystatechange = ... ;
	xhr.send();
	var data = JSON.parse(xhr.responseText);
	alert(loc1LatLng);
	alert(xhr.responseText);
	return data.route_geometry;
}

function decodeRouteGeometryString(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
}

function drawRoute() {
	var routeGeometryString = getRouteGeometryString();
	routeCoordinates = decodeRouteGeometryString(routeGeometryString, 6);
	if (polyline)
		map.removeLayer(polyline);
	polyline = new L.polyline(routeCoordinates, {color: 'red'});
	map.addLayer(polyline);
	map.fitBounds(polyline.getBounds());
}
