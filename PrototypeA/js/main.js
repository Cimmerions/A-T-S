const supabaseUrl = "https://ycoloekqdbytrtffqjzp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljb2xvZWtxZGJ5dHJ0ZmZxanpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDM0OTYsImV4cCI6MjA5MjE3OTQ5Nn0.X3WV9UwOcPkb0dZtVgFfu4vuhPJF_FIQRjeOdyiu8r4";
const geoCache = {};
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

function normalizeQuartier(value) {
    if (!value) return "";

    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .replace(/^./, char => char.toUpperCase());
}

function updateQuartierFilter(data){
    const select = document.getElementById("filterQuartier");

    const quartiers = [
    ...new Set(
        data.map(s => normalizeQuartier(s.quartier))
    )
];

    select.innerHTML = `<option value="">Tous quartiers</option>`;

    quartiers.forEach(q => {
        const option = document.createElement("option");
        option.value = q;
        option.textContent = q;
        select.appendChild(option);
    });
}

const myNumber = "22893264869";

let map;

function initMap(){
    map = L.map('map').setView([6.135, 1.217], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

    setTimeout(() => {
        map.invalidateSize();
}, 500);    
}

const premiumIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
    iconSize: [32,32]
});
const normalIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    iconSize: [32,32]
});

let items = [];

async function addCard(name, phone, service, quartier, isPremium) {

const geoCache = {};
const coords = await geocode(quartier);
const [baselat, baselng] = coords;

const lat = baselat + (Math.random() - 0.5) * 0.005;
const lng = baselng + (Math.random() - 0.5) * 0.005;

const card = document.createElement("div");
card.className = "card" + (isPremium === true ? " premium" : "");

card.dataset.service = service;
card.dataset.quartier = normalizeQuartier(quartier);

if(isPremium === true){
    const d = new Date();
    d.setDate(d.getDate() + 30);
    card.dataset.exp = d.toISOString();
}

card.innerHTML = `
<div style="font-weight:bold; font-size:16px;">
${name}
</div>

<div style="font-size:13px; color:#555; margin:5px 0;">
${service} • ${quartier}
</div>

<div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
<button class="whatsapp" onclick="contact('${phone}', '${service}', '${quartier}')">
<i class="fa-brands fa-whatsapp"></i> WhatsApp
</button>
<button class="call" onclick="call('${phone}')">
<i class="fa-solid fa-phone"></i> Appeler
</button>
<button class="payment" onclick="securePay('${name}','${service}','${quartier}')">
<i class="fa-solid fa-wallet"></i> Paiement sécurisé
</button>
<button class="loc" onclick="locate(${lat},${lng})">
<i class="fa-solid fa-location-dot"></i> Localiser
</button>
</div>
`;

    const container = document.getElementById("servicesList");

    if(isPremium){
        container.insertBefore(card, container.firstChild);
    } else {
        container.appendChild(card);
    }

    const marker = L.marker([lat,lng], {
        icon: isPremium === true ? premiumIcon : normalIcon
    }).addTo(map).bindPopup(name + " - " + service);

    items.push({card, marker});
}

function locate(lat, lng){

const mapEl = document.getElementById("map");

mapEl.scrollIntoView({
    behavior: "smooth",
    block: "center"
});

setTimeout(() => {

    map.invalidateSize();

    map.setView([lat, lng], 17, {
        animate: true,
        duration: 1.2
    });

    let targetMarker = null;

    items.forEach(obj => {
        const pos = obj.marker.getLatLng();

        if (
            Math.abs(pos.lat - lat) < 0.0001 &&
            Math.abs(pos.lng - lng) < 0.0001
        ) {
            targetMarker = obj.marker;
        }
    });

    if (targetMarker) {

        targetMarker.openPopup();

        map.panTo(targetMarker.getLatLng(), {
            animate: true,
            duration: 1
        });

        const icon = targetMarker._icon;
        if (icon) {
            icon.style.transition = "transform 0.4s ease";
            icon.style.transform = "scale(1.5)";
            setTimeout(() => {
                icon.style.transform = "scale(1)";
            }, 400);
        }
    }

    const circle = L.circle([lat, lng], {
            radius: 80,
            color: "#0a7cff",
            fillColor: "#0a7cff",
            fillOpacity: 0.2
        }).addTo(map);

        setTimeout(() => {
            map.removeLayer(circle);
        }, 5000);

    if (navigator.vibrate) {
        navigator.vibrate(80);
    }

}, 650);
}

function getCoords(quartier){
    const coords = {
        "Hedzranawoé": [6.17171, 1.23718],
        "Adidogomé": [6.12984, 1.21964],
        "Tokoin": [6.14167, 1.20815],
        "Bè": [6.14315, 1.24647],
        "Kégué": [6.20300, 1.24168],
        "Agoè": [6.24000, 1.19946],
        "Caisse": [6.17315, 1.23192],
    }
    return coords[quartier] || [6.135, 1.217];
}

function contact(num, service, quartier){

let message =
"Bonjour 👋%0A" +
"Je viens depuis ÀTonService.%0A%0A" +
"Je suis intéressé par ton service de : " + service + "%0A" +
"Localisation : " + quartier + "%0A%0A" +
"Es-tu disponible maintenant ?";

let url = "https://wa.me/" + num + "?text=" + message;

window.open(url, "_blank");
}

let currentPayment = {};

function securePay(name, service, quartier){

    currentPayment = { name, service, quartier };

    document.getElementById("payName").innerText = name;
    document.getElementById("payService").innerText = service;
    document.getElementById("payQuartier").innerText = quartier;

    document.getElementById("paymentModal").style.display = "flex";

    document.getElementById("payBtn").addEventListener("click", async () => {

const phone = document.getElementById("payPhone").value.trim();
const amount = document.getElementById("payAmount").value.trim();

if(!phone || !amount){
    showToast("Remplis tous les champs", "error");
    return;
}

const paymentData = {
    client_phone: phone,
    provider_name: currentPayment.name,
    service: currentPayment.service,
    quartier: currentPayment.quartier,
    amount: parseInt(amount),
    status: "pending"
};

try {

    const { error } = await db
        .from("payments")
        .insert([paymentData]);

    if(error){
        console.error(error);
        showToast("Erreur paiement", "error");
        return;
    }

    closePaymentModal();

    const confirmModal = document.getElementById("confirmModal");
    confirmModal.style.display = "flex";

    document.getElementById("confirmText").innerText =
        "Paiement de " + amount + " FCFA en cours...";

    let msg =
    "Paiement sécurisé ÀTonService%0A%0A" +
    "Client: " + phone + "%0A" +
    "Montant: " + amount + " FCFA%0A%0A" +
    "Prestataire: " + currentPayment.name + "%0A" +
    "Service: " + currentPayment.service + "%0A" +
    "Quartier: " + currentPayment.quartier + "%0A%0A" +
    "Le service a été effectué, je souhaite régler la note.";

    const wa = window.open("", "_blank");

    setTimeout(() => {

        if (wa) {
            wa.location.href =
                "https://wa.me/22893264869?text=" + msg;
        } else {
            window.location.href =
                "https://wa.me/22893264869?text=" + msg;
        }
    
    }, 1800);

} catch (err) {
    console.error(err);
    showToast("Erreur réseau", "error");
}
});

}

function closePaymentModal(){
    document.getElementById("paymentModal").style.display = "none";
}

function call(num){
    window.location.href = "tel:" + num;
}

function toggleWarning(el) {
    el.classList.toggle("active");
}

function toggleAcc(element) {
    element.classList.toggle("active");
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

async function loadServices() {

const { data, error } = await db
    .from("services")
    .select("*")
    .order("id", { ascending: false });

    if (error) {
    console.log("ERROR:", error);
    return;
}

document.getElementById("servicesList").innerHTML = "";
items = [];

data.forEach(s => {
    addCard(s.name, s.phone, s.service, s.quartier, s.premium);
});

updateQuartierFilter(data);

}

async function geocode(quartier){

if(geoCache[quartier]){
    return geoCache[quartier];
}

const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizeQuartier(quartier) + " Lomé Togo")}`
);

const data = await res.json();

const result = data.length > 0
    ? [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    : [6.135, 1.217];

geoCache[quartier] = result;

return result;
}

async function register() {

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const quartierInput = document.getElementById("quartier");
const serviceInput = document.getElementById("service");
const premiumInput = document.getElementById("premium");
const btn = document.getElementById("signupBtn");

const name = nameInput.value.trim();
const phone = phoneInput.value.trim();
const service = serviceInput.value;
const quartier = normalizeQuartier(quartierInput.value);
const premium = premiumInput.value === "1" ? 1 : 0;

if (!name || !phone || !quartier) {
    alert("Veuillez remplir tous les champs!");
    return;
}

btn.innerText = "⏳ Enregistrement...";
btn.disabled = true;

try {

    const { error } = await db
        .from("services")
        .insert([{ name, phone, service, quartier, premium }]);

    if (error) {
        console.log("SUPABASE ERROR:", error);
        alert(error.message);
        return;
    }

    const wa = window.open("", "_blank");

    await loadServices();

    wa.location.href =
    "https://wa.me/" + myNumber +
    "?text=Nouvelle inscription " + name;

    alert("✅ Inscription réussie");

    nameInput.value = "";
    phoneInput.value = "";
    quartierInput.value = "";
    serviceInput.selectedIndex = 0;
    premiumInput.selectedIndex = 0;

} catch (err) {
    console.error("REGISTER FAIL:", err);
    alert("Erreur réseau ou Supabase");
} finally {
    btn.innerText = "S'inscrire";
    btn.disabled = false;
}
}

function filterCards(){
    const search = document.getElementById("search").value.toLowerCase();
    const fs = document.getElementById("filterService").value;
    const fq = normalizeQuartier(
    document.getElementById("filterQuartier").value
);

    items.forEach(obj => {
        const text = obj.card.innerText.toLowerCase();
        const service = obj.card.dataset.service;
        const quartier = normalizeQuartier(obj.card.dataset.quartier);

        const show =
            text.includes(search) &&
            (!fs || service === fs) &&
            (!fq || quartier === fq);

            obj.card.style.display = show ? "" : "none";
        obj.marker.setOpacity(show ? 1 : 0);
    });
}

document.addEventListener("DOMContentLoaded", () => {

const name = document.getElementById("name");
const phone = document.getElementById("phone");
const quartier = document.getElementById("quartier");
const signupBtn = document.getElementById("signupBtn");

const modal = document.getElementById("policyModal");
const checkbox = document.getElementById("acceptPolicy");
const confirmBtn = document.getElementById("confirmBtn");

function checkForm(){
    const valid =
        name.value.trim() &&
        phone.value.trim() &&
        quartier.value.trim();

    signupBtn.disabled = !valid;
}

name.addEventListener("input", checkForm);
phone.addEventListener("input", checkForm);
quartier.addEventListener("input", checkForm);

checkForm();

signupBtn.addEventListener("click", () => {

    if(signupBtn.disabled){
        alert("Remplis tous les champs");
        return;
    }

    modal.style.display = "flex";
});

window.closeModal = function(){
    modal.style.display = "none";

    checkbox.checked = false;
    confirmBtn.disabled = true;
    confirmBtn.classList.remove("active");
};

checkbox.addEventListener("change", () => {
    confirmBtn.disabled = !checkbox.checked;
    confirmBtn.classList.toggle("active", checkbox.checked);
});

confirmBtn.addEventListener("click", async () => {

try {
    closeModal();

    await register();

} catch (err) {
    console.error(err);
    alert("Erreur lors de l'inscription");
} finally {
    resetModalState();
}

});
});

function resetModalState(){

const checkbox = document.getElementById("acceptPolicy");
const confirmBtn = document.getElementById("confirmBtn");

checkbox.checked = false;

confirmBtn.disabled = true;
confirmBtn.classList.remove("active");
confirmBtn.innerText = "Continuer";
}

window.addEventListener("pageshow", () => {
    closeModal();
});

function checkExpiration(){
    const now = new Date();

    items.forEach(obj => {
        const exp = obj.card.dataset.exp;
        if(exp && new Date(exp) < now){
    obj.card.classList.remove("premium");
    obj.marker.setIcon(normalIcon);
}
    });
}

function seed(){
    addCard("Kossi","22890000001","Nettoyage","Hedzranawoé",true);
    addCard("Mensah","22890000002","Lavage","Adidogomé",false);
    addCard("Sika","22890000004","Réparation","Bè",false);
    addCard("ken", "22893264869","Courses","Hedzranawoé",true);
    addCard("Hermann","22898242529","Nettoyage","Kégué",true);
    addCard("Godwin","22897137226","Nettoyage","Kégué",false);
    addCard("EGBARE","22870324626","Courses","Agoè",false);
    addCard("Christian","22872395692","Nettoyage","Hedzranawoé",false);
    addCard("Essi","22891245775","Nettoyage","Caisse millenium cite oua",false);
}

window.onload = async function(){
    initMap();       
    await loadServices(); 
};

document.addEventListener("visibilitychange", () => {

if (document.visibilityState === "visible") {

    const confirmModal = document.getElementById("confirmModal");

    if(confirmModal && confirmModal.style.display === "flex"){
        confirmModal.style.display = "none";

        showToast("Retour sur ÀTonService 👋", "info");
    }

}
});
