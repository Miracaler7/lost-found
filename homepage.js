// homepage.js
let ALL_ITEMS = [];
let LOGGED_EMAIL = localStorage.getItem("loggedInEmail");

// ======================= ADD ITEM =======================
document.getElementById('addItemForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = document.getElementById('addItemForm');
  const formData = new FormData(form);

  const fileInput = document.getElementById('item_image');
  if (fileInput?.files.length) {
    formData.set('image', fileInput.files[0]);
  }

  try {
    const res = await fetch('http://localhost:3000/add-found-item', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert('Item uploaded successfully!');
      form.reset();
      loadItems();
    } else {
      alert('Upload failed: ' + data.message);
    }
  } catch (err) {
    alert('Server error');
    console.error(err);
  }
});

// ======================= FETCH ITEMS =======================
async function loadItems() {
  try {
    const res = await fetch('http://localhost:3000/found-items');
    const data = await res.json();

    if (data.success) {
      ALL_ITEMS = data.items;
      renderLists();
    }
  } catch (err) {
    console.error(err);
  }
}

// ======================= RENDER LIST =======================
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

// ======================= RENDER CARDS =======================
function renderItemCards(list, container) {
  if (!list.length) {
    container.innerHTML = "<p>No items</p>";
    return;
  }

  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "item-card";
    div.style.cursor = "pointer";

    div.innerHTML = `
      ${item.image_url ? `<img src="http://localhost:3000${item.image_url}" 
        class="item-img">` : ""}
      <h3>${item.item_name}</h3>
      <p><strong>Location:</strong> ${item.location_found}</p>
      ${item.description ? `<p><strong>Description:</strong> ${item.description}</p>` : ""}
      <p>${item.finder_email} • ${item.finder_phone}</p>
    `;

    div.onclick = () => openPopup(item);
    container.appendChild(div);
  });
}

// ======================= POPUP =======================
function openPopup(item) {
  const popup = document.getElementById("itemPopup");
  const box = document.getElementById("popupContent");

  box.innerHTML = `
    ${item.image_url ? `<img src="http://localhost:3000${item.image_url}" 
      style="width:100%; border-radius:10px; margin-bottom:10px;">` : ""}

    <h2>${item.item_name}</h2>
    <p><strong>Location:</strong> ${item.location_found}</p>
    <p><strong>Description:</strong> ${item.description || 'None'}</p>

    <h3>Finder Details</h3>
    <p><strong>Email:</strong> ${item.finder_email}</p>
    <p><strong>Phone:</strong> ${item.finder_phone}</p>

    <button onclick="startClaim('${item._id}', '${item.finder_email}', '${item.finder_phone}')"
      style="margin-top:15px; padding:10px; background:#007bff; color:white; border:none; border-radius:8px; width:100%;">
      Claim Item
    </button>

    <button onclick="closePopup()"
      style="margin-top:10px; padding:10px; background:#ccc; border:none; border-radius:8px; width:100%;">
      Close
    </button>
  `;

  popup.style.display = "flex";
}

function closePopup() {
  document.getElementById("itemPopup").style.display = "none";
}

// ======================= CLAIM =======================
function startClaim(itemId, finderEmail, finderPhone) {
  const box = document.getElementById("popupContent");

  box.innerHTML = `
    <h2>Claim This Item</h2>

    <p><strong>Finder Email:</strong> ${finderEmail}</p>
    <p><strong>Finder Phone:</strong> ${finderPhone}</p>

    <input id="claim_email" placeholder="Your BMSCE Email">
    <input id="claim_usn" placeholder="Your USN">
    <input id="claim_phone" placeholder="Your Phone">

    <button onclick="submitClaim('${itemId}')">Submit Claim</button>
    <button onclick="closePopup()">Cancel</button>
  `;
}

// ======================= SUBMIT CLAIM =======================
async function submitClaim(itemId) {
  const email = document.getElementById("claim_email").value;
  const usn = document.getElementById("claim_usn").value;
  const phone = document.getElementById("claim_phone").value;

  const res = await fetch(`http://localhost:3000/claim-item/${itemId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      claimant_email: email,
      claimant_usn: usn,
      claimant_phone: phone
    })
  });

  const data = await res.json();

  if (data.success) {
    alert("Claim submitted successfully!");
    closePopup();
  } else {
    alert(data.message);
  }
}

// ======================= SEARCH (FIXED) =======================
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

  const found = filtered.filter(i => !i.returned);
  const returned = filtered.filter(i => i.returned);

  renderItemCards(found, foundContainer);
  renderItemCards(returned, returnedContainer);
});

// ======================= INITIAL LOAD =======================
window.addEventListener("DOMContentLoaded", loadItems);
