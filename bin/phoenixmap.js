/**
 * Converts an array of points from [latitude, longitude] to [longitude, latitude].
 *
 * @param {Array<Array<number>>} points - An array of points where each point is an array [latitude, longitude].
 * @returns {Array<Array<number>>} - An array of points where each point is an array [longitude, latitude].
 */
function toTurfLngLat(points) {
    return points.map(point => [point[1], point[0]]);
}
/**
 * Converts an array of points from [longitude, latitude] to [latitude, longitude].
 *
 * @param {Array<Array<number>>} points - An array of points where each point is an array [longitude, latitude].
 * @returns {Array<Array<number>>} - An array of points where each point is an array [latitude, longitude].
 */
function toLeafletLatLng(points) {
    return points.map(point => [point[1], point[0]]);
}


/**
 * Generates a Phoenixmap polygon object based on the provided datapoints.
 *
 * @param {Array<Array<number>>} datapoints - An array of [longitude, latitude] coordinate pairs.
 * @returns {Object} An object representing the Phoenixmap polygon.
 * @throws {Error} If the input datapoints is an empty array.
 */
function phoenixmap(datapoints) {
    if (!Array.isArray(datapoints) || datapoints.length === 0) {
        throw new Error("Invalid input: datapoints must be a non-empty array");
    }

    datapoints = toTurfLngLat(datapoints);
    console.log('datapoints:', datapoints.length);

    const hullPoints = getOffsetConvexHull(datapoints);

    // Visualize the offset convex hull
    //L.polyline(toLeafletLatLng(hullPoints), { color: 'black' }).addTo(map);

    const numberOfSamples = 1000;
    var bezierPoints = getBezier(hullPoints, numberOfSamples);
    const circleCenters = getInscribedCircleCenters(bezierPoints, numberOfSamples);
    const densities = getDensities(bezierPoints, numberOfSamples, circleCenters, datapoints)

    return {
        bezierPoints: toLeafletLatLng(bezierPoints),
        densities: densities
    };
}


/**
 * Calculates the offset convex hull of a set of points.
 *
 * @param {Array<Array<number>>} points - An array of [longitude, latitude] coordinate pairs.
 * @returns {Array<Array<number>>} - The coordinates ([longitude, latitude]) of the scaled convex hull.
 */
function getOffsetConvexHull(points) {
    var turfPoints = points.map(point => turf.point(point));
    turfPoints = turf.featureCollection(turfPoints);
    const convexHull = turf.convex(turfPoints, { concavity: 100 });

    // Visualize the convex hull
    //L.polyline(toLeafletLatLng(convexHull.geometry.coordinates[0]), { color: 'black' }).addTo(map);

    const scaledHull = turf.transformScale(convexHull, 1.08);
    return scaledHull.geometry.coordinates[0];
}


/**
 * Generates a set of evenly sampled points along a Bezier spline created from the given points.
 *
 * @param {Array<Array<number>>} points - An array of [longitude, latitude] coordinate pairs.
 * @param {number} numberOfSamples - The number of samples to generate along the Bezier spline.
 * @returns {Array<Array<number>>} An array of [longitude, latitude] coordinate pairs representing the sampled points along the Bezier spline.
 */
function getBezier(points, numberOfSamples) {
    // sample more points along the convex hull to make the Bezier spline smoother
    var line = turf.lineString(points);
    var length = turf.length(line);
    var step = length / 50;
    var sampledPoints = [];
    for (let i = 0; i <= 50; i++) {
        const point = turf.along(line, i * step).geometry.coordinates;
        sampledPoints.push(point);
    }
    console.log('number of original points', points.length)
    console.log('number of hull sample points', sampledPoints.length);

    // Visualize the evenly sampled points of the hull
    //toLeafletLatLng(sampledPoints).forEach(point => {
    //    L.circleMarker([point[0], point[1]]).addTo(map);
    //});
    
    // create the Bezier spline and sample its points
    line = turf.lineString(sampledPoints);
    var bezier = turf.bezierSpline(line, { resolution: 10000, sharpness: 0.5 });
    length = turf.length(bezier);
    step = length / numberOfSamples;
    sampledPoints = [];
    for (let i = 0; i <= numberOfSamples; i++) {
        const point = turf.along(bezier, i * step).geometry.coordinates;
        sampledPoints.push(point);
    }
    console.log('number of bezier points', bezier.geometry.coordinates.length);
    console.log('number of bezier sample points', sampledPoints.length);

    // Visualize the evenly sampled points of the Bezier spline
    //toLeafletLatLng(sampledPoints).forEach(point => {
    //    L.circleMarker([point[0], point[1]]).addTo(map);
    //});

    return sampledPoints;
}


/**
 * Calculates the centers of the maximal inscribed circles within a polygon formed by Bezier points.
 *
 * @param {Array<Array<number>>} bezierPoints - An array of coordinate pairs ([longitude, latitude]) representing a Bezier spline.
 * @param {number} numberOfSamples - The number of samples along the Bezier spline.
 * @returns {Array<Array<number>>} An array of coordinate pairs ([longitude, latitude]) representing the center of the inscribed circle for every sample point.
 */
function getInscribedCircleCenters(bezierPoints, numberOfSamples) {
    const polygon = turf.transformScale(turf.polygon([bezierPoints]), 1.005);
    const circleCenters = [];
    for (let i = 0; i < numberOfSamples; i++) {
        const line1 = turf.lineString([bezierPoints[i], bezierPoints[i+1]]);
        const orthogonalLine1 = turf.transformRotate(line1, 90, { pivot: bezierPoints[i] }).geometry.coordinates;

        let line2, orthogonalLine2;
        if (i === 0) {
            line2 = turf.lineString([bezierPoints[bezierPoints.length-1], bezierPoints[bezierPoints.length-2]]);
            orthogonalLine2 = turf.transformRotate(line2, -90, { pivot: bezierPoints[bezierPoints.length-1] }).geometry.coordinates;
        }
        else {
            line2 = turf.lineString([bezierPoints[i], bezierPoints[i-1]]);
            orthogonalLine2 = turf.transformRotate(line2, -90, { pivot: bezierPoints[i] }).geometry.coordinates;
        }
        const orthogonalLine = [orthogonalLine1[0], [(orthogonalLine1[1][0] + orthogonalLine2[1][0]) / 2, (orthogonalLine1[1][1] + orthogonalLine2[1][1]) / 2]];

        // Visualize the inwards line from each Bezier point
        //L.polyline(toLeafletLatLng(orthogonalLine), { color: 'green' }).addTo(map);
        
        const point1 = orthogonalLine[0];
        const vector = [orthogonalLine[1][0] - orthogonalLine[0][0], orthogonalLine[1][1] - orthogonalLine[0][1]];

        let low = 0;
        let high = numberOfSamples / 6; // numberOfSamples * vector equals the circumference; for the max radius (polygon is a circle): 2*r*pi = numberofsamples
        let mid, point2, radius, circle;

        // Binary search for the maximal inscribed circle
        while (high - low > 0.5) {
            mid = (low + high) / 2;
            point2 = [point1[0] + mid * vector[0], point1[1] + mid * vector[1]];
            radius = turf.length(turf.lineString([point1, point2]));
            circle = turf.circle(point2, radius);

            // Visualize the circles
            //L.circle([point2[1], point2[0]], { radius: 1000*radius, color: 'green' }).addTo(map); // lng-lat to lat-lng for leaflet and convert km to m 

            if (turf.booleanContains(polygon, circle)) {
                low = mid;
            } else {
                high = mid;
            }
        }
        point2 = [point1[0] + low * vector[0], point1[1] + low * vector[1]];
        circleCenters.push(point2);
    }
    circleCenters.push(circleCenters[0]);
    return circleCenters;
}


/**
 * Calculates the densities of points within polygons formed by Bezier points and circle centers.
 *
 * @param {Array<Array<number>>} bezierPoints - An array of coordinate pairs ([longitude, latitude]) representing a Bezier spline.
 * @param {number} numberOfSamples - The number of samples along the Bezier spline.
 * @param {Array<Array<number>>} circleCenters - An array of coordinate pairs ([longitude, latitude]) representing the center of the inscribed circle for every sample point.
 * @param {Array<Array<number>>} datapoints - An array of [longitude, latitude] coordinate pairs representing the data.
 * @returns {Array<number>} An array of densities calculated for each segment between two sample points.
 */
function getDensities(bezierPoints, numberOfSamples, circleCenters, datapoints) {
    turfDataPoints = turf.points(datapoints);
    const densities = [];
    const areas = [];

    sumOfFoundPoints = 0;
    for (let i = 0; i < numberOfSamples; i++) {
        const polygonPoints = [
            bezierPoints[i],
            bezierPoints[i+1],
            circleCenters[i+1],
            circleCenters[i],
            bezierPoints[i]
        ]
        const polygon = turf.polygon([polygonPoints]);
        
        // Visualize the regions
        //L.polyline(toLeafletLatLng(polygonPoints), { color: 'blue' }).addTo(map);

        const area = 10**(-6) * turf.area(polygon); // convert m2 to km2
        const numberOfPointsWithin = turf.pointsWithinPolygon(turfDataPoints, polygon).features.length;
        sumOfFoundPoints += numberOfPointsWithin;
        densities.push(numberOfPointsWithin / area);
        areas.push(area);
    }
    console.log('number of found points:', sumOfFoundPoints);

    // weighted arithmetic mean calculation
    const windowSize = 25;
    for (let i = 0; i < numberOfSamples; i++) {
        let weightedSum = 0;
        let totalWeight = 0;
        for (let j = i-windowSize; j <= i+windowSize; j++) {
            const index = (j + numberOfSamples) % numberOfSamples;
            weightedSum += densities[index] * areas[index];
            totalWeight += areas[index];
        }
        densities[i] = weightedSum / totalWeight;
    }
    
    console.log('densities:', densities);
    return densities;
}