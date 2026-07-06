// Kamadhenu Veg - Owner & Staff Administration Panel Logic

let currentRole = "Owner";
let activeTab = "tab-overview";
let previousOrdersCount = 0;
let activeOrderFilter = "all"; // Options: all, pickup, dinein, Preparing, Ready, Completed, Cancelled

document.addEventListener("DOMContentLoaded", async () => {
  // Force passcode login on every page load/refresh
  sessionStorage.removeItem("km_admin_auth");

  // Check auth
  checkSessionAuth();
  
  // Initialize role
  const roleSel = document.getElementById("role-selector");
  if (roleSel) {
    roleSel.value = currentRole;
    updateRoleUI();
  }

  // Register Tab Navigation Click Listeners
  const navItems = document.querySelectorAll(".nav-menu .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      await switchTab(tabId);
    });
  });

  // Today's Special Editor submit listener
  const specForm = document.getElementById("special-editor-form");
  if (specForm) {
    specForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!checkPermission("Manager")) return;

      const name = document.getElementById("special-edit-name").value;
      const price = parseFloat(document.getElementById("special-edit-price").value);
      const badge = document.getElementById("special-edit-badge").value;
      const desc = document.getElementById("special-edit-desc").value;
      const image = document.getElementById("special-edit-image").value;
      const discount = document.getElementById("special-edit-discount").value;

      await DB.saveSpecial({ name, price, badge, description: desc, image, discount });
      addAuditLog(`Updated Today's Special to: "${name}"`, currentRole);
      alert("Chef's Special updated successfully! Changes are live on the customer site.");
    });
  }

  // Menu editor form submit listener
  const menuForm = document.getElementById("menu-editor-form");
  if (menuForm) {
    menuForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!checkPermission("Manager")) return;

      const id = document.getElementById("menu-item-id").value;
      const name = document.getElementById("menu-item-name").value;
      const price = parseFloat(document.getElementById("menu-item-price").value);
      const category = document.getElementById("menu-item-cat").value;
      const description = document.getElementById("menu-item-desc").value;
      const image = document.getElementById("menu-item-image").value;
      const badgeVal = document.getElementById("menu-item-badge").value;
      const availability = document.getElementById("menu-item-avail").value;

      const menu = await DB.getMenu();
      if (id) {
        // Edit Mode
        const idx = menu.findIndex(i => i.id === id);
        if (idx !== -1) {
          menu[idx] = {
            id, name, price, category, description, image,
            bestSeller: badgeVal === "bestSeller",
            availability, isVeg: true
          };
          addAuditLog(`Modified Menu Catalog Item: "${name}"`, currentRole);
        }
      } else {
        // Add Mode
        const newId = "m_" + Date.now();
        menu.push({
          id: newId, name, price, category, description, image,
          bestSeller: badgeVal === "bestSeller",
          availability, isVeg: true
        });
        addAuditLog(`Added New Menu Catalog Item: "${name}"`, currentRole);
      }

      await DB.saveMenu(menu);
      alert("Menu catalog updated successfully!");
      resetMenuForm();
      await renderMenuCatalog();
      await renderOverviewTab(); // Re-render overview reports
    });
  }

  // Site Content Customizer form
  const contentForm = document.getElementById("content-settings-form");
  if (contentForm) {
    contentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!checkPermission("Manager")) return;
      
      const headline = document.getElementById("settings-hero-title").value;
      const hoursText = document.getElementById("settings-hours-text").value;
      const whatsapp = document.getElementById("settings-whatsapp").value.trim();

      localStorage.setItem("settings_hero_title", headline);
      localStorage.setItem("settings_hours_text", hoursText);
      localStorage.setItem("settings_whatsapp_phone", whatsapp);

      // Save prep times
      const prepTimes = {
        "Starters": parseInt(document.getElementById("prep-time-starters").value),
        "Soups": parseInt(document.getElementById("prep-time-soups").value),
        "Main Course": parseInt(document.getElementById("prep-time-main").value),
        "Breads": parseInt(document.getElementById("prep-time-breads").value),
        "Rice & Noodles": parseInt(document.getElementById("prep-time-rice").value),
        "Desserts": parseInt(document.getElementById("prep-time-desserts").value),
        "Beverages": parseInt(document.getElementById("prep-time-beverages").value)
      };
      await DB.savePrepTimes(prepTimes);

      addAuditLog(`Updated site content settings & category prep times`, currentRole);
      alert("Content & category preparation times applied! Visitable on the live website.");
    });
  }

  // Load Initial Tab Data
  await renderTabContent();

  // Initialize previous count for order checking
  const allOrders = [...await DB.getOrders(), ...await DB.getReservations()];
  previousOrdersCount = allOrders.length;

  // Set Interval to check for incoming orders & trigger sound notification
  setInterval(checkNewIncomingOrders, 4000);
});

// 1. Session Auth Logic
function checkSessionAuth() {
  if (sessionStorage.getItem("km_admin_auth") === "true") {
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("dashboard-wrapper").style.display = "flex";
    currentRole = sessionStorage.getItem("km_admin_role") || "Owner";
  }
}

async function verifyLogin() {
  const code = document.getElementById("passcode-input").value;
  if (code === "1234") {
    sessionStorage.setItem("km_admin_auth", "true");
    sessionStorage.setItem("km_admin_role", "Owner");
    currentRole = "Owner";
    
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("dashboard-wrapper").style.display = "flex";
    
    initAuditLogs();
    addAuditLog("Staff authenticated session successfully", currentRole);
    await renderTabContent();
  } else {
    alert("Incorrect administrative passcode! Please try again.");
  }
}

function handleLogout() {
  addAuditLog("Staff terminated active session", currentRole);
  sessionStorage.removeItem("km_admin_auth");
  sessionStorage.removeItem("km_admin_role");
  document.getElementById("login-overlay").style.display = "flex";
  document.getElementById("dashboard-wrapper").style.display = "none";
}

// Check Permission level helper
function checkPermission(requiredRole) {
  const roles = ["Staff", "Manager", "Owner"];
  const currentIdx = roles.indexOf(currentRole);
  const reqIdx = roles.indexOf(requiredRole);

  if (currentIdx < reqIdx) {
    alert(`Access Denied! Your active role is '${currentRole}', but this action requires at least '${requiredRole}' privileges.`);
    return false;
  }
  return true;
}

function changeAccessRole(role) {
  currentRole = role;
  sessionStorage.setItem("km_admin_role", role);
  addAuditLog(`Access privilege role toggled to: ${role}`, role);
  updateRoleUI();
}

function updateRoleUI() {
  const badge = document.getElementById("role-display-badge");
  if (badge) {
    badge.textContent = `Role: ${currentRole}`;
    
    if (currentRole === "Owner") badge.style.backgroundColor = "#d4af37";
    else if (currentRole === "Manager") badge.style.backgroundColor = "#0284c7";
    else badge.style.backgroundColor = "#6b7280";
  }
}

// Tab Switching Routing
async function switchTab(tabId) {
  activeTab = tabId;
  
  document.querySelectorAll(".nav-menu .nav-item").forEach(item => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  document.querySelectorAll(".tab-page").forEach(page => {
    if (page.id === tabId) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });

  const title = document.getElementById("tab-title-text");
  if (title) {
    if (tabId === "tab-overview") title.textContent = "Overview Statistics & Reports";
    if (tabId === "tab-orders") title.textContent = "Orders & Reservation Bookings";
    if (tabId === "tab-menu") title.textContent = "Menu Catalog & Inventory Settings";
    if (tabId === "tab-special") title.textContent = "Chef's Recommendation Management";
    if (tabId === "tab-customers") title.textContent = "Loyalty Program & Campaigns";
    if (tabId === "tab-settings") title.textContent = "Guest Feedback & Website Settings";
  }

  await renderTabContent();
}

// 2. Dispatchers to Render Active Tab Content
async function renderTabContent() {
  if (activeTab === "tab-overview") await renderOverviewTab();
  if (activeTab === "tab-orders") await renderOrdersTab();
  if (activeTab === "tab-menu") {
    await renderMenuCatalog();
    resetMenuForm();
  }
  if (activeTab === "tab-special") await populateSpecialForm();
  if (activeTab === "tab-customers") {
    await renderLoyaltyTable();
    applyCampaignTemplate('diwali');
  }
  if (activeTab === "tab-settings") {
    await renderFeedbackLog();
    await renderContentSettingsForm();
    renderAuditLogs();
  }
}

// Render Overview Statistics (Tab 1)
async function renderOverviewTab() {
  const orders = await DB.getOrders();
  const reservations = await DB.getReservations();
  const leads = await DB.getLeads();
  const feedback = await DB.getFeedback();

  // Counters
  const todayStr = new Date().toLocaleDateString();
  const todayOrders = orders.filter(o => o.createdAt.includes(todayStr));
  
  const totalOrdersVal = todayOrders.length;
  const pickupCount = todayOrders.filter(o => o.orderType === "Pickup").length;
  const dineInCount = todayOrders.filter(o => o.orderType === "Dine-In").length;

  const activeCount = orders.filter(o => o.status === "Received" || o.status === "Preparing" || o.status === "Serving Soon" || o.status === "Ready for Pickup" || o.status === "Ready").length;
  const completedCount = orders.filter(o => o.status === "Completed" || o.status === "Served" || o.status === "Picked Up").length;

  // Average Preparation Time calculation
  const completedOrders = orders.filter(o => o.status === "Completed" || o.status === "Served" || o.status === "Picked Up");
  const avgPrepVal = completedOrders.length > 0
    ? Math.round(completedOrders.reduce((acc, o) => acc + (o.prepTime || 15), 0) / completedOrders.length)
    : 18;

  // Total Revenue (Completed orders sums)
  const revenueVal = orders
    .filter(o => o.status === "Completed" || o.status === "Served" || o.status === "Picked Up")
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  const avgRatingVal = feedback.length > 0 
    ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1) 
    : "4.2";

  // Update UI stats
  document.getElementById("stat-orders-count").textContent = totalOrdersVal;
  document.getElementById("stat-dinein-count").textContent = dineInCount;
  document.getElementById("stat-pickup-count").textContent = pickupCount;
  document.getElementById("stat-active-count").textContent = activeCount;
  document.getElementById("stat-completed-count").textContent = completedCount;
  document.getElementById("stat-avg-prep").textContent = `${avgPrepVal}m`;
  document.getElementById("stat-revenue-count").textContent = `₹${revenueVal}`;

  // Draw Revenue by Category Graph
  const catRevenueBox = document.getElementById("chart-category-revenue");
  if (catRevenueBox) {
    catRevenueBox.innerHTML = "";
    
    const categoryTally = {
      "Starters": 0,
      "Soups": 0,
      "Main Course": 0,
      "Breads": 0,
      "Rice & Noodles": 0,
      "Desserts": 0,
      "Beverages": 0
    };

    orders.forEach(order => {
      if (order.status !== "Cancelled") {
        order.items.forEach(item => {
          let cat = item.category;
          if (cat === "Special") cat = "Main Course";
          if (categoryTally[cat] !== undefined) {
            categoryTally[cat] += item.price * item.qty;
          }
        });
      }
    });

    const maxVal = Math.max(...Object.values(categoryTally), 100);
    Object.keys(categoryTally).forEach(cat => {
      const val = categoryTally[cat];
      const pct = (val / maxVal) * 100;
      
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <span class="bar-label">${cat}</span>
        <div class="bar-outer">
          <div class="bar-inner" style="width: ${pct}%; background-color: var(--primary);"></div>
        </div>
        <span class="bar-val">₹${val}</span>
      `;
      catRevenueBox.appendChild(row);
    });
  }

  // Draw Status Tally Graph
  const statusTallyBox = document.getElementById("chart-order-statuses");
  if (statusTallyBox) {
    statusTallyBox.innerHTML = "";

    const tally = {
      "Received": orders.filter(o => o.status === "Received").length + reservations.filter(r => r.status === "Pending").length,
      "Preparing": orders.filter(o => o.status === "Preparing").length,
      "Ready / Serving": orders.filter(o => o.status === "Ready for Pickup" || o.status === "Serving Soon").length + reservations.filter(r => r.status === "Approved").length,
      "Completed": orders.filter(o => o.status === "Completed" || o.status === "Served" || o.status === "Picked Up").length + reservations.filter(r => r.status === "Completed").length,
      "Cancelled": orders.filter(o => o.status === "Cancelled").length + reservations.filter(r => r.status === "Cancelled").length
    };

    const maxVal = Math.max(...Object.values(tally), 5);
    Object.keys(tally).forEach(statusName => {
      const val = tally[statusName];
      const pct = (val / maxVal) * 100;

      let color = "#6b7280";
      if (statusName === "Received") color = "#d97706";
      if (statusName === "Preparing") color = "#c084fc";
      if (statusName === "Ready / Serving") color = "#16a34a";
      if (statusName === "Completed") color = "#1e4620";
      if (statusName === "Cancelled") color = "#dc2626";

      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <span class="bar-label">${statusName}</span>
        <div class="bar-outer">
          <div class="bar-inner" style="width: ${pct}%; background-color: ${color};"></div>
        </div>
        <span class="bar-val">${val}</span>
      `;
      statusTallyBox.appendChild(row);
    });
  }
}

// Order Filtering Actions
function filterAdminOrders(filterVal) {
  activeOrderFilter = filterVal;
  
  // Highlight active filter button
  const filterBtns = document.querySelectorAll("#admin-order-filters .tab-btn");
  filterBtns.forEach(btn => {
    if (btn.getAttribute("data-filter") === filterVal) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  renderOrdersTab();
}

// Render Orders Tab List (Tab 2)
async function renderOrdersTab() {
  const tbody = document.querySelector("#active-orders-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const orders = await DB.getOrders();
  const reservations = await DB.getReservations();

  // Combine arrays
  let combined = [
    ...orders.map(o => ({ ...o, entryType: o.orderType })),
    ...reservations.map(r => ({ ...r, entryType: "Reservation", orderType: "Reservation" }))
  ];

  // Apply Active Filter Category
  if (activeOrderFilter === "pickup") {
    combined = combined.filter(o => o.entryType === "Pickup");
  } else if (activeOrderFilter === "dinein") {
    combined = combined.filter(o => o.entryType === "Dine-In");
  } else if (activeOrderFilter === "Preparing") {
    combined = combined.filter(o => o.status === "Preparing");
  } else if (activeOrderFilter === "Ready") {
    combined = combined.filter(o => o.status === "Ready for Pickup" || o.status === "Serving Soon");
  } else if (activeOrderFilter === "Completed") {
    combined = combined.filter(o => o.status === "Completed" || o.status === "Served" || o.status === "Picked Up");
  } else if (activeOrderFilter === "Cancelled") {
    combined = combined.filter(o => o.status === "Cancelled");
  }

  // Sort by order date/id (latest first)
  combined.sort((a,b) => {
    const idA = a && a.id ? a.id.split("_")[1] : "";
    const idB = b && b.id ? b.id.split("_")[1] : "";
    return (parseInt(idB) || 0) - (parseInt(idA) || 0);
  });

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-muted);">No matching orders or bookings found.</td></tr>`;
    return;
  }

  combined.forEach(item => {
    const isPre = item.entryType === "Pickup";
    const isDineIn = item.entryType === "Dine-In";
    const isReservation = item.entryType === "Reservation";
    
    // Details summary
    let detailsHtml = "";
    if (isReservation) {
      detailsHtml = `Table for <strong>${item.guests || 0} People</strong>`;
      if (item.occasion && item.occasion !== "None") detailsHtml += ` (${item.occasion})`;
      if (item.notes) detailsHtml += `<br><span style="font-size:11px; color:#c2410c;">Note: ${item.notes}</span>`;
    } else {
      const itemsList = Array.isArray(item.items) 
        ? item.items 
        : (typeof item.items === 'string' ? JSON.parse(item.items) : []);
      detailsHtml = itemsList.map(i => `<strong>${i.name}</strong> x${i.qty}`).join(", ");
      if (item.notes) detailsHtml += `<br><span style="font-size:11px; color:#c2410c;">Note: ${item.notes}</span>`;
    }

    // Schedule DateTime mapping
    let scheduleHtml = "";
    if (isReservation) {
      scheduleHtml = `${item.date || ''} @ ${item.time || ''}`;
    } else if (isDineIn) {
      const createdStr = item.createdAt || "";
      scheduleHtml = `Placed: ${createdStr.includes(',') ? createdStr.split(',')[1] : createdStr}<br><span style="font-size:10px; color:var(--primary); font-weight:600;"><i class="fa-solid fa-clock"></i> Est. Serving: ${item.estimatedReadyTime || 'N/A'}</span>`;
    } else {
      scheduleHtml = `Pickup: ${item.pickupTime || 'ASAP'}<br><span style="font-size:10px; color:var(--accent); font-weight:600;"><i class="fa-solid fa-clock"></i> Est. Ready: ${item.estimatedReadyTime || 'N/A'}</span>`;
    }

    // Status classes
    let statusClass = "badge-pending";
    if (item.status === "Accepted" || item.status === "Approved") statusClass = "badge-accepted";
    else if (item.status === "Preparing") statusClass = "badge-preparing";
    else if (item.status === "Ready for Pickup" || item.status === "Serving Soon") statusClass = "badge-pickup";
    else if (item.status === "Completed" || item.status === "Served" || item.status === "Picked Up") statusClass = "badge-completed";
    else if (item.status === "Cancelled") statusClass = "badge-cancelled";

    // Build Action controls
    let actionsHtml = "";
    if (item.status === "Received" || item.status === "Pending") {
      actionsHtml = `
        <button class="action-btn btn-green" onclick="updateStatus('${item.id}', 'Preparing')"><i class="fa-solid fa-check"></i> Accept</button>
        <button class="action-btn btn-red" onclick="updateStatus('${item.id}', 'Cancelled')"><i class="fa-solid fa-times"></i> Reject</button>
      `;
    } else if (item.status === "Preparing") {
      if (isPre) {
        actionsHtml = `<button class="action-btn btn-blue" onclick="updateStatus('${item.id}', 'Ready for Pickup')"><i class="fa-solid fa-check"></i> Set Ready</button>`;
      } else if (isDineIn) {
        actionsHtml = `<button class="action-btn btn-blue" onclick="updateStatus('${item.id}', 'Serving Soon')"><i class="fa-solid fa-fire"></i> Serving Soon</button>`;
      } else {
        actionsHtml = `<button class="action-btn btn-green" onclick="updateStatus('${item.id}', 'Completed')"><i class="fa-solid fa-check"></i> Complete</button>`;
      }
    } else if (item.status === "Ready for Pickup") {
      actionsHtml = `<button class="action-btn btn-green" onclick="updateStatus('${item.id}', 'Picked Up')"><i class="fa-solid fa-hand-holding"></i> Hand Over</button>`;
    } else if (item.status === "Serving Soon") {
      actionsHtml = `<button class="action-btn btn-green" onclick="updateStatus('${item.id}', 'Served')"><i class="fa-solid fa-utensils"></i> Serve to Table</button>`;
    } else {
      actionsHtml = `<span style="color:var(--text-muted); font-size:11px;">Completed</span>`;
    }

    // Payment Status column
    let paymentHtml = "N/A";
    if (!isReservation) {
      const isPaid = item.paymentStatus === "Paid";
      paymentHtml = `
        <strong>₹${item.totalPrice}</strong><br>
        <span style="font-size:10px; color:${isPaid ? '#16a34a' : '#dc2626'}; font-weight:700;">${item.paymentStatus}</span><br>
        <button class="action-btn btn-gray" style="padding: 2px 5px; font-size: 8px; margin-top:4px;" onclick="togglePaymentStatus('${item.id}', '${item.paymentStatus}')">
          <i class="fa-solid fa-money-bill"></i> Toggle
        </button>
      `;
    }

    // Badge markers for Origin Type
    let typeBadgeHtml = "";
    if (isReservation) {
      typeBadgeHtml = `<span class="badge" style="background:#f1f5f9; color:#475569;"><i class="fa-solid fa-calendar-days"></i> Booking</span>`;
    } else if (isDineIn) {
      typeBadgeHtml = `<span class="badge" style="background:#dcfce7; color:#15803d;"><i class="fa-solid fa-utensils"></i> Table ${item.tableNumber}</span>`;
    } else {
      typeBadgeHtml = `<span class="badge" style="background:#e0f2fe; color:#0369a1;"><i class="fa-solid fa-truck-pickup"></i> Pickup</span>`;
    }

    // Extra receipt and WA buttons
    const extraControls = `
      <div style="margin-top: 8px; display:flex; gap:6px;">
        <button class="action-btn btn-gray" style="padding: 3px 6px; font-size:9px;" onclick="printOrderReceipt('${item.id}', '${item.orderType}')"><i class="fa-solid fa-print"></i> Receipt</button>
        ${item.phone ? `<button class="action-btn btn-blue" style="padding: 3px 6px; font-size:9px; background-color:#25D366" onclick="sendWhatsAppStatusUpdate('${item.id}', '${item.orderType}')"><i class="fa-brands fa-whatsapp"></i> Update WA</button>` : ''}
      </div>
    `;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.id}</strong></td>
      <td>${typeBadgeHtml}</td>
      <td>
        <strong>${item.name || 'Dine-In Guest'}</strong><br>
        <span style="font-size:11px; color:var(--text-muted);">${item.phone || 'No phone'}</span>
      </td>
      <td>${scheduleHtml}</td>
      <td>${detailsHtml}</td>
      <td>${paymentHtml}</td>
      <td><span class="badge ${statusClass}">${item.status}</span></td>
      <td>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <div>${actionsHtml}</div>
          ${extraControls}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Toggle payment status
async function togglePaymentStatus(id, currentStatus) {
  const nextStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
  await DB.updateOrderPaymentStatus(id, nextStatus);
  addAuditLog(`Updated payment status of order ${id} to "${nextStatus}"`, currentRole);
  await renderOrdersTab();
  await renderOverviewTab();
}

// Update Reservation/Preorder Status
async function updateStatus(id, newStatus) {
  const isReservation = id.startsWith("res_");
  
  if (isReservation) {
    await DB.updateReservationStatus(id, newStatus);
  } else {
    await DB.updateOrderStatus(id, newStatus);
  }

  addAuditLog(`Updated status of ${isReservation ? 'Reservation' : 'Order'} ${id} to "${newStatus}"`, currentRole);
  await renderOrdersTab();
  await renderOverviewTab();
}

// Receipt Generation & Window Print
async function printOrderReceipt(id, type) {
  const isReservation = type === "Reservation";
  const orders = isReservation ? await DB.getReservations() : await DB.getOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return;

  document.getElementById("receipt-date").textContent = `Date: ${order.createdAt}`;
  document.getElementById("receipt-id").textContent = `Booking ID: ${order.id}`;
  document.getElementById("receipt-customer").textContent = `Customer: ${order.name} (${order.phone || 'Dine-In'})`;

  const rowsBox = document.getElementById("receipt-items-rows");
  rowsBox.innerHTML = "";

  if (!isReservation) {
    order.items.forEach(item => {
      const p = document.createElement("p");
      p.style.display = "flex";
      p.style.justifyContent = "space-between";
      p.innerHTML = `<span>${item.name} x${item.qty}</span> <span>₹${item.price * item.qty}</span>`;
      rowsBox.appendChild(p);
    });
    document.getElementById("receipt-total").textContent = `Total: ₹${order.totalPrice} (${order.paymentStatus})`;
    document.getElementById("receipt-total").style.display = "block";
  } else {
    const p = document.createElement("p");
    p.textContent = `Dine-in Table Booking Reservation for ${order.guests} Guests. Special occasion: ${order.occasion}`;
    rowsBox.appendChild(p);
    document.getElementById("receipt-total").style.display = "none";
  }

  // Open Receipt Print Modal Container
  const overlay = document.getElementById("print-receipt-overlay");
  overlay.style.display = "flex";
}

function closeReceipt() {
  document.getElementById("print-receipt-overlay").style.display = "none";
}

// WhatsApp status updater link
async function sendWhatsAppStatusUpdate(id, type) {
  const isReservation = type === "Reservation";
  const orders = isReservation ? await DB.getReservations() : await DB.getOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return;

  let msg = "";
  if (isReservation) {
    msg = `*Kamadhenu Veg Booking Alert*\n\nHello ${order.name},\nYour table booking reservation status is: *${order.status}*.\n\nThank you for choosing Kamadhenu Veg!`;
  } else {
    // Custom messages per order type
    if (order.orderType === "Dine-In") {
      if (order.status === "Preparing") {
        msg = `*Kamadhenu Veg Order Update*\n\nHi ${order.name},\nOur chefs are preparing your food. It will be served shortly to Table ${order.tableNumber}!`;
      } else if (order.status === "Serving Soon") {
        msg = `*Kamadhenu Veg Order Update*\n\nHi ${order.name},\nYour food is cooked and will arrive at your table shortly!`;
      } else {
        msg = `*Kamadhenu Veg Order Update*\n\nHi ${order.name},\nYour order at Table ${order.tableNumber} is status: *${order.status}*.\n\nEnjoy your meal!`;
      }
    } else {
      if (order.status === "Preparing") {
        msg = `*Kamadhenu Veg Order Update*\n\nHi ${order.name},\nYour pickup order is being prepared. Est ready time: ${order.estimatedReadyTime}.`;
      } else if (order.status === "Ready for Pickup") {
        msg = `*Kamadhenu Veg Order Update*\n\nHi ${order.name},\nYour food is ready! Please collect your order from our Narsingi counter.`;
      } else {
        msg = `*Kamadhenu Veg Order Update*\n\nHi ${order.name},\nYour pickup order status is: *${order.status}*.\n\nThank you!`;
      }
    }
  }

  const waUrl = `https://wa.me/${order.phone.replace(/[^0-9]/g, "") || '919876543210'}?text=${encodeURIComponent(msg)}`;
  alert("Redirecting to WhatsApp to send status notification update message.");
  window.open(waUrl, "_blank");
}

// Menu catalog management tab (Tab 3)
async function renderMenuCatalog() {
  const tbody = document.querySelector("#menu-catalog-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const menu = await DB.getMenu();

  menu.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.name}</strong> ${item.bestSeller ? '<span style="color:#d4af37">★</span>' : ''}</td>
      <td>${item.category}</td>
      <td>₹${item.price}</td>
      <td><span class="badge ${item.availability === 'Out of Stock' ? 'badge-cancelled' : (item.availability === 'Limited Quantity' ? 'badge-pending' : 'badge-completed')}">${item.availability || 'Available'}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="action-btn btn-blue" style="padding: 4px 8px; font-size:10px;" onclick="loadMenuItemForEdit('${item.id}')"><i class="fa-solid fa-edit"></i> Edit</button>
          <button class="action-btn btn-red" style="padding: 4px 8px; font-size:10px;" onclick="deleteMenuItem('${item.id}')"><i class="fa-solid fa-trash"></i> Del</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadMenuItemForEdit(id) {
  const menu = await DB.getMenu();
  const item = menu.find(i => i.id === id);
  if (!item) return;

  document.getElementById("menu-form-title").textContent = `Edit Menu Item: "${item.name}"`;
  document.getElementById("menu-item-id").value = item.id;
  document.getElementById("menu-item-name").value = item.name;
  document.getElementById("menu-item-price").value = item.price;
  document.getElementById("menu-item-cat").value = item.category;
  document.getElementById("menu-item-desc").value = item.description;
  document.getElementById("menu-item-image").value = item.image;
  document.getElementById("menu-item-badge").value = item.bestSeller ? "bestSeller" : "none";
  document.getElementById("menu-item-avail").value = item.availability || "Available";
}

async function deleteMenuItem(id) {
  if (!checkPermission("Owner")) return;

  if (confirm("Are you sure you want to permanently delete this menu item?")) {
    let menu = await DB.getMenu();
    const item = menu.find(i => i.id === id);
    menu = menu.filter(i => i.id !== id);
    await DB.saveMenu(menu);
    addAuditLog(`Deleted Menu Item: "${item.name}"`, currentRole);
    await renderMenuCatalog();
    await renderOverviewTab();
  }
}

function resetMenuForm() {
  document.getElementById("menu-form-title").textContent = "Add New Food Menu Item";
  document.getElementById("menu-item-id").value = "";
  document.getElementById("menu-editor-form").reset();
}

// Today's Special Tab (Tab 4)
async function populateSpecialForm() {
  const special = await DB.getSpecial();
  if (special) {
    document.getElementById("special-edit-name").value = special.name;
    document.getElementById("special-edit-price").value = special.price;
    document.getElementById("special-edit-badge").value = special.badge || "";
    document.getElementById("special-edit-desc").value = special.description;
    document.getElementById("special-edit-image").value = special.image;
    document.getElementById("special-edit-discount").value = special.discount || "";
  }
}

// Loyalty Program & Campaigns (Tab 5)
async function renderLoyaltyTable() {
  const tbody = document.querySelector("#loyalty-customers-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const leads = await DB.getLeads();

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">No registered customer leads found.</td></tr>`;
    return;
  }

  leads.forEach(lead => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${lead.name || 'Anonymous Guest'}</strong></td>
        <td>${lead.phone}</td>
        <td>${lead.joinDate}</td>
        <td><strong>${lead.visits || 0} Visits</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="flex-grow:1; width:80px; height:8px; background:#ddd; border-radius:4px; overflow:hidden;">
              <div style="width:${(lead.rewardsProgress || 0) * 10}%; height:100%; background:var(--primary);"></div>
            </div>
            <span>${lead.rewardsProgress || 0}/10</span>
          </div>
        </td>
        <td>${lead.birthday || 'Not specified'}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="action-btn btn-green" style="padding:4px 8px; font-size:10px;" onclick="incrementLoyaltyVisits('${lead.phone}')">+ Add Visit</button>
            <button class="action-btn btn-blue" style="padding:4px 8px; font-size:10px;" onclick="setCustomerBirthday('${lead.phone}')"><i class="fa-solid fa-cake-candles"></i> B'day</button>
          </div>
        </td>
      </tr>
    `;
  });
}

async function incrementLoyaltyVisits(phone) {
  if (!checkPermission("Staff")) return;
  const lead = await DB.incrementVisits(phone);
  addAuditLog(`Manually recorded loyalty dining visit for: ${phone} (Visits: ${lead.visits})`, currentRole);
  await renderLoyaltyTable();
}

async function setCustomerBirthday(phone) {
  if (!checkPermission("Staff")) return;
  const bday = prompt("Enter customer birthday (E.g., 15th August):");
  if (bday) {
    await DB.updateLead(phone, { birthday: bday });
    addAuditLog(`Recorded birthdate for customer ${phone}: "${bday}"`, currentRole);
    await renderLoyaltyTable();
  }
}

// Apply pre-defined template to campaign editor
function applyCampaignTemplate(type) {
  const box = document.getElementById("campaign-msg-text");
  if (!box) return;

  let text = "";
  if (type === "diwali") {
    text = `*🪔 Happy Diwali from Kamadhenu Veg! 🪔*\n\nHello {name},\nMay this festival of lights bring health and sweetness to your home. Celebrate Diwali dining with our famous paneer butter masala and special meals.\n\nEnjoy an exclusive *15% dine-in discount* this week. Present this code: *FESTIVAL15* during billing!\n\n📍 Visit us at Snehitha Hills, Narsingi.`;
  } else if (type === "sankranti") {
    text = `*🌾 Happy Sankranti from Kamadhenu Veg! 🌾*\n\nHello {name},\nWishing you a warm harvest season! Indulge in our classic pure vegetarian dishes with your family.\n\nEnjoy *Free Dessert* with every family order of ₹1200 or more! Mention code: *SANKRANTIFREE*.\n\n📞 For reservations: +91 98765 43210.`;
  } else if (type === "newyear") {
    text = `*🎉 Happy New Year from Kamadhenu Veg! 🎉*\n\nHello {name},\nWelcome 2026 with a delectable family treat. Take *10% OFF* on all online pickup pre-orders today!\n\nUse code: *NY2026* during online preorder pickup.\n\n👉 Order now at: https://kamadhenuveg.com`;
  } else if (type === "weekend") {
    text = `*🔥 Weekend Family treat at Kamadhenu Veg! 🔥*\n\nHello {name},\nNo cooking on Sunday! Savor our hot Nizami Handi, butter naan, and signature Irani Chai Tiramisu with your family.\n\nReserve a table or pre-order pickup to skip the queues!\n\n📞 Table Booking: +91 98765 43210.`;
  }

  box.value = text;
}

// Trigger promotional campaign
async function triggerCampaign(event) {
  event.preventDefault();
  if (!checkPermission("Manager")) return;

  const msgText = document.getElementById("campaign-msg-text").value;
  const leads = await DB.getLeads();
  const logsBox = document.getElementById("campaign-logs-box");

  if (leads.length === 0) {
    alert("No customer leads in database! Register a phone number first.");
    return;
  }

  logsBox.innerHTML = "[DISPATCHING CAMPAIGN...]\n";
  let count = 0;

  leads.forEach((lead, idx) => {
    setTimeout(() => {
      const customized = msgText.replace(/{name}/g, lead.name || "Valued Guest");
      logsBox.innerHTML += `[SUCCESS] Message sent to ${lead.name || 'Guest'} (${lead.phone})\n`;
      logsBox.scrollTop = logsBox.scrollHeight;
      
      count++;
      if (count === leads.length) {
        logsBox.innerHTML += `\n[COMPLETED] Dispatch finished. Total messages sent: ${leads.length}\n`;
        addAuditLog(`Dispatched promotional campaign greetings to ${leads.length} leads.`, currentRole);
      }
    }, (idx + 1) * 600);
  });
}

// Settings & Feedbacks Tab (Tab 6)
async function renderFeedbackLog() {
  const tbody = document.querySelector("#feedback-log-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const feedbacks = await DB.getFeedback();

  if (feedbacks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">No customer feedbacks logged yet.</td></tr>`;
    return;
  }

  feedbacks.forEach(fb => {
    tbody.innerHTML += `
      <tr>
        <td>${fb.date}</td>
        <td><strong>${fb.name}</strong><br><span style="font-size:10px; color:#999;">${fb.phone}</span></td>
        <td><span style="color:#ffb400; font-weight:700;">${fb.rating}★</span></td>
        <td>"${fb.feedback}"</td>
      </tr>
    `;
  });
}

async function renderContentSettingsForm() {
  const headline = localStorage.getItem("settings_hero_title") || "Experience Premium Vegetarian Dining in Hyderabad";
  const hoursText = localStorage.getItem("settings_hours_text") || "12:30 PM - 11:45 PM";
  const whatsappText = localStorage.getItem("settings_whatsapp_phone") || "919876543210";

  document.getElementById("settings-hero-title").value = headline;
  document.getElementById("settings-hours-text").value = hoursText;
  document.getElementById("settings-whatsapp").value = whatsappText;

  // Populate category prep times
  const prepTimes = await DB.getPrepTimes();
  document.getElementById("prep-time-starters").value = prepTimes["Starters"] || 15;
  document.getElementById("prep-time-soups").value = prepTimes["Soups"] || 10;
  document.getElementById("prep-time-main").value = prepTimes["Main Course"] || 25;
  document.getElementById("prep-time-breads").value = prepTimes["Breads"] || 5;
  document.getElementById("prep-time-rice").value = prepTimes["Rice & Noodles"] || 20;
  document.getElementById("prep-time-desserts").value = prepTimes["Desserts"] || 10;
  document.getElementById("prep-time-beverages").value = prepTimes["Beverages"] || 5;

  // Populate Supabase credentials
  const sbUrlVal = localStorage.getItem("sb_url") || "";
  const sbAnonVal = localStorage.getItem("sb_anon") || "";
  document.getElementById("sb-url-input").value = sbUrlVal;
  document.getElementById("sb-anon-input").value = sbAnonVal;

  const statusIndicator = document.getElementById("sb-status-indicator");
  if (statusIndicator) {
    if (DB.isSupabase()) {
      statusIndicator.textContent = "Status: Live Supabase Connected ✅";
      statusIndicator.style.color = "#16a34a";
    } else {
      statusIndicator.textContent = "Status: Local Storage Fallback Mode ⚠️";
      statusIndicator.style.color = "#d97706";
    }
  }
}

// Dashboard Audit Action Logging
function initAuditLogs() {
  if (!localStorage.getItem("km_audit_logs")) {
    localStorage.setItem("km_audit_logs", JSON.stringify([
      { time: new Date().toLocaleString(), role: "System", action: "Administrative logging database initialized." }
    ]));
  }
}

function addAuditLog(action, role) {
  initAuditLogs();
  const logs = JSON.parse(localStorage.getItem("km_audit_logs"));
  logs.unshift({
    time: new Date().toLocaleString(),
    role,
    action
  });
  localStorage.setItem("km_audit_logs", JSON.stringify(logs));
  renderAuditLogs();
}

function renderAuditLogs() {
  const box = document.getElementById("audit-log-box");
  if (!box) return;

  initAuditLogs();
  const logs = JSON.parse(localStorage.getItem("km_audit_logs"));
  box.innerHTML = logs.map(l => `[${l.time}] [Role: ${l.role}] -> ${l.action}`).join("\n");
}

function clearAuditLogs() {
  if (!checkPermission("Owner")) return;
  if (confirm("Wipe all administrative audit trail action history logs permanently?")) {
    localStorage.removeItem("km_audit_logs");
    initAuditLogs();
    renderAuditLogs();
  }
}

// Real-Time incoming order checking & synth audio trigger notifications
async function checkNewIncomingOrders() {
  const orders = await DB.getOrders();
  const reservations = await DB.getReservations();
  const allOrdersCount = orders.length + reservations.length;

  if (allOrdersCount !== previousOrdersCount) {
    const wentUp = allOrdersCount > previousOrdersCount;
    previousOrdersCount = allOrdersCount;
    
    if (wentUp) {
      // Play audio chime
      playNewOrderTone();

      // Visual notification banner showing order origin
      const alertBanner = document.getElementById("new-notification-alert");
      const alertMsg = document.getElementById("alert-text-message");
      
      if (alertBanner && alertMsg) {
        const latestOrder = orders[0]; // orders are sorted latest first
        if (latestOrder) {
          const isDineIn = latestOrder.orderType === "Dine-In";
          const detailsStr = isDineIn 
            ? `New Dine-In Order received for Table ${latestOrder.tableNumber}!` 
            : `New Pickup Pre-Order received from ${latestOrder.name}!`;
          alertMsg.textContent = detailsStr;
        } else {
          alertMsg.textContent = `New Booking / Reservation request received!`;
        }
        alertBanner.style.display = "flex";
      }
    }

    // Refresh active tab views
    await renderTabContent();
  }
}

function dismissAlert() {
  document.getElementById("new-notification-alert").style.display = "none";
}

// Audio context synthesizer notification generator (Web Audio API)
function playNewOrderTone() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 523.25;
    gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc1.start();
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.stop(audioCtx.currentTime + 0.3);

    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 659.25;
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc2.start();
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 150);

  } catch (err) {
    console.warn("Web Audio Context not permitted or supported yet:", err);
  }
}

function playSynthTestSound() {
  playNewOrderTone();
  alert("Simulated Audio Synth Note triggered via Web Audio API!");
}

// CSV Data Exporters
async function exportOrdersToCSV() {
  const orders = await DB.getOrders();
  const reservations = await DB.getReservations();
  
  let csv = "Order ID,Type,Table Number,Customer Name,Phone,Date/Time,Total Price,Payment Status,Status\n";

  orders.forEach(o => {
    csv += `"${o.id}","${o.orderType}","Table ${o.tableNumber || 'N/A'}","${o.name}","${o.phone || 'N/A'}","${o.createdAt}","₹${o.totalPrice}","${o.paymentStatus}","${o.status}"\n`;
  });

  reservations.forEach(r => {
    csv += `"${r.id}","Reservation","N/A","${r.name}","${r.phone}","${r.date} @ ${r.time}","Dine-in","N/A","${r.status}"\n`;
  });

  triggerCSVDownload(csv, "Kamadhenu_Orders_Export.csv");
  addAuditLog("Exported active orders database to CSV file", currentRole);
}

async function exportLeadsToCSV() {
  const leads = await DB.getLeads();
  let csv = "Name,Phone Number,Join Date,Total Visits,Rewards Stamps Progress,Birthday\n";

  leads.forEach(l => {
    csv += `"${l.name}","${l.phone}","${l.joinDate}","${l.visits}","${l.rewardsProgress}/10","${l.birthday}"\n`;
  });

  triggerCSVDownload(csv, "Kamadhenu_Leads_Export.csv");
  addAuditLog("Exported leads program directory database to CSV file", currentRole);
}

function triggerCSVDownload(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Supabase Configuration Controller Actions
function saveSupabaseConfig(event) {
  event.preventDefault();
  const url = document.getElementById("sb-url-input").value.trim();
  const anon = document.getElementById("sb-anon-input").value.trim();

  if (!url || !anon) {
    alert("Please enter both Supabase Project URL and Anon API key.");
    return;
  }

  localStorage.setItem("sb_url", url);
  localStorage.setItem("sb_anon", anon);
  addAuditLog(`Configured Supabase database credentials URL: "${url}"`, currentRole);
  alert("Supabase credentials saved successfully! The dashboard will now reload to synchronize with Supabase.");
  window.location.reload();
}

function disconnectSupabase() {
  if (confirm("Are you sure you want to disconnect Supabase and fall back to local storage?")) {
    localStorage.removeItem("sb_url");
    localStorage.removeItem("sb_anon");
    addAuditLog("Disconnected Supabase client, reverted to Local storage database fallback", currentRole);
    alert("Supabase disconnected successfully! Reverting to Local Storage database mode.");
    window.location.reload();
  }
}

function copySQLSchema() {
  const textarea = document.getElementById("sql-schema-script");
  if (textarea) {
    textarea.select();
    document.execCommand("copy");
    alert("SQL Schema script copied to clipboard successfully! You can paste it into your Supabase SQL Editor.");
  }
}

// Global scope window assignments for HTML event triggers
window.verifyLogin = verifyLogin;
window.handleLogout = handleLogout;
window.changeAccessRole = changeAccessRole;
window.playSynthTestSound = playSynthTestSound;
window.dismissAlert = dismissAlert;
window.updateStatus = updateStatus;
window.printOrderReceipt = printOrderReceipt;
window.closeReceipt = closeReceipt;
window.sendWhatsAppStatusUpdate = sendWhatsAppStatusUpdate;
window.loadMenuItemForEdit = loadMenuItemForEdit;
window.deleteMenuItem = deleteMenuItem;
window.resetMenuForm = resetMenuForm;
window.incrementLoyaltyVisits = incrementLoyaltyVisits;
window.setCustomerBirthday = setCustomerBirthday;
window.applyCampaignTemplate = applyCampaignTemplate;
window.exportOrdersToCSV = exportOrdersToCSV;
window.exportLeadsToCSV = exportLeadsToCSV;
window.clearAuditLogs = clearAuditLogs;
window.saveSupabaseConfig = saveSupabaseConfig;
window.disconnectSupabase = disconnectSupabase;
window.copySQLSchema = copySQLSchema;
window.filterAdminOrders = filterAdminOrders;
window.togglePaymentStatus = togglePaymentStatus;
