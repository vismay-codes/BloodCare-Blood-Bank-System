/* =========================================================
   BLOODCARE GOOGLE MAPS
   GPS + Blood Banks + Hospitals
   ========================================================= */

let bloodCareMap = null;
let userMarker = null;
let accuracyCircle = null;
let nearbyMarkers = [];
let mapsInitialized = false;
let mapResizeObserver = null;

const BLOODCARE_DEFAULT_LOCATION = {
    lat: 21.1458,
    lng: 79.0882
};


/* =========================================================
   STATUS / UI
   ========================================================= */

function setMapStatus(message, type = "info") {
    const status = document.getElementById("locationStatus");

    if (!status) return;

    status.textContent = message;
    status.className = `map-status ${type}`;
}


function setMapButtonState(disabled, text) {
    const button = document.getElementById("useLocationBtn");

    if (!button) return;

    button.disabled = disabled;
    button.textContent = text;
}


function updateCoordinates(lat, lng) {
    const coords = document.getElementById("mapCoords");

    if (!coords) return;

    coords.textContent =
        `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}


/* =========================================================
   MAP VISIBILITY CHECK
   ========================================================= */

function isNearbyViewVisible() {
    const nearbyView = document.getElementById("nearby");

    if (!nearbyView) return false;

    return nearbyView.classList.contains("active") &&
           nearbyView.offsetWidth > 0 &&
           nearbyView.offsetHeight > 0;
}


/* =========================================================
   MAP RESIZE
   ========================================================= */

function refreshMapLayout() {

    if (!bloodCareMap || !window.google || !google.maps) {
        return;
    }

    const mapElement =
        document.getElementById("bloodCareGoogleMap");

    if (!mapElement) return;

    if (mapElement.offsetWidth === 0 ||
        mapElement.offsetHeight === 0) {
        return;
    }

    google.maps.event.trigger(
        bloodCareMap,
        "resize"
    );

    const currentCenter =
        userMarker
            ? userMarker.getPosition()
            : BLOODCARE_DEFAULT_LOCATION;

    if (currentCenter) {
        bloodCareMap.setCenter(currentCenter);
    }
}


/* =========================================================
   CREATE MAP
   ========================================================= */

function createBloodCareMap() {

    const mapElement =
        document.getElementById("bloodCareGoogleMap");

    if (!mapElement) {

        console.error(
            "BloodCare Google Maps: map container not found."
        );

        return;
    }


    if (!window.google ||
        !google.maps) {

        console.error(
            "BloodCare Google Maps: Google Maps API is not available."
        );

        return;
    }


    /*
     * IMPORTANT:
     * Never initialize Google Maps while the
     * Near Me section is hidden.
     */

    if (!isNearbyViewVisible()) {

        console.log(
            "BloodCare Google Maps: waiting for Near Me view to become visible."
        );

        return;
    }


    /*
     * If map already exists, simply refresh it.
     */

    if (bloodCareMap) {

        refreshMapLayout();

        return;
    }


    console.log(
        "BloodCare Google Maps: creating map."
    );


    bloodCareMap =
        new google.maps.Map(
            mapElement,
            {
                center: BLOODCARE_DEFAULT_LOCATION,
                zoom: 13,

                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true,

                gestureHandling: "greedy"
            }
        );


    mapsInitialized = true;


    /*
     * Watch map dimensions.
     */

    if ("ResizeObserver" in window) {

        mapResizeObserver =
            new ResizeObserver(() => {

                if (!bloodCareMap) return;

                if (mapElement.offsetWidth === 0 ||
                    mapElement.offsetHeight === 0) {
                    return;
                }

                google.maps.event.trigger(
                    bloodCareMap,
                    "resize"
                );

                const center =
                    userMarker
                        ? userMarker.getPosition()
                        : BLOODCARE_DEFAULT_LOCATION;

                if (center) {
                    bloodCareMap.setCenter(center);
                }

            });

        mapResizeObserver.observe(mapElement);
    }


    /*
     * Multiple delayed refreshes.
     * This handles Google Maps rendering after
     * the browser finishes layout/paint.
     */

    setTimeout(refreshMapLayout, 50);
    setTimeout(refreshMapLayout, 250);
    setTimeout(refreshMapLayout, 600);
    setTimeout(refreshMapLayout, 1200);


    setMapStatus(
        "Map ready. Use your location to find nearby blood support.",
        "success"
    );
}


/* =========================================================
   FORCE MAP WHEN NEAR ME OPENS
   ========================================================= */

function initializeMapWhenVisible() {

    if (!window.google ||
        !google.maps) {

        console.log(
            "BloodCare Google Maps: API not ready yet."
        );

        return;
    }


    /*
     * Give the browser time to switch:
     *
     * display:none
     *       ↓
     * display:block
     */

    setTimeout(() => {

        createBloodCareMap();

        setTimeout(
            refreshMapLayout,
            100
        );

    }, 100);
}


/* =========================================================
   WATCH NAVIGATION
   ========================================================= */

function bindNearbyNavigation() {

    const nearbyButtons =
        document.querySelectorAll(
            '[data-view="nearby"]'
        );


    nearbyButtons.forEach(button => {

        if (button.dataset.mapBound) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                console.log(
                    "BloodCare: Near Me selected."
                );


                /*
                 * Several attempts make this robust
                 * against animation/layout timing.
                 */

                setTimeout(
                    initializeMapWhenVisible,
                    50
                );

                setTimeout(
                    initializeMapWhenVisible,
                    250
                );

                setTimeout(
                    initializeMapWhenVisible,
                    600
                );

            }
        );


        button.dataset.mapBound = "true";

    });
}


/* =========================================================
   USER LOCATION
   ========================================================= */

function addUserLocation(
    lat,
    lng,
    accuracy
) {

    if (!bloodCareMap ||
        !window.google) {
        return;
    }


    const position = {
        lat,
        lng
    };


    if (userMarker) {

        userMarker.setPosition(
            position
        );

    } else {

        userMarker =
            new google.maps.Marker({
                position,
                map: bloodCareMap,
                title: "Your current location",
                animation: google.maps.Animation.DROP
            });

    }


    if (accuracyCircle) {

        accuracyCircle.setCenter(
            position
        );

        accuracyCircle.setRadius(
            accuracy
        );

    } else {

        accuracyCircle =
            new google.maps.Circle({
                map: bloodCareMap,
                center: position,
                radius: accuracy,
                fillOpacity: 0.10,
                strokeOpacity: 0.35,
                strokeWeight: 1
            });

    }


    bloodCareMap.panTo(
        position
    );

    bloodCareMap.setZoom(
        15
    );


    refreshMapLayout();
}


/* =========================================================
   GOOGLE MAPS SEARCH
   ========================================================= */

function openGoogleMapsSearch(type) {

    if (!userMarker) {

        setMapStatus(
            "Please detect your location first.",
            "warning"
        );

        return;
    }


    const position =
        userMarker.getPosition();


    const lat =
        position.lat();

    const lng =
        position.lng();


    let query = "blood bank";


    if (type === "hospital") {
        query = "hospital";
    }


    const url =
        `https://www.google.com/maps/search/?api=1` +
        `&query=${encodeURIComponent(query)}+near+${lat},${lng}`;


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =========================================================
   DIRECTIONS
   ========================================================= */

function openDirections() {

    if (!userMarker) {

        setMapStatus(
            "Please detect your location first.",
            "warning"
        );

        return;
    }


    const position =
        userMarker.getPosition();


    const lat =
        position.lat();

    const lng =
        position.lng();


    const url =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${lat},${lng}` +
        `&destination=blood+bank`;


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =========================================================
   GPS
   ========================================================= */

function useMyLocation() {

    if (!navigator.geolocation) {

        setMapStatus(
            "Geolocation is not supported by this browser.",
            "error"
        );

        return;
    }


    /*
     * Make absolutely sure the map exists
     * before adding the location marker.
     */

    if (!bloodCareMap) {

        createBloodCareMap();

    }


    setMapButtonState(
        true,
        "Detecting location..."
    );


    setMapStatus(
        "Requesting your location. Please allow location access.",
        "info"
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            /*
             * If map wasn't created because the
             * section was hidden, create it now.
             */

            if (!bloodCareMap) {

                createBloodCareMap();

            }


            addUserLocation(
                lat,
                lng,
                accuracy
            );


            updateCoordinates(
                lat,
                lng
            );


            setMapStatus(
                "Your location was detected successfully.",
                "success"
            );


            setMapButtonState(
                false,
                "Refresh My Location"
            );


            const bloodBankButton =
                document.getElementById(
                    "bloodBanksBtn"
                );

            const hospitalButton =
                document.getElementById(
                    "hospitalsBtn"
                );

            const directionsButton =
                document.getElementById(
                    "directionsBtn"
                );


            if (bloodBankButton) {
                bloodBankButton.disabled = false;
            }


            if (hospitalButton) {
                hospitalButton.disabled = false;
            }


            if (directionsButton) {
                directionsButton.disabled = false;
            }

        },


        error => {

            let message =
                "Unable to determine your location.";


            if (error.code === 1) {

                message =
                    "Location permission was denied. Allow location access and try again.";

            }


            if (error.code === 2) {

                message =
                    "Your location could not be determined. Check Windows/browser location services.";

            }


            if (error.code === 3) {

                message =
                    "Location request timed out. Please try again.";

            }


            setMapStatus(
                message,
                "error"
            );


            setMapButtonState(
                false,
                "Try Again"
            );

        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
        }

    );
}


/* =========================================================
   BUTTONS
   ========================================================= */

function bindMapButtons() {

    const locationButton =
        document.getElementById(
            "useLocationBtn"
        );

    const bloodBankButton =
        document.getElementById(
            "bloodBanksBtn"
        );

    const hospitalButton =
        document.getElementById(
            "hospitalsBtn"
        );

    const directionsButton =
        document.getElementById(
            "directionsBtn"
        );


    if (
        locationButton &&
        !locationButton.dataset.bound
    ) {

        locationButton.addEventListener(
            "click",
            useMyLocation
        );

        locationButton.dataset.bound =
            "true";
    }


    if (
        bloodBankButton &&
        !bloodBankButton.dataset.bound
    ) {

        bloodBankButton.addEventListener(
            "click",
            () =>
                openGoogleMapsSearch(
                    "blood-bank"
                )
        );

        bloodBankButton.dataset.bound =
            "true";
    }


    if (
        hospitalButton &&
        !hospitalButton.dataset.bound
    ) {

        hospitalButton.addEventListener(
            "click",
            () =>
                openGoogleMapsSearch(
                    "hospital"
                )
        );

        hospitalButton.dataset.bound =
            "true";
    }


    if (
        directionsButton &&
        !directionsButton.dataset.bound
    ) {

        directionsButton.addEventListener(
            "click",
            openDirections
        );

        directionsButton.dataset.bound =
            "true";
    }

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initBloodCareMaps() {

    console.log(
        "BloodCare Google Maps API loaded."
    );


    /*
     * DO NOT immediately create the map.
     *
     * Near Me may still be hidden.
     */

    bindMapButtons();

    bindNearbyNavigation();


    /*
     * If the page happens to start on
     * Near Me, initialize it.
     */

    if (isNearbyViewVisible()) {

        initializeMapWhenVisible();

    }


    window.addEventListener(
        "resize",
        () => {

            if (isNearbyViewVisible()) {
                refreshMapLayout();
            }

        }
    );

}


/* =========================================================
   PUBLIC FUNCTIONS
   ========================================================= */

window.initBloodCareMaps =
    initBloodCareMaps;

window.refreshBloodCareMap =
    refreshMapLayout;

window.initializeBloodCareMap =
    initializeMapWhenVisible;