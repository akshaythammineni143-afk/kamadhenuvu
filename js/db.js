// Database State Layer supporting Dual-Mode: Supabase & LocalStorage (Unified Orders Edition)

const DEFAULT_MENU = [
  {
    id: "m1",
    name: "Special Chicken Mandi",
    price: 490,
    category: "Mandi",
    description: "Arabian style slow-cooked Mandi rice topped with juicy spice-rubbed grilled chicken, served with salad and special garlic and spicy tomato dips.",
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: false
  },
  {
    id: "m2",
    name: "Royal Mutton Mandi",
    price: 640,
    category: "Mandi",
    description: "Perfectly seasoned long grain basmati rice served with incredibly tender mutton shank slow-roasted with Arabian herbs and dry fruits.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: false
  },
  {
    id: "m3",
    name: "Pista House Special Haleem",
    price: 290,
    category: "Starters",
    description: "Our world-famous seasonal delicacy made of pure mutton, wheat, lentils, ghee, and exotic spices, slow-cooked to a thick pasty consistency and garnished with fried onions, lemons, and cashews.",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: false
  },
  {
    id: "m4",
    name: "Chicken 65",
    price: 280,
    category: "Starters",
    description: "A popular South Indian deep-fried spicy chicken appetizer tossed with fresh curry leaves, yogurt, and red chilies.",
    image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
    bestSeller: false,
    isVeg: false
  },
  {
    id: "m5",
    name: "Hyderabadi Chicken Biryani",
    price: 340,
    category: "Biryani",
    description: "Fragrant long-grain basmati rice layered with marinated chicken, saffron, fried onions, and pure ghee, cooked in the traditional clay pot Dum style.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: false
  },
  {
    id: "m6",
    name: "Hyderabadi Mutton Biryani",
    price: 390,
    category: "Biryani",
    description: "Exquisite layered rice dish cooked with tender mutton pieces infused with cardamom, cinnamon, and fresh mint.",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: false
  },
  {
    id: "m7",
    name: "Seekh Kebab",
    price: 290,
    category: "Grills",
    description: "Skewered minced mutton mixed with aromatic spices, fresh coriander, and mint, grilled to smoky perfection in our tandoor.",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80",
    bestSeller: false,
    isVeg: false
  },
  {
    id: "m8",
    name: "Tandoori Chicken (Half)",
    price: 310,
    category: "Grills",
    description: "Juicy half chicken marinated in classic yogurt, tandoori masala, and red spices, roasted in our traditional clay oven.",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80",
    bestSeller: false,
    isVeg: false
  },
  {
    id: "m9",
    name: "Classic Chicken Shawarma",
    price: 150,
    category: "Shawarma",
    description: "Thinly sliced slow-roasted chicken rolled in flatbread with pickled vegetables, french fries, and creamy garlic mayonnaise.",
    image: "https://images.unsplash.com/photo-1561651823-34fed022540e?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: false
  },
  {
    id: "m10",
    name: "Qubani Ka Meetha",
    price: 160,
    category: "Desserts",
    description: "Traditional Hyderabadi dessert made from dried stewed apricots, garnished with almonds and fresh thick cream.",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: true
  },
  {
    id: "m11",
    name: "Special Zafrani Chai",
    price: 60,
    category: "Beverages",
    description: "Pista House iconic thick-brewed cream tea flavored with crushed green cardamom, saffron strands, and condensed milk.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    bestSeller: true,
    isVeg: true
  },
  {
    id: "m12",
    name: "Fresh Mint Lime Soda",
    price: 90,
    category: "Beverages",
    description: "Refreshing fizzy cooler brewed with freshly squeezed lime juice, mint sprigs, black salt, and sugar syrup.",
    image: "https://images.unsplash.com/photo-1571006682889-7f8f5f24164b?auto=format&fit=crop&w=600&q=80",
    bestSeller: false,
    isVeg: true
  }
];

const DEFAULT_SPECIAL = {
  name: "Royal Mutton Mandi Platter",
  price: 640,
  description: "Our signature slow-cooked mutton mandi served with aromatic long-grain rice, topped with caramelized onions and roasted almonds. Perfect for sharing!",
  image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  badge: "Arabian Delight",
  discount: "Complimentary Zafrani Chai (Weekend Only)"
};

const DEFAULT_REVIEWS = [
  { name: "Adnan Khan", rating: 5, text: "The Mutton Mandi was absolutely spectacular! Extremely tender meat that falls off the bone. Also tried their iconic Zafrani Chai, outstanding quality.", date: "2 days ago" },
  { name: "Priya Sen", rating: 4.5, text: "Best Hyderabadi Chicken Biryani in town! The spices are perfectly balanced and the chicken is juicy. Highly recommend the Qubani Ka Meetha for dessert.", date: "1 week ago" },
  { name: "Sameer Uddin", rating: 5, text: "Pista House Haleem is the gold standard! Thick, rich, ghee-laden, and packed with flavor. The seating area is excellent for large groups.", date: "2 weeks ago" },
  { name: "Kiran Kumar", rating: 4, text: "Excellent Shawarma and Grills. The Tandoori Chicken was roasted to perfection. Gets very crowded on weekends, but service is reasonably quick.", date: "3 weeks ago" }
];

const DEFAULT_PREP_TIMES = {
  "Mandi": 35,
  "Biryani": 25,
  "Starters": 15,
  "Grills": 30,
  "Shawarma": 10,
  "Desserts": 10,
  "Beverages": 5
};

// Supabase Connection Client Checker
let supabaseClient = null;

// Extract database credentials from URL parameters (for guest mobile QR scans)
const urlParams = new URLSearchParams(window.location.search);
const urlSbUrl = urlParams.get("sb_url");
const urlSbAnon = urlParams.get("sb_anon");
if (urlSbUrl && urlSbAnon) {
  localStorage.setItem("sb_url", urlSbUrl);
  localStorage.setItem("sb_anon", urlSbAnon);
}

const sbUrl = localStorage.getItem("sb_url") || (window.CONFIG_SB_URL || "");
const sbAnon = localStorage.getItem("sb_anon") || (window.CONFIG_SB_ANON || "");

if (sbUrl && sbAnon && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(sbUrl, sbAnon);
    console.log("DB Layer: Supabase Cloud Client Initialized successfully.");
  } catch (err) {
    console.error("DB Layer: Failed to initialize Supabase client:", err);
  }
}

const DB = {
  // Check if Supabase mode is active
  isSupabase() {
    return supabaseClient !== null;
  },

  // Initialize LocalStorage defaults fallback
  initLocal() {
    if (!localStorage.getItem("km_menu")) {
      localStorage.setItem("km_menu", JSON.stringify(DEFAULT_MENU));
    }
    if (!localStorage.getItem("km_special")) {
      localStorage.setItem("km_special", JSON.stringify(DEFAULT_SPECIAL));
    }
    if (!localStorage.getItem("km_reviews")) {
      localStorage.setItem("km_reviews", JSON.stringify(DEFAULT_REVIEWS));
    }
    if (!localStorage.getItem("km_leads")) {
      localStorage.setItem("km_leads", JSON.stringify([]));
    }
    if (!localStorage.getItem("km_reservations")) {
      localStorage.setItem("km_reservations", JSON.stringify([]));
    }
    if (!localStorage.getItem("km_orders")) {
      localStorage.setItem("km_orders", JSON.stringify([]));
    }
    if (!localStorage.getItem("km_feedback")) {
      localStorage.setItem("km_feedback", JSON.stringify([]));
    }
    if (!localStorage.getItem("km_prep_times")) {
      localStorage.setItem("km_prep_times", JSON.stringify(DEFAULT_PREP_TIMES));
    }
  },

  // Seed Supabase with defaults if empty
  async seedSupabaseIfEmpty() {
    if (!this.isSupabase()) return;
    try {
      // 1. Menu
      const { data: menuData } = await supabaseClient.from("km_menu").select("id").limit(1);
      if (!menuData || menuData.length === 0) {
        await supabaseClient.from("km_menu").insert(DEFAULT_MENU);
        console.log("DB Layer: Seeded menu items into Supabase.");
      }

      // 2. Special
      const { data: specData } = await supabaseClient.from("km_special").select("name").limit(1);
      if (!specData || specData.length === 0) {
        await supabaseClient.from("km_special").insert({ id: 1, ...DEFAULT_SPECIAL });
        console.log("DB Layer: Seeded today's special into Supabase.");
      }

      // 3. Reviews
      const { data: revData } = await supabaseClient.from("km_reviews").select("id").limit(1);
      if (!revData || revData.length === 0) {
        const mapped = DEFAULT_REVIEWS.map((r, i) => ({ id: `rev_${i}_${Date.now()}`, ...r }));
        await supabaseClient.from("km_reviews").insert(mapped);
        console.log("DB Layer: Seeded initial guest reviews into Supabase.");
      }
    } catch (err) {
      console.warn("DB Layer: Seeding failed (this is normal if tables are not fully set up yet in SQL editor):", err);
    }
  },

  // ---------------- MENU Catalog ----------------
  async getMenu() {
    if (this.isSupabase()) {
      await this.seedSupabaseIfEmpty();
      const { data, error } = await supabaseClient.from("km_menu").select("*");
      if (!error && data) return data;
      console.warn("DB Layer: Supabase getMenu failed, falling back to local storage.", error);
    }
    this.initLocal();
    return JSON.parse(localStorage.getItem("km_menu"));
  },

  async saveMenu(menu) {
    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_menu").delete().neq("id", "placeholder");
      if (!error) {
        const { error: insErr } = await supabaseClient.from("km_menu").insert(menu);
        if (!insErr) return;
      }
      console.warn("DB Layer: Supabase saveMenu failed, writing locally instead.", error);
    }
    localStorage.setItem("km_menu", JSON.stringify(menu));
  },

  // ---------------- TODAY'S SPECIAL ----------------
  async getSpecial() {
    if (this.isSupabase()) {
      const { data, error } = await supabaseClient.from("km_special").select("*").eq("id", 1).single();
      if (!error && data) return data;
      console.warn("DB Layer: Supabase getSpecial failed, falling back to local.", error);
    }
    this.initLocal();
    return JSON.parse(localStorage.getItem("km_special"));
  },

  async saveSpecial(special) {
    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_special").upsert({ id: 1, ...special });
      if (!error) return;
      console.warn("DB Layer: Supabase saveSpecial failed, writing locally.", error);
    }
    localStorage.setItem("km_special", JSON.stringify(special));
  },

  // ---------------- GUEST REVIEWS ----------------
  async getReviews() {
    if (this.isSupabase()) {
      const { data, error } = await supabaseClient.from("km_reviews").select("*");
      if (!error && data) {
        return data.sort((a,b) => b.id.split("_")[1] - a.id.split("_")[1]);
      }
      console.warn("DB Layer: Supabase getReviews failed.", error);
    }
    this.initLocal();
    return JSON.parse(localStorage.getItem("km_reviews"));
  },

  async addReview(review) {
    const newRev = { id: "rev_" + Date.now(), ...review };
    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_reviews").insert(newRev);
      if (!error) return;
      console.warn("DB Layer: Supabase addReview failed.", error);
    }
    this.initLocal();
    const reviews = JSON.parse(localStorage.getItem("km_reviews"));
    reviews.unshift(review);
    localStorage.setItem("km_reviews", JSON.stringify(reviews));
  },

  // ---------------- CUSTOMER LEADS ----------------
  async getLeads() {
    if (this.isSupabase()) {
      const { data, error } = await supabaseClient.from("km_leads").select("*");
      if (!error && data) return data;
      console.warn("DB Layer: Supabase getLeads failed.", error);
    }
    this.initLocal();
    return JSON.parse(localStorage.getItem("km_leads"));
  },

  async addLead(name, phone, birthday = "") {
    const newLead = {
      phone,
      name,
      birthday: birthday || "Not specified",
      visits: 0,
      rewardsProgress: 0,
      joinDate: new Date().toLocaleDateString()
    };

    if (this.isSupabase()) {
      const { data: existing } = await supabaseClient.from("km_leads").select("*").eq("phone", phone).single();
      if (existing) {
        return { status: "exists", lead: existing };
      }
      const { error } = await supabaseClient.from("km_leads").insert(newLead);
      if (!error) return { status: "new", lead: newLead };
      console.warn("DB Layer: Supabase addLead failed.", error);
    }

    this.initLocal();
    const leads = JSON.parse(localStorage.getItem("km_leads"));
    let lead = leads.find(l => l.phone === phone);
    if (!lead) {
      leads.push(newLead);
      localStorage.setItem("km_leads", JSON.stringify(leads));
      return { status: "new", lead: newLead };
    }
    return { status: "exists", lead };
  },

  async updateLead(phone, fields) {
    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_leads").update(fields).eq("phone", phone);
      if (!error) return fields;
      console.warn("DB Layer: Supabase updateLead failed.", error);
    }
    this.initLocal();
    const leads = JSON.parse(localStorage.getItem("km_leads"));
    const idx = leads.findIndex(l => l.phone === phone);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...fields };
      localStorage.setItem("km_leads", JSON.stringify(leads));
      return leads[idx];
    }
    return null;
  },

  // ---------------- TABLE RESERVATIONS ----------------
  async getReservations() {
    if (this.isSupabase()) {
      const { data, error } = await supabaseClient.from("km_reservations").select("*");
      if (!error && data) {
        return data.sort((a,b) => {
          const idA = a && a.id ? a.id.split("_")[1] : "";
          const idB = b && b.id ? b.id.split("_")[1] : "";
          return (parseInt(idB) || 0) - (parseInt(idA) || 0);
        });
      }
      console.warn("DB Layer: Supabase getReservations failed.", error);
      if (!window.hasAlertedReservationsError) {
        window.hasAlertedReservationsError = true;
        alert(`Database Error (Get Reservations Failed): ${error.message}\nThis means the 'km_reservations' table might be missing or blocked in your Supabase project.`);
      }
    }
    this.initLocal();
    return JSON.parse(localStorage.getItem("km_reservations"));
  },

  async addReservation(res) {
    const newRes = {
      id: "res_" + Date.now(),
      status: "Pending",
      createdAt: new Date().toLocaleString(),
      ...res
    };

    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_reservations").insert(newRes);
      if (!error) {
        await this.addLead(res.name, res.phone);
        return newRes;
      }
      console.warn("DB Layer: Supabase addReservation failed.", error);
      alert(`Database Error (Reservations Insert Failed): ${error.message}\nEnsure your tables have Row Level Security (RLS) disabled or appropriate policies configured.`);
    }

    this.initLocal();
    const reservations = JSON.parse(localStorage.getItem("km_reservations"));
    reservations.unshift(newRes);
    localStorage.setItem("km_reservations", JSON.stringify(reservations));
    this.addLead(res.name, res.phone);
    return newRes;
  },

  async updateReservationStatus(id, status) {
    if (this.isSupabase()) {
      if (status === "Cancelled") {
        const { error } = await supabaseClient.from("km_reservations").delete().eq("id", id);
        if (!error) return { id, status };
        console.warn("DB Layer: Supabase delete reservation failed.", error);
        alert(`Database Error (Reservations Delete Failed): ${error.message}\nEnsure your tables have Row Level Security (RLS) disabled or appropriate policies configured.`);
      } else {
        const { error } = await supabaseClient.from("km_reservations").update({ status }).eq("id", id);
        if (!error) {
          const { data: res } = await supabaseClient.from("km_reservations").select("phone").eq("id", id).single();
          if (status === "Completed" && res) {
            await this.incrementVisits(res.phone);
          }
          return { id, status };
        }
        console.warn("DB Layer: Supabase updateReservationStatus failed.", error);
        alert(`Database Error (Reservations Update Failed): ${error.message}\nEnsure your tables have Row Level Security (RLS) disabled or appropriate policies configured.`);
      }
    }

    this.initLocal();
    let reservations = JSON.parse(localStorage.getItem("km_reservations"));
    if (status === "Cancelled") {
      reservations = reservations.filter(r => r.id !== id);
      localStorage.setItem("km_reservations", JSON.stringify(reservations));
      return { id, status };
    } else {
      const res = reservations.find(r => r.id === id);
      if (res) {
        res.status = status;
        localStorage.setItem("km_reservations", JSON.stringify(reservations));
        if (status === "Completed") {
          this.incrementVisits(res.phone);
        }
        return res;
      }
    }
    return null;
  },

  // ---------------- UNIFIED ORDERS (Pre-Order + Dine-In QR) ----------------
  async getOrders() {
    if (this.isSupabase()) {
      const { data, error } = await supabaseClient.from("km_orders").select("*");
      if (!error && data) {
        return data.sort((a,b) => {
          const idA = a && a.id ? a.id.split("_")[1] : "";
          const idB = b && b.id ? b.id.split("_")[1] : "";
          return (parseInt(idB) || 0) - (parseInt(idA) || 0);
        });
      }
      console.warn("DB Layer: Supabase getOrders failed.", error);
      if (!window.hasAlertedOrdersError) {
        window.hasAlertedOrdersError = true;
        alert(`Database Error (Get Orders Failed): ${error.message}\nThis means the 'km_orders' table is likely missing in your Supabase project. Go to Tab 6 (Settings) on the admin portal, copy the SQL script, and run it in your Supabase SQL Editor.`);
      }
    }
    this.initLocal();
    
    // Backwards compatibility migration check:
    if (!localStorage.getItem("km_orders")) {
      const oldPreorders = localStorage.getItem("km_preorders");
      if (oldPreorders) {
        // Migrate old preorders format to unified km_orders
        const migrated = JSON.parse(oldPreorders).map(o => ({
          orderType: "Pickup",
          tableNumber: "",
          paymentStatus: "Unpaid",
          estimatedReadyTime: new Date(Date.parse(o.createdAt) + (o.prepTime || 15) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ...o
        }));
        localStorage.setItem("km_orders", JSON.stringify(migrated));
        localStorage.removeItem("km_preorders");
      } else {
        localStorage.setItem("km_orders", JSON.stringify([]));
      }
    }
    return JSON.parse(localStorage.getItem("km_orders"));
  },

  // For backward compatibility alias mapping
  async getPreOrders() {
    return this.getOrders();
  },

  async addOrder(order) {
    // Compute Estimated Ready Time
    const now = new Date();
    const readyDate = new Date(now.getTime() + (order.prepTime || 15) * 60000);
    const estReadyStr = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: "ord_" + Date.now(),
      status: "Received",
      paymentStatus: "Unpaid",
      createdAt: now.toLocaleString(),
      estimatedReadyTime: estReadyStr,
      tableNumber: order.tableNumber || "",
      pickupTime: order.pickupTime || "",
      ...order
    };

    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_orders").insert(newOrder);
      if (!error) {
        if (order.phone) {
          await this.addLead(order.name || "QR Guest", order.phone);
        }
        return newOrder;
      }
      console.warn("DB Layer: Supabase addOrder failed.", error);
      alert(`Database Error (Orders Insert Failed): ${error.message}\nEnsure your Supabase project contains the 'km_orders' table.`);
    }

    this.initLocal();
    const orders = JSON.parse(localStorage.getItem("km_orders"));
    orders.unshift(newOrder);
    localStorage.setItem("km_orders", JSON.stringify(orders));
    if (order.phone) {
      this.addLead(order.name || "QR Guest", order.phone);
    }
    return newOrder;
  },

  async updateOrderStatus(id, status) {
    if (this.isSupabase()) {
      if (status === "Cancelled") {
        const { error } = await supabaseClient.from("km_orders").delete().eq("id", id);
        if (!error) return { id, status };
        console.warn("DB Layer: Supabase delete order failed.", error);
        alert(`Database Error (Orders Delete Failed): ${error.message}`);
      } else {
        const { error } = await supabaseClient.from("km_orders").update({ status }).eq("id", id);
        if (!error) {
          const { data: ord } = await supabaseClient.from("km_orders").select("phone").eq("id", id).single();
          if ((status === "Completed" || status === "Served" || status === "Picked Up") && ord && ord.phone) {
            await this.incrementVisits(ord.phone);
          }
          return { id, status };
        }
        console.warn("DB Layer: Supabase updateOrderStatus failed.", error);
        alert(`Database Error (Orders Status Update Failed): ${error.message}`);
      }
    }

    this.initLocal();
    let orders = JSON.parse(localStorage.getItem("km_orders"));
    if (status === "Cancelled") {
      orders = orders.filter(o => o.id !== id);
      localStorage.setItem("km_orders", JSON.stringify(orders));
      return { id, status };
    } else {
      const ord = orders.find(o => o.id === id);
      if (ord) {
        ord.status = status;
        localStorage.setItem("km_orders", JSON.stringify(orders));
        if ((status === "Completed" || status === "Served" || status === "Picked Up") && ord.phone) {
          this.incrementVisits(ord.phone);
        }
        return ord;
      }
    }
    return null;
  },

  // Backward compatibility wrapper aliases mapping
  async addPreOrder(order) {
    return this.addOrder({ orderType: "Pickup", ...order });
  },
  async updatePreOrderStatus(id, status) {
    return this.updateOrderStatus(id, status);
  },

  async updateOrderPaymentStatus(id, paymentStatus) {
    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_orders").update({ paymentStatus }).eq("id", id);
      if (!error) return { id, paymentStatus };
      console.warn("DB Layer: Supabase updateOrderPaymentStatus failed.", error);
    }
    this.initLocal();
    const orders = JSON.parse(localStorage.getItem("km_orders"));
    const ord = orders.find(o => o.id === id);
    if (ord) {
      ord.paymentStatus = paymentStatus;
      localStorage.setItem("km_orders", JSON.stringify(orders));
      return ord;
    }
    return null;
  },

  // ---------------- FEEDBACK ----------------
  async getFeedback() {
    if (this.isSupabase()) {
      const { data, error } = await supabaseClient.from("km_feedback").select("*");
      if (!error && data) {
        return data.sort((a,b) => b.id.split("_")[1] - a.id.split("_")[1]);
      }
      console.warn("DB Layer: Supabase getFeedback failed.", error);
    }
    this.initLocal();
    return JSON.parse(localStorage.getItem("km_feedback"));
  },

  async addFeedbackEntry(fb) {
    const newFb = {
      id: "fb_" + Date.now(),
      date: new Date().toLocaleDateString(),
      ...fb
    };

    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_feedback").insert(newFb);
      if (!error) {
        if (fb.rating >= 4) {
          await this.addReview({
            name: fb.name,
            rating: fb.rating,
            text: fb.feedback,
            date: "Just now"
          });
        }
        return newFb;
      }
      console.warn("DB Layer: Supabase addFeedbackEntry failed.", error);
    }

    this.initLocal();
    const feedbacks = JSON.parse(localStorage.getItem("km_feedback"));
    feedbacks.unshift(newFb);
    localStorage.setItem("km_feedback", JSON.stringify(feedbacks));
    if (fb.rating >= 4) {
      this.addReview({
        name: fb.name,
        rating: fb.rating,
        text: fb.feedback,
        date: "Just now"
      });
    }
    return newFb;
  },

  // ---------------- REWARDS LOYALTY VISITS ----------------
  async incrementVisits(phone) {
    if (this.isSupabase()) {
      const { data: lead, error } = await supabaseClient.from("km_leads").select("*").eq("phone", phone).single();
      if (!error && lead) {
        const visits = (lead.visits || 0) + 1;
        const rewardsProgress = visits % 10;
        const { error: updErr } = await supabaseClient.from("km_leads").update({ visits, rewardsProgress }).eq("phone", phone);
        if (!updErr) return { ...lead, visits, rewardsProgress };
      }
      console.warn("DB Layer: Supabase incrementVisits failed.", error);
    }

    this.initLocal();
    const leads = JSON.parse(localStorage.getItem("km_leads"));
    const lead = leads.find(l => l.phone === phone);
    if (lead) {
      lead.visits = (lead.visits || 0) + 1;
      lead.rewardsProgress = lead.visits % 10;
      localStorage.setItem("km_leads", JSON.stringify(leads));
      return lead;
    }
    return null;
  },

  // ---------------- CATEGORY PREPARATION TIMES ----------------
  async getPrepTimes() {
    if (this.isSupabase()) {
      const { data, error } = await supabaseClient.from("km_settings").select("value").eq("key", "prep_times").single();
      if (!error && data) {
        return JSON.parse(data.value);
      }
      try {
        await supabaseClient.from("km_settings").upsert({ key: "prep_times", value: JSON.stringify(DEFAULT_PREP_TIMES) });
        return DEFAULT_PREP_TIMES;
      } catch (err) {
        console.warn("DB Layer: Supabase settings seed failed.");
      }
    }
    this.initLocal();
    return JSON.parse(localStorage.getItem("km_prep_times"));
  },

  async savePrepTimes(times) {
    if (this.isSupabase()) {
      const { error } = await supabaseClient.from("km_settings").upsert({ key: "prep_times", value: JSON.stringify(times) });
      if (!error) return;
      console.warn("DB Layer: Supabase savePrepTimes failed.", error);
    }
    localStorage.setItem("km_prep_times", JSON.stringify(times));
  }
};

// Initial local fallback checks
DB.initLocal();

// Export to window
window.DB = DB;
