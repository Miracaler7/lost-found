let FOUND_ITEMS = [];
let RETURNED_ITEMS = [];

let FILTERED_FOUND = [];
let FILTERED_RETURNED = [];

/* ================= LOAD ================= */

async function loadAll() {
  await loadFound();
  await loadReturned();
}

async function loadFound() {
  const res = await fetch("http://localhost:3000/found-items");
  const data = await res.json();
  FOUND_ITEMS = data.items || [];
  FILTERED_FOUND = [...FOUND_ITEMS];
  renderFound();
}

async function loadReturned() {
  const res = await fetch("http://localhost:3000/returned-items");
  const data = await res.json();
  RETURNED_ITEMS = data.returned || [];
  FILTERED_RETURNED = [...RETURNED_ITEMS];
  renderReturned();
}

/* ================= SEARCH ================= */

function handleSearch(query) {
  const q = query.toLowerCase().trim();

  FILTERED_FOUND = FOUND_ITEMS.filter(i =>
    i.item_name.toLowerCase().includes(q) ||
    i.location_found.toLowerCase().includes(q)
  );

  renderFound();
}

/* ================= CATEGORY FILTER ================= */

function filterByCategory(category) {
  if (category === "all") {
    FILTERED_FOUND = [...FOUND_ITEMS];
  } else {
    FILTERED_FOUND = FOUND_ITEMS.filter(i =>
      (i.category || "Miscellaneous") === category
    );
  }
  renderFound();
}

/* ================= RENDER FOUND ================= */

function renderFound() {
  const c = document.getElementById("itemsContainer");
  c.innerHTML = "";

  if (!FILTERED_FOUND.length) {
    c.innerHTML = "<p style='margin:20px'>No items found</p>";
    return;
  }

  FILTERED_FOUND.forEach(item => {
    const category = item.category || "Miscellaneous";

    c.innerHTML += `
      <div class="item-card" onclick="openClaim('${item._id}')">
        <img
          src="http://localhost:3000${item.image_url}"
          class="item-img"
          onerror="this.onerror=null;this.src='images/placeholder.png'"
        >
        <h3>${item.item_name}</h3>
        <p>${category}</p>
        <p>${item.location_found}</p>
        <p><b>Contact:</b> ${item.finder_phone}</p>
      </div>
    `;
  });
}

/* ================= RENDER RETURNED ================= */

function renderReturned() {
  const c = document.getElementById("returnedContainer");
  c.innerHTML = "";

  if (!FILTERED_RETURNED.length) {
    c.innerHTML = "<p style='margin:20px'>No returned items</p>";
    return;
  }

  FILTERED_RETURNED.forEach(r => {
    const i = r.item;
    const category = i.category || "Miscellaneous";

    c.innerHTML += `
      <div class="item-card">
        <img
          src="http://localhost:3000${i.image_url}"
          class="item-img"
          onerror="this.onerror=null;this.src='images/placeholder.png'"
        >
        <h3>${i.item_name}</h3>
        <p>${category}</p>
        <p>${i.location_found}</p>
        <p><b>Claimed By</b></p>
        <p>${r.claimant_email}</p>
        <p>${r.claimant_phone}</p>
      </div>
    `;
  });
}

/* ================= ADD ITEM ================= */

function openAddPopup() {
  document.getElementById("popupContent").innerHTML = `
    <h3>Add Found Item</h3>

    <input id="item_name" placeholder="Item Name">
    <select id="category">
      <option>Electronics</option>
      <option>Documents</option>
      <option>Wallets & Bags</option>
      <option>Personal Accessories</option>
      <option>Clothing</option>
      <option>Books & Study Material</option>
      <option>Money & Valuables</option>
      <option>Daily Essentials</option>
      <option>Sports Items</option>
      <option>Miscellaneous</option>
    </select>

    <input id="location_found" placeholder="Location Found">
    <input id="date_found" type="date">
    <textarea id="description" placeholder="Description"></textarea>
    <input id="finder_email" placeholder="College Email">
    <input id="finder_phone" placeholder="Phone Number">
    <input type="file" id="item_image">

    <button class="btn btn-success" onclick="submitItem()">Submit</button>
    <button class="btn btn-outline" onclick="closePopup()">Cancel</button>
  `;

  document.getElementById("itemPopup").style.display = "flex";
}

async function submitItem() {
  const fd = new FormData();
  fd.append("item_name", item_name.value);
  fd.append("category", category.value);
  fd.append("location_found", location_found.value);
  fd.append("date_found", date_found.value);
  fd.append("description", description.value);
  fd.append("finder_email", finder_email.value);
  fd.append("finder_phone", finder_phone.value);
  fd.append("image", item_image.files[0]);

  const res = await fetch("http://localhost:3000/add-found-item", {
    method: "POST",
    body: fd
  });

  const data = await res.json();

  if (data.success) {
    alert("Item sent to admin for approval");
    closePopup();
    loadFound();
  } else {
    alert("Error submitting item");
  }
}

/* ================= CLAIM ================= */

function openClaim(id) {
  const item = FOUND_ITEMS.find(i => i._id === id);
  const category = item.category || "Miscellaneous";

  document.getElementById("popupContent").innerHTML = `
    <h3>${item.item_name}</h3>
    <img
      src="http://localhost:3000${item.image_url}"
      onerror="this.onerror=null;this.src='images/placeholder.png'"
    >
    <p><b>Category:</b> ${category}</p>
    <p><b>Location:</b> ${item.location_found}</p>
    <p><b>Date Found:</b> ${item.date_found}</p>
    <p><b>Finder Contact:</b> ${item.finder_phone}</p>
    <p>${item.description || "No description"}</p>

    <input id="ce" placeholder="College Email">
    <input id="cp" placeholder="Phone Number">
    <input id="cu" placeholder="USN">

    <button class="btn btn-success" onclick="submitClaim('${item._id}')">
      Submit Claim
    </button>
    <button class="btn btn-outline" onclick="closePopup()">Cancel</button>
  `;

  document.getElementById("itemPopup").style.display = "flex";
}

async function submitClaim(id) {
  await fetch("http://localhost:3000/claim-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      item_id: id,
      claimant_email: ce.value,
      claimant_phone: cp.value,
      claimant_usn: cu.value
    })
  });

  alert("Claim sent to admin");
  closePopup();
}

/* ================= UTILS ================= */

function closePopup() {
  document.getElementById("itemPopup").style.display = "none";
}

function logout() {
  localStorage.removeItem("loggedInEmail");
  window.location.href = "UserAdmin.html";
}

window.onload = loadAll;
