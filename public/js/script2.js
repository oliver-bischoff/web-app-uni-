let currentUser = null;
let locationsMap = {};
let map = null;
let markerMap = {};

const loginForm = document.getElementById("loginForm");
const logoutBtn = document.querySelector("header button.logout");
const addBtn = document.querySelector("button.add");

// show/hide Screens
function showScreen(id) {
    document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
    const target = document.getElementById(id);
    if (target) target.style.display = "block";
    logoutBtn.style.display = (id === "login-screen") ? "none" : "inline-block";

    if (id === "main-screen" && map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 0);
    }
}

// Map
function initMap() {
    if (map) return;

    map = L.map("map").setView([52.52, 13.405], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);
}


// Login
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const resp = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!resp.ok) throw new Error("Falscher Benutzername oder Passwort");

        const user = await resp.json();
        currentUser = user;

        document.getElementById("welcome-name").textContent = user.name;
        updateRoleUI();
        await loadLocations();
        showScreen("main-screen");

    } catch (err) {
        alert(err.message);
        loginForm.reset();
    }
});

// Logout
logoutBtn.addEventListener("click", () => {
    currentUser = null;
    locationsMap = {};
    addBtn.style.display = "none";
    showScreen("login-screen");
    updateRoleUI();
    loginForm.reset();
});

// Role UI
function updateRoleUI() {
    const addBtns = document.querySelectorAll("button.add");
    const updateBtns = document.querySelectorAll(".aktualisieren");
    const deleteBtns = document.querySelectorAll(".löschen");
    const cancelBtns = document.querySelectorAll(".abbrechen");
    const imageBtn = document.querySelectorAll(".bild-auswählen");
    const deleteImageBtn = document.querySelectorAll(".bild-löschen");

    if (currentUser?.role === "admin") {
        addBtns.forEach(b => b.style.display = "inline-block");
        updateBtns.forEach(b => b.style.display = "inline-block");
        deleteBtns.forEach(b => b.style.display = "inline-block");
        cancelBtns.forEach(b => b.style.display = "inline-block");
        imageBtn.forEach(b => b.style.display = "inline-block")
        deleteImageBtn.forEach(b => b.style.display = "inline-block");
    } else {
        addBtns.forEach(b => b.style.display = "none");
        updateBtns.forEach(b => b.style.display = "none");
        deleteBtns.forEach(b => b.style.display = "none");
        cancelBtns.forEach(b => b.style.display = "none");
        imageBtn.forEach(b => b.style.display = "none");
        deleteImageBtn.forEach(b => b.style.display = "none");
    }
}

// Locations vom Server laden
async function loadLocations() {
    try {
        const resp = await fetch("/loc");
        const locArray = await resp.json();
        locationsMap = {};
        markerMap = {};
        document.getElementById("locations-list").innerHTML = "";

        initMap();

        locArray.forEach(loc => {
            locationsMap[loc._id] = loc;
            addLocationToHTML(loc._id, loc);
            addMarkerForLocation(loc);
            setupMarkerHover(loc._id);

        });
    } catch (err) {
        console.error("Fehler beim Laden der Locations:", err);
    }
}

// Add Location
addBtn.addEventListener("click", () => {
    showScreen("add-screen");
    updateRoleUI();
});

const addForm = document.getElementById("add-form");
addForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const street = document.getElementById("street").value;
    const cityInput = document.getElementById("city").value.split(',');
    const ZIP = cityInput[0]?.trim() || "";
    const city = cityInput[1]?.trim() || "";
    const category = document.getElementById("category").value;
    const imageFile = document.getElementById("image").files[0];
    
    const geo = await getLatLon(street, ZIP, city);
    if (!geo) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("street", street);
    formData.append("ZIP", ZIP);
    formData.append("city", city);
    formData.append("category", category);
    formData.append("lat", geo.lat);
    formData.append("lon", geo.lon);
    if (imageFile) formData.append("image", imageFile);

    try {
        const resp = await fetch("/loc", {
            method: "POST",
            body: formData
        });
        if (!resp.ok) throw new Error("Fehler beim Anlegen der Location");

        const createdLoc = await resp.json();

        locationsMap[createdLoc._id] = createdLoc;
        addLocationToHTML(createdLoc._id, createdLoc);
        addMarkerForLocation(createdLoc);
        setupMarkerHover(createdLoc._id);
        addForm.reset();
        showScreen("main-screen");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});

// Details Screen
let currentLocId = null;

function openDetailsScreen(locId) {
    currentLocId = locId;
    const locData = locationsMap[locId];
    if (!locData) return;

    showScreen("details-screen");
    updateRoleUI();

    document.getElementById("title_details").value = locData.title;
    document.getElementById("description_details").value = locData.description;
    document.getElementById("street_details").value = locData.street;
    document.getElementById("city_details").value = `${locData.ZIP}, ${locData.city}`;
    document.getElementById("category_details").value = locData.category;

    const imgPreview = document.getElementById("image_details_preview");
    if (locData.image) {
        imgPreview.src = locData.image;
        imgPreview.style.display = "block";
    } else {
        imgPreview.removeAttribute("src");
        imgPreview.style.display = "none";
    }
    
    document.getElementById("geocoodinate").value = `${locData.lat}, ${locData.lon}`;
}

// Update/Delete
const detailsForm = document.getElementById("update-delete-form");
detailsForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!currentLocId) return;

    const cityInput = document.getElementById("city_details").value.split(",");
    const ZIP = cityInput[0]?.trim() || "";
    const city = cityInput[1]?.trim() || "";

    const geo = await getLatLon(
        document.getElementById("street_details").value,
        ZIP,
        city
    );
    if (!geo) return;

    // FormData für Multer/optionales Bild erstellen
    const formData = new FormData();
    formData.append("title", document.getElementById("title_details").value);
    formData.append("description", document.getElementById("description_details").value);
    formData.append("street", document.getElementById("street_details").value);
    formData.append("ZIP", ZIP);
    formData.append("city", city);
    formData.append("category", document.getElementById("category_details").value);
    formData.append("lat", geo.lat);
    formData.append("lon", geo.lon);

    // Prüfen, ob ein neues Bild ausgewählt wurde
    const fileInput = document.getElementById("image_details_input"); 
    if (fileInput && fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
    }

    try {
        const resp = await fetch(`/loc/${currentLocId}`, {
            method: "POST", //wegen Multer
            body: formData
        });
        if (!resp.ok) throw new Error("Update fehlgeschlagen");

        const updatedLoc = await resp.json();
        locationsMap[currentLocId] = updatedLoc;

        await loadLocations();
        showScreen("main-screen");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});

// Delete
document.querySelector(".löschen").addEventListener("click", async () => {
    if (!currentLocId) return;
    try {
        const resp = await fetch(`/loc/${currentLocId}`, { method: "DELETE" });
        if (!resp.ok) throw new Error("Löschen fehlgeschlagen");

        // Marker entfernen
        const marker = markerMap[currentLocId];
        if (marker) {
            map.removeLayer(marker);
            delete markerMap[currentLocId];
        }

        // Location aus Map entfernen
        delete locationsMap[currentLocId];

        const li = document.getElementById(currentLocId);
        if (li) li.remove();

        currentLocId = null;

        Object.values(markerMap).forEach(m => map.removeLayer(m));
        markerMap = {};
        
        await loadLocations();
        
        showScreen("main-screen");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});

// Location zu HTML hinzufügen
function addLocationToHTML(locId, locData) {
    const list = document.getElementById("locations-list");

    const li = document.createElement("li");
    li.classList.add("location");
    li.id = locId;

    li.innerHTML = `
        <h3 class="loc-title">${locData.title}</h3>
        <div class="loc-content">
            <p class="address">${locData.street}, ${locData.ZIP} ${locData.city}</p>
            <p class="category">Kategorie: <strong>${locData.category}</strong></p>
            <p>${locData.description}</p>
            ${locData.image ? `<div class="image-area">
                <img src="${locData.image}" width="300">
            </div>` : ""}
        </div>
    `;

    list.appendChild(li);
    li.querySelector(".loc-title").addEventListener("click", () => openDetailsScreen(locId));
}

// Funktion zum Hovern der Locations
function setupMarkerHover(locId) {
    const li = document.getElementById(locId);
    if (!li) return;

    const titleEl = li.querySelector(".loc-title");
    const marker = markerMap[locId];
    if (!titleEl || !marker) return;

    const bigIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [50, 82],
        iconAnchor: [25, 82],
        popupAnchor: [0, -80]
    });

    const smallIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41]
    });

    titleEl.addEventListener("mouseenter", () => {
        marker.setIcon(bigIcon);
        marker.setZIndexOffset(1000); 
    });

    titleEl.addEventListener("mouseleave", () => {
        marker.setIcon(smallIcon);
        marker.setZIndexOffset(0);
    });
}

// Add Marker
function addMarkerForLocation(loc) {
    if (!map) return;
    if (!loc.lat || !loc.lon) return;

    const marker = L.marker([loc.lat, loc.lon])
        .addTo(map)
        .bindPopup(`<strong>${loc.title}</strong><br>${loc.street}`);

    markerMap[loc._id] = marker;
}


// Geokoordinaten
async function getLatLon(street, zip, city) {
    const query = encodeURIComponent(`${street} ${zip} ${city}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json`;
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("Server nicht erreichbar");
        const data = await resp.json();
        if (!data.length) {
            alert("Keinen Standort gefunden.");
            return null;
        }
        return { lat: data[0].lat, lon: data[0].lon };
    } catch (err) {
        console.error(err);
        return null;
    }
}

// Schließen-Button
document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("schließen")) {
        showScreen("main-screen");
    }
});

// Bild Delete Button
document.getElementById("delete-image").addEventListener("click", async () => {
    if (!currentLocId) return;
    try {
        const resp = await fetch(`/loc/${currentLocId}/image`, { method: "DELETE" });
        if (!resp.ok) throw new Error("Bild löschen fehlgeschlagen");

        const imgPreview = document.getElementById("image_details_preview");
        imgPreview.removeAttribute("src");
        imgPreview.style.display = "none";

        const locs = await fetch(`/loc/${currentLocId}`);
        const updatedLoc = await locs.json();
        locationsMap[currentLocId] = updatedLoc;
        

        alert("Bild erfolgreich gelöscht");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});




