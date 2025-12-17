let ALL_ITEMS = [];

// ======================= LOAD ITEMS =======================
async function loadItems() {
  try {
    const res = await fetch("http://localhost:3000/found-items");
    const data = await res.json();

    if (data.success) {
      ALL_ITEMS = data.items;
      renderLists();
    }
  } catch (err) {
    console.error(err);
  }
}

// ======================= RENDER LISTS =======================
function renderLists() {
  const foundContainer = document.getElementById("itemsContainer");
  const returnedContainer = document.getElementById("returnedContainer");

  foundContainer.innerHTML = "";
  returnedContainer.innerHTML = "";

  const found = ALL_ITEMS.filter(i => !i.returned);
  const returned = ALL_ITEMS.filter(i => i.returned);

  renderItemCards(found, foundContainer);
  renderItemCards(returned, returnedContainer);
}

function renderItemCards(list, container) {
  if (!list.length) {
    container.innerHTML = "<p>No items</p>";
    return;
  }

  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "item-card";

    div.innerHTML = `
      ${item.image_url ? `<img src="http://localhost:3000${item.image_url}" class="item-img">` : ""}
      <h3>${item.item_name}</h3>
      <p><strong>Location:</strong> ${item.location_found}</p>
      <p>${item.finder_email} • ${item.finder_phone}</p>
    `;

    div.onclick = () => openViewPopup(item);
    container.appendChild(div);
  });
}

// ======================= VIEW ITEM POPUP =======================
function openViewPopup(item) {
  document.getElementById("popupContent").innerHTML = `
    <h2>${item.item_name}</h2>
    <p><strong>Location:</strong> ${item.location_found}</p>
    <p>${item.description || "No description provided"}</p>

    <h3>Finder Details</h3>
    <p>${item.finder_email}</p>
    <p>${item.finder_phone}</p>

    <button style="background:#007bff;color:white"
      onclick="startClaim('${item._id}','${item.finder_email}','${item.finder_phone}')">
      Claim Item
    </button>

    <button onclick="closePopup()">Close</button>
  `;

  document.getElementById("itemPopup").style.display = "flex";
}

function closePopup() {
  document.getElementById("itemPopup").style.display = "none";
}

// ======================= ADD ITEM POPUP =======================
function openAddPopup() {
  document.getElementById("popupContent").innerHTML = `
    <h2>Add Found Item</h2>

    <input id="item_name" placeholder="Item Name *">
    <input id="location_found" placeholder="Location Found *">
    <textarea id="description" placeholder="Short Description (optional)"></textarea>
    <input id="finder_email" placeholder="College Email (@bmsce.ac.in) *">
    <input id="finder_phone" placeholder="Phone Number (10 digits) *">
    <input id="item_image" type="file" accept="image/*">

    <button style="background:#28a745;color:white" onclick="submitItem()">Submit</button>
    <button onclick="closePopup()">Cancel</button>
  `;

  document.getElementById("itemPopup").style.display = "flex";
}

// ======================= SUBMIT ITEM (WITH VALIDATION) =======================
async function submitItem() {
  const name = document.getElementById("item_name").value.trim();
  const location = document.getElementById("location_found").value.trim();
  const email = document.getElementById("finder_email").value.trim();
  const phone = document.getElementById("finder_phone").value.trim();
  const image = document.getElementById("item_image").files[0];
  const desc = document.getElementById("description").value;

  // Mandatory check
  if (!name || !location || !email || !phone || !image) {
    alert("All fields except description are mandatory");
    return;
  }

  // Email validation
  if (!email.endsWith("@bmsce.ac.in")) {
    alert("Email must be a valid @bmsce.ac.in address");
    return;
  }

  // Phone validation (exactly 10 digits)
  if (!/^[0-9]{10}$/.test(phone)) {
    alert("Phone number must be exactly 10 digits");
    return;
  }

  const formData = new FormData();
  formData.append("item_name", name);
  formData.append("location_found", location);
  formData.append("description", desc);
  formData.append("finder_email", email);
  formData.append("finder_phone", phone);
  formData.append("image", image);

  try {
    const res = await fetch("http://localhost:3000/add-found-item", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert("Item added successfully!");
      closePopup();
      loadItems();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Server error");
    console.error(err);
  }
}

// ======================= SEARCH =======================
document.getElementById("searchBar").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();

  const foundContainer = document.getElementById("itemsContainer");
  const returnedContainer = document.getElementById("returnedContainer");

  foundContainer.innerHTML = "";
  returnedContainer.innerHTML = "";

  if (!query) {
    renderLists();
    return;
  }

  const filtered = ALL_ITEMS.filter(item =>
    item.item_name.toLowerCase().includes(query) ||
    item.location_found.toLowerCase().includes(query)
  );

  renderItemCards(filtered.filter(i => !i.returned), foundContainer);
  renderItemCards(filtered.filter(i => i.returned), returnedContainer);
});

// ======================= INIT =======================
window.addEventListener("DOMContentLoaded", loadItems);
