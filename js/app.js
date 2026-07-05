// Kamadhenu Veg - Customer Site JavaScript Interactions

let cart = [];

document.addEventListener("DOMContentLoaded", async () => {
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
      const text = `*Kamadhenu Veg - Table Reservation Request*\n\nName: ${name}\nPhone: ${phone}\nDate: ${date}\nTime: ${time}\nGuests: ${guests} People\nOccasion: ${occasion}\nNotes: ${notes || 'None'}\n\n*Reference ID: ${savedRes.id}*`;
      const waNumber = localStorage.getItem("settings_whatsapp_phone") || "919876543210";
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
      const text = "*Kamadhenu Veg - Table Booking / Catering Inquiry*\n\nHello, I would like to make an inquiry about dine-in table reservations or outdoor catering services.";
      const waNumber = localStorage.getItem("settings_whatsapp_phone") || "919876543210";
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
    });
  }
});

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
      // Re-bind click event
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
          <span class="badge-veg"><span class="veg-badge"></span></span>
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
            <button class="btn btn-primary" onclick="addToCartById('${item.id}')" style="width:100%; padding: 8px;"><i class="fa-solid fa-plus-circle"></i> Add to Pre-Order</button>
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

    // Resolve category and get prep time
    let cat = item.category;
    if (cat === "Special") cat = "Main Course"; // Fallback for Today's special
    const itemPrep = prepTimes[cat] || 15; // default 15 mins fallback
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
  
  // Show computed prep time
  if (prepRow && prepVal) {
    prepVal.textContent = `${maxPrepTime} mins`;
    prepRow.style.display = "flex";
  }
}

// Pre-Order Submit
async function submitPreOrder(event) {
  event.preventDefault();
  if (cart.length === 0) {
    alert("Your cart is empty. Please add items before checking out.");
    return;
  }

  const name = document.getElementById("ord-name").value;
  const phone = document.getElementById("ord-phone").value;
  const time = document.getElementById("ord-time").value;
  const notes = document.getElementById("ord-notes").value;

  // Retrieve calculated prep time
  const prepTimes = await DB.getPrepTimes();
  let maxPrepTime = 0;
  cart.forEach(item => {
    let cat = item.category;
    if (cat === "Special") cat = "Main Course";
    const itemPrep = prepTimes[cat] || 15;
    if (itemPrep > maxPrepTime) maxPrepTime = itemPrep;
  });

  // Warn if pickup time selected is too early
  if (time) {
    const now = new Date();
    const [pHR, pMIN] = time.split(":").map(Number);
    const pickupDate = new Date();
    pickupDate.setHours(pHR, pMIN, 0, 0);
    
    const diffMs = pickupDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    
    // Check if pickup is today and if diff is less than prep time
    if (diffMins > 0 && diffMins < maxPrepTime) {
      if (!confirm(`⚠️ Warning: preparing this order requires about ${maxPrepTime} minutes. Your chosen pickup time is in only ${diffMins} minutes.\n\nDo you want to submit anyway?`)) {
        return;
      }
    }
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const itemsSummary = cart.map(i => `${i.name} x${i.qty} (₹${i.price * i.qty})`).join("\n");

  const orderObj = {
    name,
    phone,
    pickupTime: time,
    notes,
    items: cart,
    totalPrice: total,
    prepTime: maxPrepTime
  };

  const savedOrder = await DB.addPreOrder(orderObj);

  // Generate simulated WhatsApp order link
  const text = `*Kamadhenu Veg - Pre-Order Pickup Booking*\n\nName: ${name}\nPhone: ${phone}\nPickup Time: ${time}\nEst. Prep Time: ${maxPrepTime} mins\nSpecial Notes: ${notes || 'None'}\n\n*Items Ordered:*\n${itemsSummary}\n\n*Total Amount: ₹${total}*\n\n*Order ID: ${savedOrder.id}*`;
  const waNumber = localStorage.getItem("settings_whatsapp_phone") || "919876543210";
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

  alert(`Pre-Order Placed Successfully! Your Order ID is: ${savedOrder.id}. Est. Prep Time: ${maxPrepTime} mins. We are redirecting you to WhatsApp to complete confirmation.`);
  window.open(waUrl, "_blank");

  // Reset Cart and Form
  cart = [];
  await updateCartUI();
  document.getElementById("preorder-form").reset();
  document.getElementById("cart-drawer").classList.remove("open");
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

  // Highlight current day in list
  if (hoursList) {
    const listItems = hoursList.querySelectorAll("li");
    listItems.forEach(li => {
      const d = parseInt(li.getAttribute("data-day"));
      if (d === currentDay) {
        li.classList.add("current-day");
      }
    });
  }

  // Operating Hours: 12:30 PM (12.5 hrs) to 11:45 PM (23.75 hrs)
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

  // Check if popup was already submitted or closed in this session
  if (sessionStorage.getItem("km_popup_dismissed") === "true") {
    return;
  }

  // Fire after 12 seconds
  setTimeout(() => {
    if (sessionStorage.getItem("km_popup_dismissed") !== "true") {
      overlay.style.display = "flex";
    }
  }, 12000);

  // Trigger on Exit Intent (Mouse leaves top of screen)
  document.addEventListener("mouseleave", (e) => {
    if (e.clientY < 20) {
      if (sessionStorage.getItem("km_popup_dismissed") !== "true") {
        overlay.style.display = "flex";
      }
    }
  });

  // Close Event
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.style.display = "none";
      sessionStorage.setItem("km_popup_dismissed", "true");
    });
  }

  // Submit Lead Form
  if (leadForm) {
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("lead-name").value;
      const phone = document.getElementById("lead-phone").value;
      
      await DB.addLead(name, phone);
      sessionStorage.setItem("km_popup_dismissed", "true");
      overlay.style.display = "none";
      
      // WhatsApp Coupon redirect
      const couponText = `*Kamadhenu Veg Welcome Coupon*\n\nHello ${name},\nThank you for signing up! Here is your 10% OFF coupon code for your next dine-in or pickup order:\n\n👉 *WELCOME10*\n\nShow this message to our staff to claim.`;
      const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "") || '919876543210'}?text=${encodeURIComponent(couponText)}`;
      
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
  
  // Calculate reward progress
  const visits = lead.visits || 0;
  const progressVal = lead.rewardsProgress || (visits % 10);
  const remaining = 10 - progressVal;

  visitsCount.textContent = `${visits} total meals completed`;
  remainingMeals.textContent = remaining === 0 || visits === 0 ? "You have a FREE meal waiting!" : `${remaining} more visits to your FREE meal!`;

  // Update progress bar width
  const percent = progressVal * 10;
  bar.style.width = `${percent}%`;

  // Draw Stamps Visual Grid
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

  // Check eligibility notification (if progress is completed)
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
