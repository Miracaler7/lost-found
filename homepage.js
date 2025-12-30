let ITEMS = [];

async function loadItems() {
  const res = await fetch("http://localhost:3000/found-items");
  const data = await res.json();
  ITEMS = data.items || [];
  renderItems();
}

function renderItems() {
  const c = document.getElementById("itemsContainer");
  c.innerHTML = "";

  if (!ITEMS.length) {
    c.innerHTML = "<p style='margin:25px'>No items available</p>";
    return;
  }

  ITEMS.forEach(item => {
    c.innerHTML += `
      <div class="item-card" onclick="openClaim('${item._id}')">
        <img src="http://localhost:3000${item.image_url}" class="item-img">
        <h3>${item.item_name}</h3>
        <p>${item.location_found}</p>
      </div>
    `;
  });
}

/* ---------------- CLAIM POPUP ---------------- */

function openClaim(id) {
  const item = ITEMS.find(i => i._id === id);

  document.getElementById("popupContent").innerHTML = `
    <h3>${item.item_name}</h3>
    <img src="http://localhost:3000${item.image_url}">
    <p><b>Location:</b> ${item.location_found}</p>
    <p>${item.description || "No description provided"}</p>

    <input id="ce" placeholder="College Email">
    <input id="cp" placeholder="Phone Number">
    <input id="cu" placeholder="USN">

    <button class="btn btn-success" onclick="submitClaim('${item._id}')">Submit Claim</button>
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

  alert("Claim request sent to admin");
  closePopup();
}

function closePopup() {
  document.getElementById("itemPopup").style.display = "none";
}

window.onload = loadItems;
