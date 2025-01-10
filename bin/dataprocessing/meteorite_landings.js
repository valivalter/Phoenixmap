/**
 * Processes meteorite landing data to extract latitude, longitude, and year.
 *
 * @param {Array<Object>} data - The array of meteorite landing data objects.
 * @returns {Array<Array<number>>} An array of coordinate pairs [latitude, longitude] for each meteorite landing.
 */
function processMeteoriteLandings(data) {
    const meteorites = data
        .filter(row => row['year'] && row['reclat'] && row['reclong'])
        .map(row => ({
            latitude: row['reclat'],
            longitude: row['reclong'],
            year: row['year'],
        }));

    const pointSet = [];
    meteorites.forEach(meteorite => {
        pointSet.push([meteorite.latitude, meteorite.longitude]);
    });

    console.log('Meteorite landings:', pointSet);
    return pointSet;
}

/**
 * Filters a set of meteorite landing points to only include those within a specified bounding polygon.
 *
 * @param {Array<Array<number>>} pointSet - An array of points representing meteorite landings, where each point is an array [latitude, longitude].
 * @param {Array<Array<number>>} boundingPolygonPoints - An array of points representing the vertices of the bounding polygon, where each point is an array [latitude, longitude].
 * @returns {Array<Array<number>>} - An array of points from the pointSet that are contained within the bounding polygon.
 */
function boundMeteoritePoints(pointSet, boundingPolygonPoints) {
    turfPolygon = turf.polygon([boundingPolygonPoints.map(point => [point[1], point[0]])]); // change from lat-long to long-lat for turf
    const containedPointSet = pointSet.filter(point => turf.booleanPointInPolygon([point[1], point[0]], turfPolygon));
    return containedPointSet;
}

/**
 * Uses Phoenixmap visualization to show the meteorite landings.
 *
 * @param {Object} phoenixPolygon - An object representing the Phoenixmap polygon.
 * @param {Array<Array<number>>} phoenixPolygon.bezierPoints - An array of points defining the polygon.
 * @param {Array<number>} phoenixPolygon.densities - An array of density values corresponding to each segment of the polygon.
 */
function showMeteoritesPhoenixmap(phoenixPolygon) {
    for (let i = 0; i < phoenixPolygon.bezierPoints.length-1; i++) {
        const point1 = phoenixPolygon.bezierPoints[i];
        const point2 = phoenixPolygon.bezierPoints[i+1];
        L.polyline([point1, point2], {
            color: 'blue',
            opacity: 0.5,
            weight: phoenixPolygon.densities[i] * 10000,
        }).addTo(map);
    }
}