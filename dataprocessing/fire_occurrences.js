/**
 * Processes fire occurrence data to filter and categorize by cause.
 *
 * @param {Array<Object>} data - The array of fire occurrence data objects.
 * @returns {Map<string, Array<Array<number>>>} A map where the keys are causes of the fires and the values are arrays of latitude and longitude pairs.
 */
function processFireOccurrences(data) {
    const fires = data
        .filter(row =>
            row['GeneralCause'] !== 'Under Invest' &&
            row['GeneralCause'] !== 'Miscellaneous' &&
            row['Lat_DD'] && row['Long_DD'])
        .map(row => ({
            latitude: row['Lat_DD'],
            longitude: row['Long_DD'],
            cause: row['GeneralCause'],
        }));

    const pointSets = new Map();
    fires.forEach(fire => {
        if (!pointSets.has(fire.cause)) {
            pointSets.set(fire.cause, []);
        }
        pointSets.get(fire.cause).push([fire.latitude, fire.longitude]);
    });

    console.log('Fire occurrences:', pointSets);
    return pointSets;
}


/**
 * Calculates the Phoenixmap polygons for a given set of fire occurrence points.
 *
 * @param {Map<string, Array<Array<number>>>} pointSets - A map where the key is the cause of the fire and the value is an array of points representing fire occurrences.
 * @returns {Map<string, Object>} A map where the key is the cause of the fire and the value is the corresponding Phoenixmap polygon object.
 */
function calculateFiresPhoenixmap(pointSets) {
    const phoenixPolygons = new Map();
    pointSets.forEach((pointSet, cause) => {
        const phoenixPolygon = phoenixmap(pointSet);
        phoenixPolygons.set(cause, phoenixPolygon);
    });
    return phoenixPolygons;
}

/**
 * Displays fire occurrences via Phoenixmap visualization for given causes.
 *
 * @param {Object[]} phoenixPolygons - An array of Phoenixmap polygon objects representing fire occurrences.
 * @param {Array} causes - An array of strings representing the causes of the fires to be shown.
 */
function showFiresPhoenixmap(phoenixPolygons, causes) {
    const colors = new Map([
        ['Lightning', 'yellow'],
        ['Smoking', 'gray'],
        ['Recreation', 'green'],
        ['Debris Burning', 'black'],
        ['Equipment Use', 'blue'],
        ['Arson', 'red'],
        ['Juveniles', 'white'],
        ['Railroad', 'turquoise'],
    ]);
    phoenixPolygons.forEach((phoenixPolygon, cause) => {
        if (causes.includes(cause)) {
            for (let i = 0; i < phoenixPolygon.bezierPoints.length - 1; i++) {
                const point1 = phoenixPolygon.bezierPoints[i];
                const point2 = phoenixPolygon.bezierPoints[i+1];
                L.polyline([point1, point2], {
                    color: colors.get(cause),
                    opacity: 0.5,
                    weight: phoenixPolygon.densities[i] * 500,
                }).addTo(map);
            }
        }
    });
}