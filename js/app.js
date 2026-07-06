// Pista House - Customer Site JavaScript Interactions

let cart = [];
let activeTableNumber = ""; // Stores scanned QR table number
let trackingOrderId = "";
let trackerPollInterval = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Check for Table QR Scan parameter in URL
  detectTableQR();

  // Show local mode notice if database is offline
  const localNotice = document.getElementById("local-mode-notice");
  if (localNotice) {
    localNotice.style.display = DB.isSupabase() ? "none" : "block";
  }

  // Load custom content edits from settings
  loadCustomSettingsContent();

  // 1. Initial Renderings
  await renderSpecialSection();
  await renderMenuGrid("all");
  await renderReviews();
  updateOperatingHoursHighlight();
  initLeadPopup();

  // 2. Event Listeners for Menu Controls
  const searchInput = document.getElementById("menu-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.toLowerCase().trim();
      const activeTab = document.querySelector(".tab-btn.active");
      const category = activeTab ? activeTab.getAttribute("data-category") : "all";
      await renderMenuGrid(category, query);
    });
  }

  const categoryBtns = document.querySelectorAll("#menu-category-tabs .tab-btn");
  categoryBtns.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      categoryBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      const category = e.target.getAttribute("data-category");
      const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
      await renderMenuGrid(category, query);
    });
  });

  // 3. Cart Drawer Toggles
  const cartToggleBtn = document.getElementById("cart-toggle-btn");
  const cartCloseBtn = document.getElementById("cart-close-btn");
  const cartDrawer = document.getElementById("cart-drawer");

  if (cartToggleBtn && cartDrawer) {
    cartToggleBtn.addEventListener("click", () => {
      cartDrawer.classList.add("open");
    });
  }
  if (cartCloseBtn && cartDrawer) {
    cartCloseBtn.addEventListener("click", () => {
      cartDrawer.classList.remove("open");
    });
  }

  // Close cart drawer if user clicks outside
  document.addEventListener("click", (e) => {
    if (cartDrawer && cartDrawer.classList.contains("open")) {
      if (!cartDrawer.contains(e.target) && e.target !== cartToggleBtn && !e.target.closest("#cart-toggle-btn") && !e.target.closest(".menu-card-footer") && !e.target.closest("#special-add-cart-btn")) {
        cartDrawer.classList.remove("open");
      }
    }
  });

  // 4. Booking Table Form Submission
  const resForm = document.getElementById("reservation-form");
  if (resForm) {
    resForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const name = document.getElementById("res-name").value;
      const phone = document.getElementById("res-phone").value;
      const date = document.getElementById("res-date").value;
      const time = document.getElementById("res-time").value;
      const guests = document.getElementById("res-guests").value;
      const occasion = document.getElementById("res-occasion").value;
      const notes = document.getElementById("res-notes").value;

      const resObj = { name, phone, date, time, guests, occasion, notes };
      const savedRes = await DB.addReservation(resObj);

      // Create WhatsApp Text Template
      const text = `*Pista House - Table Reservation Request*\n\nName: ${name}\nPhone: ${phone}\nDate: ${date}\nTime: ${time}\nGuests: ${guests} People\nOccasion: ${occasion}\nNotes: ${notes || 'None'}\n\n*Reference ID: ${savedRes.id}*`;
      const waNumber = localStorage.getItem("settings_whatsapp_phone") || "918143227553";
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
      
      // Notify User and Open WhatsApp
      alert(`Booking Sent Successfully! Your reservation reference is: ${savedRes.id}. We are redirecting you to WhatsApp to confirm.`);
      window.open(waUrl, "_blank");
      resForm.reset();
    });
  }

  // 5. Loyalty Checker Form Submission
  const loyaltyCheckBtn = document.getElementById("loyalty-check-btn");
  if (loyaltyCheckBtn) {
    loyaltyCheckBtn.addEventListener("click", async () => {
      const phone = document.getElementById("loyalty-phone-input").value.trim();
      if (!phone) {
        alert("Please enter a valid phone number.");
        return;
      }
      
      // Check or Register Lead
      let { status, lead } = await DB.addLead("Loyalty Guest", phone);
      showLoyaltyProgress(lead);
    });
  }

  const loyaltyResetBtn = document.getElementById("loyalty-reset-btn");
  if (loyaltyResetBtn) {
    loyaltyResetBtn.addEventListener("click", () => {
      document.getElementById("loyalty-progress-view").style.display = "none";
      document.getElementById("loyalty-search-form").style.display = "block";
      document.getElementById("loyalty-phone-input").value = "";
    });
  }

  // 6. Feedback Star rating click handler
  const stars = document.querySelectorAll("#rating-stars-picker i");
  const ratingInput = document.getElementById("feedback-rating-val");
  
  stars.forEach(star => {
    star.addEventListener("click", (e) => {
      const val = parseInt(e.target.getAttribute("data-rating"));
      ratingInput.value = val;
      
      // Update UI color
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute("data-rating"));
        if (sVal <= val) {
          s.classList.remove("fa-regular");
          s.classList.add("fa-solid");
        } else {
          s.classList.remove("fa-solid");
          s.classList.add("fa-regular");
        }
      });
    });
  });

  // Feedback form submit
  const feedbackForm = document.getElementById("feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const rating = parseInt(ratingInput.value);
      if (rating === 0) {
        alert("Please select a star rating!");
        return;
      }
      
      const name = document.getElementById("fb-name").value;
      const phone = document.getElementById("fb-phone").value;
      const feedback = document.getElementById("fb-text").value;

      await DB.addFeedbackEntry({ name, phone, rating, feedback });
      alert("Thank you for your valuable feedback! It has been logged into our system.");
      
      // Reset Form & Stars
      feedbackForm.reset();
      ratingInput.value = 0;
      stars.forEach(s => {
        s.classList.remove("fa-solid");
        s.classList.add("fa-regular");
      });
      await renderReviews(); // Re-render public reviews since high rating feeds automatically
    });
  }

  // 7. Scroll effects (sticky header & scroll-to-top)
  const header = document.getElementById("site-header");
  const fabTop = document.getElementById("fab-scroll-top");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      header.classList.add("scrolled");
      if (fabTop) fabTop.style.display = "flex";
    } else {
      header.classList.remove("scrolled");
      if (fabTop) fabTop.style.display = "none";
    }
  });

  if (fabTop) {
    fabTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Floating WhatsApp button action
  const fabWa = document.getElementById("fab-wa");
  if (fabWa) {
    fabWa.addEventListener("click", () => {
      const text = "*Pista House - Table Booking / Catering Inquiry*\n\nHello, I would like to make an inquiry about dine-in table reservations or outdoor catering services.";
      const waNumber = localStorage.getItem("settings_whatsapp_phone") || "918143227553";
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
    });
  }
});

// Detect Table QR Scans
function detectTableQR() {
  const urlParams = new URLSearchParams(window.location.search);
  const table = urlParams.get("table");

  if (table) {
    activeTableNumber = table;
    
    // Show table banner
    const banner = document.getElementById("dine-in-banner");
    const numSpan = document.getElementById("dine-in-table-number");
    if (banner && numSpan) {
      numSpan.textContent = table;
      banner.style.display = "block";
    }

    // Modify Pre-Order sidebar to Dine-In Mode
    const drawerTitle = document.querySelector(".cart-header h3");
    if (drawerTitle) {
      drawerTitle.innerHTML = `<i class="fa-solid fa-utensils"></i> Order to Table: Table ${table}`;
    }

    // Hide Pickup Time selector
    const timeGroup = document.getElementById("ord-time") ? document.getElementById("ord-time").closest(".form-group") : null;
    if (timeGroup) {
      timeGroup.style.display = "none";
      document.getElementById("ord-time").removeAttribute("required");
    }

    // Customize fields to optional for table ordering convenience
    const nameInput = document.getElementById("ord-name");
    const phoneInput = document.getElementById("ord-phone");
    if (nameInput) nameInput.removeAttribute("required");
    if (phoneInput) phoneInput.removeAttribute("required");

    // Modify preorder submit button
    const submitBtn = document.querySelector("#preorder-form button[type='submit']");
    if (submitBtn) {
      submitBtn.className = "btn btn-primary";
      submitBtn.innerHTML = `<i class="fa-solid fa-check-circle"></i> Send Order to Table ${table}`;
    }
  }
}

// Helper: Open pickup pre-order sidebar
function openPreOrder() {
  const drawer = document.getElementById("cart-drawer");
  if (drawer) drawer.classList.add("open");
}

// 8. Render Chef's Special
async function renderSpecialSection() {
  const special = await DB.getSpecial();
  const nameEl = document.getElementById("special-name");
  const descEl = document.getElementById("special-desc");
  const priceEl = document.getElementById("special-price");
  const badgeEl = document.getElementById("special-badge");
  const discountEl = document.getElementById("special-discount");
  const imgEl = document.getElementById("special-img");
  const addBtn = document.getElementById("special-add-cart-btn");

  if (special) {
    if (nameEl) nameEl.textContent = special.name;
    if (descEl) descEl.textContent = special.description;
    if (priceEl) priceEl.textContent = `₹${special.price}`;
    if (badgeEl) badgeEl.textContent = special.badge || "Special Dish";
    if (discountEl) discountEl.textContent = special.discount || "N/A";
    if (imgEl) imgEl.src = special.image;
    
    if (addBtn) {
      addBtn.onclick = async () => {
        await addToCart({
          id: "special_item",
          name: special.name,
          price: special.price,
          category: "Special",
          description: special.description,
          image: special.image
        });
      };
    }
  }
}

// 9. Render Menu Grid with Filtering
async function renderMenuGrid(category = "all", searchQuery = "") {
  const menuItems = await DB.getMenu();
  const grid = document.getElementById("menu-items-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = menuItems.filter(item => {
    const matchesCat = (category === "all" || item.category === category);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                          item.description.toLowerCase().includes(searchQuery) ||
                          item.category.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px 0;">No menu items match your search.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "menu-card";
    
    // Check item availability from dashboard settings
    const isOut = item.availability === "Out of Stock";
    const isLimited = item.availability === "Limited Quantity";
    
    let badgeHtml = "";
    if (isOut) {
      badgeHtml = `<span class="badge-bestseller" style="background:#dc3545; color:white;">OUT OF STOCK</span>`;
    } else if (item.bestSeller) {
      badgeHtml = `<span class="badge-bestseller">Best Seller</span>`;
    } else if (isLimited) {
      badgeHtml = `<span class="badge-bestseller" style="background:#ffc107; color:black;">LIMITED STOCK</span>`;
    }

    card.innerHTML = `
      <div class="menu-card-img-wrapper">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
        <div class="menu-card-badges">
          ${badgeHtml}
          <span class="badge-veg"><span class="${item.isVeg ? 'veg-badge' : 'nonveg-badge'}"></span></span>
        </div>
      </div>
      <div class="menu-card-body">
        <div class="menu-card-title">
          <h3>${item.name}</h3>
          <span class="menu-card-price">₹${item.price}</span>
        </div>
        <p class="menu-card-desc">${item.description}</p>
        <div class="menu-card-footer">
          ${isOut ? `
            <button class="btn btn-secondary" style="width:100%; cursor:not-allowed; opacity:0.6; padding: 8px;" disabled>Currently Unavailable</button>
          ` : `
            <button class="btn btn-primary" onclick="addToCartById('${item.id}')" style="width:100%; padding: 8px;"><i class="fa-solid fa-plus-circle"></i> Add to Cart</button>
          `}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 10. Cart Operations
async function addToCartById(id) {
  const menuItems = await DB.getMenu();
  const item = menuItems.find(i => i.id === id);
  if (item) {
    await addToCart(item);
  }
}

async function addToCart(item) {
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  await updateCartUI();
  openPreOrder();
}

async function changeQty(id, amt) {
  const item = cart.find(c => c.id === id);
  if (item) {
    item.qty += amt;
    if (item.qty <= 0) {
      cart = cart.filter(c => c.id !== id);
    }
  }
  await updateCartUI();
}

async function updateCartUI() {
  const container = document.getElementById("cart-items-container");
  const totalLabel = document.getElementById("cart-total-price");
  const countBadge = document.getElementById("cart-count-badge");
  const prepRow = document.getElementById("cart-prep-row");
  const prepVal = document.getElementById("cart-prep-duration");

  if (!container || !totalLabel || !countBadge) return;

  container.innerHTML = "";
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); margin-top:50px;">
        <i class="fa-solid fa-basket-shopping" style="font-size: 40px; margin-bottom: 10px; opacity:0.3;"></i>
        <p>Your cart is empty. Add items from the menu to pre-order.</p>
      </div>
    `;
    totalLabel.textContent = "₹0";
    countBadge.textContent = "0";
    if (prepRow) prepRow.style.display = "none";
    return;
  }

  let total = 0;
  let totalQtyCount = 0;
  
  // Prep time computation: max category duration among cart items
  const prepTimes = await DB.getPrepTimes();
  let maxPrepTime = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    totalQtyCount += item.qty;

    let cat = item.category;
    if (cat === "Special") cat = "Main Course";
    const itemPrep = prepTimes[cat] || 15;
    if (itemPrep > maxPrepTime) {
      maxPrepTime = itemPrep;
    }

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p style="font-size:12px; color:var(--text-muted)">₹${item.price} each | Prep: ${itemPrep} mins</p>
        <div class="cart-item-qty">
          <button type="button" class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
          <span style="font-weight:600; font-size:14px;">${item.qty}</span>
          <button type="button" class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <div style="text-align:right;">
        <span style="font-weight:700; color:var(--primary)">₹${itemTotal}</span>
      </div>
    `;
    container.appendChild(div);
  });

  totalLabel.textContent = `₹${total}`;
  countBadge.textContent = totalQtyCount;
  
  if (prepRow && prepVal) {
    prepVal.textContent = `${maxPrepTime} mins`;
    prepRow.style.display = "flex";
  }
}

// Order Submission Handler
async function submitPreOrder(event) {
  event.preventDefault();
  if (cart.length === 0) {
    alert("Your cart is empty. Please add items before checking out.");
    return;
  }

  // Retrieve inputs
  const nameVal = document.getElementById("ord-name").value.trim();
  const phoneVal = document.getElementById("ord-phone").value.trim();
  const notesVal = document.getElementById("ord-notes").value.trim();
  const timeVal = activeTableNumber ? "" : document.getElementById("ord-time").value;

  // Retrieve prep time
  const prepTimes = await DB.getPrepTimes();
  let maxPrepTime = 0;
  cart.forEach(item => {
    let cat = item.category;
    if (cat === "Special") cat = "Main Course";
    const itemPrep = prepTimes[cat] || 15;
    if (itemPrep > maxPrepTime) maxPrepTime = itemPrep;
  });

  // Warn if pickup time selected is too early (Only for pickup flow)
  if (!activeTableNumber && timeVal) {
    const now = new Date();
    const [pHR, pMIN] = timeVal.split(":").map(Number);
    const pickupDate = new Date();
    pickupDate.setHours(pHR, pMIN, 0, 0);
    
    const diffMs = pickupDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins > 0 && diffMins < maxPrepTime) {
      if (!confirm(`⚠️ Warning: preparing this order requires about ${maxPrepTime} minutes. Your chosen pickup time is in only ${diffMins} minutes.\n\nDo you want to submit anyway?`)) {
        return;
      }
    }
  }

  // Compile Unified Order Object
  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const orderObj = {
    orderType: activeTableNumber ? "Dine-In" : "Pickup",
    tableNumber: activeTableNumber,
    name: nameVal || (activeTableNumber ? "Table " + activeTableNumber : "Guest"),
    phone: phoneVal || "",
    pickupTime: timeVal,
    notes: notesVal,
    items: cart,
    totalPrice: total,
    prepTime: maxPrepTime,
    status: "Received",
    paymentStatus: "Unpaid"
  };

  const savedOrder = await DB.addOrder(orderObj);

  // Close Side drawer
  document.getElementById("cart-drawer").classList.remove("open");

  // Show live confirmation and trigger real-time order tracker
  cart = [];
  await updateCartUI();
  document.getElementById("preorder-form").reset();
  
  // Launch tracker modal overlay
  launchOrderTracker(savedOrder.id);

  // Optional: Trigger WhatsApp confirmation message
  const itemsSummary = savedOrder.items.map(i => `${i.name} x${i.qty} (₹${i.price * i.qty})`).join("\n");
  const whatsappText = activeTableNumber 
    ? `*Pista House - New Dine-In Order*\n\nTable: ${savedOrder.tableNumber}\nName: ${savedOrder.name}\nNotes: ${savedOrder.notes || 'None'}\n\n*Items Ordered:*\n${itemsSummary}\n\n*Total Amount: ₹${total}*\n\n*Order ID: ${savedOrder.id}*`
    : `*Pista House - Pre-Order Pickup Booking*\n\nName: ${savedOrder.name}\nPhone: ${savedOrder.phone}\nPickup Time: ${savedOrder.pickupTime}\nEst. Prep Time: ${savedOrder.prepTime} mins\nNotes: ${savedOrder.notes || 'None'}\n\n*Items Ordered:*\n${itemsSummary}\n\n*Total Amount: ₹${total}*\n\n*Order ID: ${savedOrder.id}*`;
  
  const waNumber = localStorage.getItem("settings_whatsapp_phone") || "918143227553";
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappText)}`;
  
  // Open WhatsApp in separate background tab
  setTimeout(() => {
    window.open(waUrl, "_blank");
  }, 1000);
}

// 10. Live Status order tracker functions
async function launchOrderTracker(orderId) {
  trackingOrderId = orderId;
  const overlay = document.getElementById("order-tracker-overlay");
  if (!overlay) return;

  overlay.style.display = "flex";
  
  // Run initial polling render
  await pollTrackerStatus();

  // Set Interval to poll every 3 seconds
  if (trackerPollInterval) clearInterval(trackerPollInterval);
  trackerPollInterval = setInterval(pollTrackerStatus, 3000);
}

async function pollTrackerStatus() {
  if (!trackingOrderId) return;
  const orders = await DB.getOrders();
  const order = orders.find(o => o.id === trackingOrderId);
  
  if (!order) {
    closeOrderTracker();
    return;
  }

  // Update ID label
  document.getElementById("tracker-order-id").textContent = `Order ID: ${order.id}`;

  // Update Type Details
  const typeSpan = document.getElementById("tracker-type");
  const isDineIn = order.orderType === "Dine-In";
  typeSpan.textContent = isDineIn ? `Dine-In (Table ${order.tableNumber})` : "Pre-Order & Pickup";
  typeSpan.style.color = isDineIn ? "var(--primary)" : "var(--accent)";

  // Update estimated ready time
  document.getElementById("tracker-ready-time").textContent = order.estimatedReadyTime;

  // Calculate remaining countdown minutes
  const countdownBox = document.getElementById("tracker-countdown-row");
  const countdownSpan = document.getElementById("tracker-countdown");
  
  if (order.status === "Completed" || order.status === "Served" || order.status === "Picked Up") {
    countdownBox.style.display = "none";
  } else {
    countdownBox.style.display = "flex";
    
    // Compute remaining minutes
    const now = new Date();
    // Parse estimatedReadyTime (E.g. "10:45 PM" or "10:45 AM")
    const [timeStr, ampm] = order.estimatedReadyTime.split(" ");
    let [hr, min] = timeStr.split(":").map(Number);
    if (ampm === "PM" && hr < 12) hr += 12;
    if (ampm === "AM" && hr === 12) hr = 0;
    
    const targetDate = new Date();
    targetDate.setHours(hr, min, 0, 0);

    const diffMs = targetDate - now;
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins <= 0) {
      countdownSpan.textContent = "Serving shortly...";
      countdownSpan.style.color = "var(--primary)";
    } else {
      countdownSpan.textContent = `${diffMins} mins`;
      countdownSpan.style.color = "var(--accent)";
    }
  }

  // Update Progress Nodes and status label titles
  const nodeServingLabel = document.getElementById("node-serving-label");
  const nodeCompletedLabel = document.getElementById("node-completed-label");
  
  if (isDineIn) {
    nodeServingLabel.textContent = "Serving Soon";
    nodeCompletedLabel.textContent = "Served";
  } else {
    nodeServingLabel.textContent = "Ready";
    nodeCompletedLabel.textContent = "Picked Up";
  }

  // Map active progress states
  const nReceived = document.getElementById("node-received");
  const nPreparing = document.getElementById("node-preparing");
  const nServing = document.getElementById("node-serving");
  const nCompleted = document.getElementById("node-completed");
  const progLine = document.getElementById("tracker-progress-line");
  const statusTitle = document.getElementById("tracker-status-title");
  const contextMsg = document.getElementById("tracker-context-msg");
  const statusIcon = document.getElementById("tracker-status-icon");

  // Reset classes
  const nodes = [nReceived, nPreparing, nServing, nCompleted];
  nodes.forEach(n => {
    n.classList.remove("active-node");
    n.style.backgroundColor = "#e2e8f0";
    n.style.color = "#475569";
    n.style.boxShadow = "none";
  });

  // Toggle spinners
  statusIcon.className = "fa-solid fa-circle-notch fa-spin";
  statusIcon.style.color = "var(--primary)";

  const setNodeActive = (node) => {
    node.style.backgroundColor = "var(--primary)";
    node.style.color = "white";
    node.style.boxShadow = "0 0 0 4px rgba(30,70,32,0.2)";
  };

  const status = order.status;
  statusTitle.textContent = status;

  if (status === "Received") {
    setNodeActive(nReceived);
    progLine.style.width = "0%";
    contextMsg.textContent = isDineIn ? `"Your order has been accepted."` : `"Your order has been received."`;
  } else if (status === "Preparing") {
    setNodeActive(nReceived);
    setNodeActive(nPreparing);
    progLine.style.width = "33%";
    contextMsg.textContent = isDineIn ? `"Our chefs are preparing your food."` : `"Your food is being prepared."`;
  } else if (status === "Serving Soon" || status === "Ready for Pickup" || status === "Ready") {
    setNodeActive(nReceived);
    setNodeActive(nPreparing);
    setNodeActive(nServing);
    progLine.style.width = "66%";
    contextMsg.textContent = isDineIn ? `"Your food will arrive at your table shortly."` : `"Your food is ready. Please collect your order."`;
  } else if (status === "Completed" || status === "Served" || status === "Picked Up") {
    setNodeActive(nReceived);
    setNodeActive(nPreparing);
    setNodeActive(nServing);
    setNodeActive(nCompleted);
    progLine.style.width = "100%";
    contextMsg.textContent = isDineIn ? `"Enjoy your meal! Served fresh to your table."` : `"Enjoy your food! Thank you for dining with us."`;
    
    // Stop spin icon
    statusIcon.className = "fa-solid fa-circle-check";
    statusIcon.style.color = "#16a34a";
  }
}

function closeOrderTracker() {
  document.getElementById("order-tracker-overlay").style.display = "none";
  if (trackerPollInterval) {
    clearInterval(trackerPollInterval);
    trackerPollInterval = null;
  }
  trackingOrderId = "";
}

// 11. Render Reviews
async function renderReviews() {
  const reviews = await DB.getReviews();
  const grid = document.getElementById("reviews-items-grid");
  if (!grid) return;

  grid.innerHTML = "";
  
  reviews.slice(0, 4).forEach(r => {
    const card = document.createElement("div");
    card.className = "review-card";
    
    let starsHtml = "";
    const floor = Math.floor(r.rating);
    for (let i = 0; i < 5; i++) {
      if (i < floor) {
        starsHtml += `<i class="fa-solid fa-star" style="color:#ffb400;"></i>`;
      } else if (i === floor && r.rating % 1 !== 0) {
        starsHtml += `<i class="fa-solid fa-star-half-stroke" style="color:#ffb400;"></i>`;
      } else {
        starsHtml += `<i class="fa-regular fa-star" style="color:#ffb400;"></i>`;
      }
    }

    card.innerHTML = `
      <div class="review-header">
        <span class="review-user">${r.name}</span>
        <div class="stars">${starsHtml}</div>
      </div>
      <p class="review-text">"${r.text}"</p>
      <div class="review-date">${r.date}</div>
    `;
    grid.appendChild(card);
  });
}

// 12. Dynamic Open Status Indicator & Highlights
function updateOperatingHoursHighlight() {
  const statusBadge = document.getElementById("time-status-badge");
  const hoursList = document.getElementById("hours-list-view");
  if (!statusBadge) return;

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  if (hoursList) {
    const listItems = hoursList.querySelectorAll("li");
    listItems.forEach(li => {
      const d = parseInt(li.getAttribute("data-day"));
      if (d === currentDay) {
        li.classList.add("current-day");
      }
    });
  }

  const openTimeInMinutes = 12 * 60 + 30;
  const closeTimeInMinutes = 23 * 60 + 45;
  const nowTimeInMinutes = currentHour * 60 + currentMin;

  if (nowTimeInMinutes >= openTimeInMinutes && nowTimeInMinutes <= closeTimeInMinutes) {
    statusBadge.textContent = "● OPEN NOW";
    statusBadge.style.backgroundColor = "#d4edda";
    statusBadge.style.color = "#155724";
  } else {
    statusBadge.textContent = "● CLOSED CURRENTLY";
    statusBadge.style.backgroundColor = "#f8d7da";
    statusBadge.style.color = "#721c24";
  }
}

// 13. Lightbox Gallery functions
function openLightbox(src, caption) {
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const cap = document.getElementById("lightbox-caption");
  if (lightbox && img && cap) {
    img.src = src;
    cap.textContent = caption;
    lightbox.style.display = "flex";
  }
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.style.display = "none";
  }
}

// 14. Lead Collection Popup Initialization
function initLeadPopup() {
  const overlay = document.getElementById("lead-popup-overlay");
  const closeBtn = document.getElementById("lead-popup-close");
  const leadForm = document.getElementById("lead-form");
  if (!overlay) return;

  if (sessionStorage.getItem("km_popup_dismissed") === "true") {
    return;
  }

  setTimeout(() => {
    if (sessionStorage.getItem("km_popup_dismissed") !== "true") {
      overlay.style.display = "flex";
    }
  }, 12000);

  document.addEventListener("mouseleave", (e) => {
    if (e.clientY < 20) {
      if (sessionStorage.getItem("km_popup_dismissed") !== "true") {
        overlay.style.display = "flex";
      }
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.style.display = "none";
      sessionStorage.setItem("km_popup_dismissed", "true");
    });
  }

  if (leadForm) {
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("lead-name").value;
      const phone = document.getElementById("lead-phone").value;
      
      await DB.addLead(name, phone);
      sessionStorage.setItem("km_popup_dismissed", "true");
      overlay.style.display = "none";
      
      const couponText = `*Pista House Welcome Coupon*\n\nHello ${name},\nThank you for signing up! Here is your 10% OFF coupon code for your next dine-in or pickup order:\n\n👉 *WELCOME10*\n\nShow this message to our staff to claim.`;
      const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "") || '918143227553'}?text=${encodeURIComponent(couponText)}`;
      
      alert("Discount Coupon Issued! Redirecting to WhatsApp to save your Coupon Code.");
      window.open(waUrl, "_blank");
    });
  }
}

// 15. Show Loyalty Progress
function showLoyaltyProgress(lead) {
  document.getElementById("loyalty-search-form").style.display = "none";
  document.getElementById("loyalty-progress-view").style.display = "block";

  const userTitle = document.getElementById("loyalty-user-title");
  const memberSince = document.getElementById("loyalty-member-since");
  const bar = document.getElementById("loyalty-bar");
  const visitsCount = document.getElementById("loyalty-visits-count");
  const remainingMeals = document.getElementById("loyalty-remaining-meals");
  const stampsGrid = document.getElementById("loyalty-stamps-grid");
  const notification = document.getElementById("loyalty-notification-badge");

  if (!userTitle || !memberSince || !bar || !visitsCount || !remainingMeals || !stampsGrid) return;

  userTitle.textContent = `Hello, ${lead.name || 'Valued Guest'}!`;
  memberSince.textContent = `Rewards Member Since: ${lead.joinDate}`;
  
  const visits = lead.visits || 0;
  const progressVal = lead.rewardsProgress || (visits % 10);
  const remaining = 10 - progressVal;

  visitsCount.textContent = `${visits} total meals completed`;
  remainingMeals.textContent = remaining === 0 || visits === 0 ? "You have a FREE meal waiting!" : `${remaining} more visits to your FREE meal!`;

  const percent = progressVal * 10;
  bar.style.width = `${percent}%`;

  stampsGrid.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const stampDiv = document.createElement("div");
    if (i === 10) {
      stampDiv.className = `stamp free-meal ${progressVal === 0 && visits > 0 ? 'earned' : ''}`;
      stampDiv.innerHTML = '<i class="fa-solid fa-gift"></i>';
      stampDiv.title = "Free 10th Meal!";
    } else {
      const earned = i <= progressVal;
      stampDiv.className = `stamp ${earned ? 'earned' : ''}`;
      stampDiv.textContent = earned ? '✓' : i;
    }
    stampsGrid.appendChild(stampDiv);
  }

  if (progressVal === 0 && visits > 0) {
    notification.style.display = "block";
  } else {
    notification.style.display = "none";
  }
}

// 16. Load Custom Content Settings
function loadCustomSettingsContent() {
  const customTitle = localStorage.getItem("settings_hero_title");
  const customHours = localStorage.getItem("settings_hours_text");
  
  const titleEl = document.getElementById("hero-headline-text");
  const hoursEl = document.getElementById("hero-hours-label-text");
  
  if (customTitle && titleEl) {
    titleEl.textContent = customTitle;
  }
  if (customHours && hoursEl) {
    hoursEl.textContent = `Hours: ${customHours}`;
  }
}

// Global functions exports for HTML buttons clicks
window.addToCartById = addToCartById;
window.changeQty = changeQty;
window.openPreOrder = openPreOrder;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.submitPreOrder = submitPreOrder;
window.closeOrderTracker = closeOrderTracker;
window.launchOrderTracker = launchOrderTracker;
