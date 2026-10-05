/*
const admina = {
    username: "admina",
    password: "password",
    role: "admin",
    name: "Mina"
}

const normalo = {
    username: "normalo",
    password: "password",
    role: "non-admin",
    name: "Norman"
}
 */


let isAdminLoggedIn = false;
let isGuestLoggedIn = false;

/*
// die Standorte
let loc1 = {
    title: "Luftverschmutzung - Kiefholzstraße",
    description: "Dieser Ort weist häufiger hohe Luftverschmutzung auf.",
    street: "Kiefholzstraße",
    ZIP: "12437",
    city: "Berlin",
    category: "Luft",
    image: "./images/Kiefholzstraße.png",
    lat: "52.4690125",
    lon: "13.4822335",
}

let loc2 = {
    title: "Überlappen von Fußgänger- und Fahrradweg",
    description: "Hier überlappen sich Wege für Fußgänger und Radfahrer auf einer engen Straße.",
    street: "Zingster Straße",
    ZIP: "13051",
    city: "Berlin",
    category: "Fußgänger, Fahrrad",
    image: "./images/Ueberlappte_Wege.jpg",
    lat: "52.56342",
    lon: "13.50478",
}

let loc3 = {
    title: "Baustelle - Prerower Platz",
    description: "Diese Linie führt direkt ins Stadtzentrum, jedoch dauern hier Bauarbeiten über mehrere Monate an.",
    street: "Prerower Platz",
    ZIP: "13051",
    city: "Berlin",
    category: "Straßenverkehr (Baustelle)",
    image: "./images/Baustelle.jpg",
    lat: "52.5652535",
    lon: "13.5062277",
}
*/
const locationsMap = {
    loc1: loc1,
    loc2: loc2,
    loc3: loc3
};


// Logout-Button wird im Login-Screen nicht angezeigt
const logoutBtn = document.querySelector("header button.logout");
if (document.getElementById("login-screen").style.display !== "none") {
    logoutBtn.style.display = "none";
}


//zeigt den gewählten Screen an
function showScreen(id) {
    document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
    const target = document.getElementById(id);
    if (target) target.style.display = "block";

    // Logout-Button wird im Login-Screen nicht angezeigt
    logoutBtn.style.display = (id === "login-screen") ? "none" : "inline-block";
}


// Main-Screen
//switch to Main-Screen nach Login
const loginForm = document.getElementById("loginForm");
const addBtn = document.querySelector("button.add");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // verhindert reload

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (response.status === 200) {
            const user = await response.json();

            // Login erfolgreich
            if (user.role === "admin") isAdminLoggedIn = true;
            else isGuestLoggedIn = true;

            const name = user.name;
            addBtn.style.display = user.role === "admin" ? "inline-block" : "none";
            showScreen("main-screen");
            updateRoleUI();

            document.getElementById("welcome-name").textContent = name;
        } else if (response.status === 401) {
            alert("Falscher Benutzername oder Passwort!");
        } else {
            alert("Login fehlgeschlagen: " + response.status);
        }
    } catch (err) {
        console.error("Fehler beim Login:", err);
        alert("Serververbindung fehlgeschlagen!");
    }
});



// Details-Screen
//switch zu Details-Screen nach click on Location(-überschrift)
let currentLocId = null;

function openDetailsScreen(locId) {
    currentLocId = locId

    const locData = locationsMap[locId];
    if (!locData) return;

    // Zeige Details-Screen
    showScreen("details-screen");
    updateRoleUI();

    // Felder mit den Daten befüllen
    document.getElementById("title_details").value = locData.title;
    document.getElementById("description_details").value = locData.description;
    document.getElementById("street_details").value = locData.street;
    document.getElementById("city_details").value = `${locData.ZIP}, ${locData.city}`;
    document.getElementById("category_details").value = locData.category;
    document.getElementById("image_details").src = locData.image;
    document.getElementById("geocoodinate").value = `${locData.lat}, ${locData.lon}`;
}

document.querySelectorAll(".location .loc-title").forEach(title => {
    title.addEventListener("click", () => {
        const locId = title.closest(".location").id; // z. B. "loc1"
        openDetailsScreen(locId);
    });
});


//Buttons sichtbar/unsichtbar machen für admin/normalo
function updateRoleUI() {
    const addBtns = document.querySelectorAll("button.add");
    const updateBtns = document.querySelectorAll(".aktualisieren");
    const deleteBtns = document.querySelectorAll(".löschen");
    const cancelBtns = document.querySelectorAll(".abbrechen");

    if (isAdminLoggedIn) {
        addBtns.forEach(b => b.style.display = "inline-block");
        updateBtns.forEach(b => b.style.display = "inline-block");
        deleteBtns.forEach(b => b.style.display = "inline-block");
        cancelBtns.forEach(b => b.style.display = "inline-block");
    } else {
        addBtns.forEach(b => b.style.display = "none");
        updateBtns.forEach(b => b.style.display = "none");
        deleteBtns.forEach(b => b.style.display = "none");
        cancelBtns.forEach(b => b.style.display = "none");
    }
}


// Add-Screen
//switch to Add-Screen nach click on "Neue Location hinzufügen"
addBtn.addEventListener("click", function () {
    updateRoleUI();
    showScreen("add-screen");
});


// globaler schließen button
//switch to Main-Screen nach click on button.schließen
document.querySelectorAll(".schließen").forEach(btn => {
    btn.addEventListener("click", () => {
        showScreen("main-screen");
    });
});


//Funktion um neue Locations in HTML einzuarbeiten
function addLocationToHTML(locId, locData) {
    const list = document.getElementById("locations-list");

    const li = document.createElement("li");
    li.classList.add("location");
    li.id = locId;

    li.innerHTML = `
    <h3 class="loc-title">${locData.title}</h3>
    <div class="loc-content">
      <p class="address">
        ${locData.street}, ${locData.ZIP} ${locData.city}
      </p>
      <p class="category">
        Kategorie: <strong>${locData.category}</strong>
      </p>
      <p>
        ${locData.description}
      </p>
      <div class="image-area">
        <img src="${locData.image}" width="300">
      </div>
    </div>
  `;

    list.appendChild(li);

    // Klick-Handler für neuen Standort aktivieren
    li.querySelector(".loc-title").addEventListener("click", () => {
        openDetailsScreen(locId);
    });
}

// Speichern-Button im Add-Screen
const addForm = document.getElementById("add-form");

addForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    // Form-Daten auslesen
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const street = document.getElementById("street").value;
    const cityInput = document.getElementById("city").value.split(','); // "ZIP, Stadt"
    const ZIP = cityInput[0].trim();
    const city = cityInput[1]?.trim() || '';
    const category = document.getElementById("category").value;
    const image = "./images/default.png"; // Platzhalter, bis Bild-Upload kommt
    const geo = await getLatLon(street, ZIP, city);

    if (geo === null) {
        return; // bleibt im Add-Screen
    }

    // Neue Location erstellen
    const newId = `loc${Object.keys(locationsMap).length + 1}`;
    const newLoc = { title, description, street, ZIP, city, category, image, lat: geo.lat, lon: geo.lon};
    locationsMap[newId] = newLoc;

    addLocationToHTML(newId, newLoc);
    showScreen("main-screen");

    // Formular zurücksetzen
    addForm.reset();
});


// Delete-Button im Details-Screen
const deleteBtn = document.querySelector(".löschen");

deleteBtn.addEventListener("click", function () {
    delete locationsMap[currentLocId];                      //Datenobjekt löschen

    const li = document.getElementById(currentLocId);       //Html löschen
    if (li) li.remove();

    showScreen("main-screen");
    currentLocId = null;
});


// Aktualisieren-Button im Details-Screen
const detailsForm = document.getElementById("update-delete-form");

detailsForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const newTitle = document.getElementById("title_details").value;
    const newDescription = document.getElementById("description_details").value;
    const newStreet = document.getElementById("street_details").value;
    const cityInput = document.getElementById("city_details").value.split(",");
    const newZIP = cityInput[0].trim();
    const newCity = cityInput[1]?.trim() || "";
    const newCategory = document.getElementById("category_details").value;
    const geo = await getLatLon(newStreet, newZIP, newCity);

    if (geo === null) {
        return; // bleibt im Add-Screen
    }

    // in locationsMap speichern
    const locData = locationsMap[currentLocId];
    locData.title = newTitle;
    locData.description = newDescription;
    locData.street = newStreet;
    locData.ZIP = newZIP;
    locData.city = newCity;
    locData.category = newCategory;

    // HTML aktualisieren
    const li = document.getElementById(currentLocId);
    li.querySelector(".loc-title").textContent = newTitle;
    li.querySelector(".address").textContent = `${newStreet}, ${newZIP} ${newCity}`;
    li.querySelector(".category strong").textContent = newCategory;
    li.querySelector("p:nth-of-type(3)").textContent = newDescription;

    document.getElementById("geocoodinate").value = `${geo.lat}, ${geo.lon}`;
    showScreen("main-screen");
});


// Logout-Button
logoutBtn.addEventListener("click", async () => {
    isAdminLoggedIn = false;
    isGuestLoggedIn = false;

    addBtn.style.display = "none";
    showScreen("login-screen");
    updateRoleUI();

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
});


// Geokoordinaten-Webservice
async function getLatLon(street, zip, city) {
    const query = encodeURIComponent(`${street} ${zip} ${city}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const respObject = await response.json();
            // wenn kein leeres Array als Antwort kommt
            if (respObject.length > 0) {
                const lat = respObject[0].lat;
                const lon = respObject[0].lon;

                console.log("Gefunden:", lat, lon);
                return { lat, lon };
            }
            // wenn ein leeres Array als Antwort kommt
            else {
                alert("Keinen Standort gefunden. Bitte Adresse überprüfen.");
                return null;
            }
        } else {
            const resp = await response.text();
            console.log("Server response was not 200er: ", resp);
            return null;
        }
    } catch (err) {
        console.log("Error connecting to server: ", err.message);
        return null;
    }
}


