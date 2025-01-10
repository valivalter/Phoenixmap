/**
 * Processes the New York rat sightings data and organizes them by year.
 *
 * @param {Array<Object>} data - The array of rat sighting records, where each record is an object containing 'Latitude', 'Longitude', and 'Created Date' properties.
 * @returns {Array<Array<Array<number>>>} An array of 8 arrays, each containing coordinate pairs [latitude, longitude] for sightings from 2010 to 2017.
 */
function processRatSightings(data) {
    const sightings = data
        .filter(row => row['Latitude'] && row['Longitude'] && row['Created Date'])
        .map(row => ({
            year: new Date(row['Created Date']).getFullYear(),
            latitude: row['Latitude'],
            longitude: row['Longitude']
        }));
    console.log('Sightings:', sightings);

    const pointSets = Array.from({ length: 8 }, () => []);
    sightings.forEach(sighting => {
        if (sighting.year >= 2010 && sighting.year <= 2017) {
            pointSets[sighting.year - 2010].push([sighting.latitude, sighting.longitude]);
        }
    });

    // Visualization of the sighting points
    //sightings.slice(0, 10).forEach(sighting => {
    //    if (sighting.latitude && sighting.longitude) {
    //        L.marker([sighting.latitude, sighting.longitude]).addTo(map)
    //            .bindPopup(`Date: ${sighting.year}`);
    //    }
    //});

    return pointSets;
}

/**
 * Calculates the Phoenixmap polygons for the rat sighting records.
 *
 * @param {Array<Array<Array<number>>>} pointSets - An array of point sets, where each point set is an array of coordinates of a rat sighting.
 * @returns {Object[]} An array of Phoenixmap polygons generated from the point sets.
 */
function calculateRatSightingsPhoenixmap(pointSets) {
    const phoenixPolygons = [];
    pointSets.forEach(pointSet => {
        const phoenixPolygon = phoenixmap(pointSet);
        phoenixPolygons.push(phoenixPolygon);
    });
    return phoenixPolygons;
}

/**
 * Displays rat sightings via Phoenixmap visualization for a given year.
 *
 * @param {Object[]} phoenixPolygons - An array of Phoenixmap polygon data for each year.
 * @param {number} year - The year for which to display rat sightings.
 */
function showRatSightingsPhoenixmap(phoenixPolygons, year) {
    phoenixPolygon = phoenixPolygons[year-2010];
    for (let j = 0; j < phoenixPolygon.bezierPoints.length-1; j++) {
        const point1 = phoenixPolygon.bezierPoints[j];
        const point2 = phoenixPolygon.bezierPoints[j+1];
        L.polyline([point1, point2], {
            color: 'blue',
            opacity: 0.5,
            weight: phoenixPolygon.densities[j] * 1.0,
        }).addTo(map);
    }
}

/**
 * Displays rat sightings on the map for a given year.
 *
 * @param {Array<Array<Array<number>>>} pointSets - An array of 8 arrays, each containing coordinate pairs [latitude, longitude] for sightings from 2010 to 2017.
 * @param {number} year - The year for which to display the rat sightings.
 */
function showRatSightings(pointSets, year) {
    pointSet = pointSets[year-2010];
    pointSet.forEach(point => {
        L.circleMarker([point[0], point[1]], { color: 'cadetblue', opacity: 0.5, radius: 3 }).addTo(map);
    });
}