/**
 * Clears all layers from the map except for the base tile layer.
 */
function clearMap() {
    map.eachLayer(function (layer) {
        if (layer instanceof L.TileLayer) return;
        map.removeLayer(layer);
    });
}

/**
 * Updates the navbar buttons based on the selected mode and toggles the modes
 * 
 * @param {HTMLInputElement} selectedInput - The input element (navbar mode button) that was selected.
 */
function updateNavbarButtons(selectedInput) {
    const labels = document.querySelectorAll('.btn-group .btn');
    labels.forEach(label => {
        label.classList.remove('btn-primary', 'active');
        label.classList.add('btn-light');
    });
    const selectedLabel = document.querySelector(`label[for="${selectedInput.id}"]`);
    selectedLabel.classList.remove('btn-light');
    selectedLabel.classList.add('btn-primary', 'active');
    clearMap();
    toggleMeteoriteMode(selectedInput.id === 'meteorite-landings');
    toggleFireMode(selectedInput.id === 'fire-occurrences');
    toggleRatSightingsMode(selectedInput.id === 'rat-sightings');
}

/**
 * Toggles the fire mode.
 *
 * @param {boolean} show - A boolean indicating whether to toggle on or off.
 */
function toggleFireMode(show) {
    const fireButtons = document.getElementById('fire-buttons');
    if (show) {
        fireButtons.style.display = 'block';
        map.flyTo([44.150681, -120.695801], 7);
        fireModeUpdate();
    } else {
        fireButtons.style.display = 'none';
    }
}

/**
 * Toggles the rat sightings mode.
 *
 * @param {boolean} show - A boolean indicating whether to toggle on or off.
 */
function toggleRatSightingsMode(show) {
    const ratSlider = document.getElementById('rat-slider');
    if (show) {
        ratSlider.style.display = 'block';
        map.flyTo([40.7128, -74.0060], 10);
        ratSightingsModeUpdate(2010);
    } else {
        ratSlider.style.display = 'none';
    }
}

/**
 * Toggles the meteorite landings mode.
 *
 * @param {boolean} show - A boolean indicating whether to toggle on or off.
 */
function toggleMeteoriteMode(show) {
    const meteoriteCountDiv = document.getElementById('meteorite-info');
    if (show) {
        meteoriteCountDiv.style.display = 'block';
        map.flyTo([47.7, 13.6], 7);
    } else {
        meteoriteCountDiv.style.display = 'none';
    }
}
    
/**
 * Updates the fire occurrences visualization based on the selected causes.
 */
function fireModeUpdate() {
    const activeButtons = document.querySelectorAll('#fire-buttons .btn-check:checked + label');
    const causes = Array.from(activeButtons).map(label => label.textContent.trim());
    clearMap();
    showFiresPhoenixmap(firePolygons, causes);
}

/**
 * Updates the rat sightings visualization and the displayed year and the number of rat sightings based on the selected year.
 * 
 * @param {number} year - The year for which to update the rat sightings visualization.
 */
function ratSightingsModeUpdate(year) {
    document.getElementById('rat-year-value').textContent = year;
    document.getElementById('rat-sightings-count').textContent = `${ratSightingPoints[year-2010].length} sightings`;
    clearMap();
    showRatSightingsPhoenixmap(ratSightingPolygons, year);
    const pointsEnabled = document.getElementById('rat-switch').checked;
    if (pointsEnabled) { showRatSightings(ratSightingPoints, year); }
}


// When meteorite mode is on, this listener makes it possible for the user to create a polygon by selecting points on the map, then it
// shows the Phoenixmap visualization of the meteorite landings which have occurred inside the selected area.
let polygonPoints = [];
map.on('click', function (e) {
    if (document.getElementById('meteorite-landings').checked) {
        clearMap();
        const clickedPoint = [e.latlng.lat, e.latlng.lng]
        polygonPoints.push(clickedPoint);
        if (polygonPoints.length === 1) {
            L.circleMarker(clickedPoint, { color: 'cadetblue', radius: 5 }).addTo(map);
        }
        else if (polygonPoints.length > 1) {
            const firstPoint = polygonPoints[0];
            const distance = map.distance(firstPoint, clickedPoint);
            if (distance < 10000 && polygonPoints.length > 2) {
                polygonPoints.pop();
                polygonPoints.push(firstPoint);
                L.polygon(polygonPoints, { opacity: 0.5 }).addTo(map);

                try {
                    const boundedMeteoritePoints = boundMeteoritePoints(meteoritePoints, polygonPoints);
                    document.getElementById('meteorite-count').textContent = `${boundedMeteoritePoints.length} meteorites in the area`;

                    const meteoritePolyline = phoenixmap(boundedMeteoritePoints);
                    showMeteoritesPhoenixmap(meteoritePolyline);
                }
                catch (error) {
                    console.log(error);
                }
                polygonPoints = [];
            } else {
                L.polyline(polygonPoints).addTo(map);
            }
        }
    }
});