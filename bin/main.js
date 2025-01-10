// Leaflet map
const map = L.map('map').setView([47.7, 13.6], 7); // Initialize the map centered on Vienna
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// process all datasets and store the needed coordinate pairs and Phoenixmap polygon objects.
var ratSightingPoints, ratSightingPolygons;
var meteoritePoints;
var firePolygons;
processData();


/**
 * Asynchronously processes all datasets (rat sightings, meteorite landings, fire occurrences) and stores the needed coordinate pairs and Phoenixmap polygon objects.
 * 
 * @throws {Error} If any of the data loading or processing steps fail.
 */
async function processData() {
    try {
        // rat sightings data
        const sightings = await loadCSV('./datasets/rat_sightings.csv');
        ratSightingPoints = processRatSightings(sightings);
        ratSightingPolygons = calculateRatSightingsPhoenixmap(ratSightingPoints);

        // meteorite landings data
        const meteorites = await loadCSV('./datasets/meteorite_landings.csv');
        meteoritePoints = processMeteoriteLandings(meteorites);

        // fire occurrence data
        const fires = await loadCSV('./datasets/fire_occurrences.csv');
        const pointSets = processFireOccurrences(fires)
        firePolygons = calculateFiresPhoenixmap(pointSets);
    } catch (error) {
        console.error(`Error processing data:`, error);
        throw error;
    }
}

/**
 * Asynchronously loads and parses a CSV file from the given path.
 *
 * @param {string} path - The path to the CSV file.
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects representing the parsed CSV data.
 * @throws {Error} If there is an error fetching or parsing the CSV file.
 */
async function loadCSV(path) {
    try {
        const response = await fetch(path);
        const csvText = await response.text();
        return await new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                worker: true,
                header: true,
                dynamicTyping: true,
                complete: function (results) {
                    console.log('CSV file successfully processed');
                    console.log('Size:', results);
                    resolve(results.data);
                },
                error: function (parseError) {
                    console.error('Error parsing CSV:', parseError);
                    reject(parseError);
                }
            });
        });
    } catch (fetchError) {
        console.error('Error fetching CSV file:', fetchError);
        throw fetchError;
    }
}