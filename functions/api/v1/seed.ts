import { getDB, generateId } from './_lib/db';
import { verifyAuth, requireAuth } from './_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    // Allow seeding without auth if no users exist (first-time setup)
    const db = getDB(env);
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first();
    if ((userCount as any)?.count > 0) {
      requireAuth(await verifyAuth(request, env), 'ADMIN');
    }

    // --- BBQ Images ---
    const BBQ_IMGS = {
      burger1: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
      burger2: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      brisketPlate: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80",
      wholeBrisket: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
      pulledPork: "https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?auto=format&fit=crop&w=800&q=80",
      porkRibs: "https://images.unsplash.com/photo-1588347818036-558601350947?auto=format&fit=crop&w=800&q=80",
      wings: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80",
      fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
      slaw: "https://images.unsplash.com/photo-1625938144755-652e08e359b7?auto=format&fit=crop&w=800&q=80",
      potatoSalad: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80",
      corn: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
      mac: "https://images.unsplash.com/photo-1548369937-47519962c11a?auto=format&fit=crop&w=800&q=80",
      brioche: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80",
      cutlery: "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
      rub: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
      sauce: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=800&q=80",
    };

    // --- Seed Menu Items (16 items) ---
    const menuItems = [
      { id: 'b1', name: 'The OG Brisket Burger', description: '150g of 12-hour smoked Black Angus brisket, melted American cheddar, house pickles, white onion & signature BBQ sauce on a toasted brioche bun.', price: 18, image: BBQ_IMGS.burger1, category: 'Burgers', available: 1, availability_type: 'everyday' },
      { id: 'b2', name: 'Pulled Pork Burger', description: 'Succulent 12hr smoked pork shoulder tossed in house rub, topped with crunchy apple slaw & tangy Carolina gold sauce on a soft milk bun.', price: 16, image: BBQ_IMGS.burger2, category: 'Burgers', available: 1, availability_type: 'everyday' },
      { id: 'm1', name: 'Brisket Plate (200g)', description: 'Signature 12-hour smoked Black Angus brisket (200g), featuring a perfect smoke ring and bark. Served traditionally with house pickles, white onion, and soft white bread.', price: 32, image: BBQ_IMGS.brisketPlate, category: 'Meats', available: 1, availability_type: 'everyday' },
      { id: 'bm1', name: 'Whole Smoked Brisket (Per KG)', description: 'Minimum 1kg order. Sliced ready to serve. 12hr smoked over Ironbark. The king of meats.', price: 85, unit: 'kg', min_quantity: 1, image: BBQ_IMGS.wholeBrisket, category: 'Bulk Meats', available: 1, availability_type: 'everyday' },
      { id: 'bm2', name: 'Pulled Pork (Per KG)', description: 'Juicy, tender pork shoulder, smoked for 12 hours and hand-pulled. Includes sauce on the side.', price: 65, unit: 'kg', min_quantity: 1, image: BBQ_IMGS.pulledPork, category: 'Bulk Meats', available: 1, availability_type: 'everyday' },
      { id: 'bm3', name: 'Pork Ribs (Full Rack)', description: 'St. Louis cut pork ribs, dry rubbed and glazed with our signature BBQ sauce.', price: 55, unit: 'rack', image: BBQ_IMGS.porkRibs, category: 'Bulk Meats', available: 1, availability_type: 'everyday' },
      { id: 'hs1', name: 'Mac & Cheese Tray', description: 'Large catering tray of our famous 3-cheese Mac. Feeds 10-12 people.', price: 65, image: BBQ_IMGS.mac, category: 'Hot Sides', available: 1, availability_type: 'everyday' },
      { id: 'hs2', name: 'Roasted Corn Cobs', description: 'Tray of 12 corn cobs with butter and paprika salt.', price: 45, image: BBQ_IMGS.corn, category: 'Hot Sides', available: 1, availability_type: 'everyday' },
      { id: 'cs1', name: 'Crunchy Slaw Tray', description: 'Fresh cabbage and carrot slaw with a tangy dressing. Feeds 15-20.', price: 45, image: BBQ_IMGS.slaw, category: 'Cold Sides', available: 1, availability_type: 'everyday' },
      { id: 'cs2', name: 'Potato Salad Tray', description: 'Creamy southern style potato salad with egg and mustard. Feeds 15-20.', price: 55, image: BBQ_IMGS.potatoSalad, category: 'Cold Sides', available: 1, availability_type: 'everyday' },
      { id: 'bak1', name: 'Brioche Slider Buns (Dozen)', description: 'Pack of 12 soft brioche slider buns. Essential for pulled pork.', price: 15, image: BBQ_IMGS.brioche, category: 'Bakery', available: 1, availability_type: 'everyday' },
      { id: 'svc1', name: 'Eco Cutlery Pack (Per Person)', description: 'Wooden knife, fork, napkin and plate.', price: 1.50, image: BBQ_IMGS.cutlery, category: 'Service', available: 1, availability_type: 'everyday' },
      { id: 'rs1', name: 'Signature Brisket Rub (250g)', description: 'Our award-winning salt, pepper, and garlic blend. The secret to our bark. Use generously on beef.', price: 18, image: BBQ_IMGS.rub, category: 'Rubs & Sauces', available: 1, availability_type: 'everyday' },
      { id: 'rs2', name: 'Sweet Heat Pork Rub (250g)', description: 'Paprika based rub with brown sugar and a kick of cayenne. Perfect for ribs and pork shoulder.', price: 18, image: BBQ_IMGS.rub, category: 'Rubs & Sauces', available: 1, availability_type: 'everyday' },
      { id: 'rs3', name: 'BizOS Sauce (500ml)', description: 'Our house-made BBQ sauce. Sweet, tangy, and smoky. Great for glazing or dipping.', price: 15, image: BBQ_IMGS.sauce, category: 'Rubs & Sauces', available: 1, availability_type: 'everyday' },
      { id: 's1', name: 'Loaded Fries', description: 'Crispy shoestring fries loaded with 12hr smoked pulled pork, drenched in warm liquid cheese and drizzled with house smoky BBQ sauce.', price: 15, image: BBQ_IMGS.fries, category: 'Sides', available: 1, availability_type: 'everyday' },
    ];

    for (const item of menuItems) {
      await db.prepare(
        `INSERT OR REPLACE INTO menu_items (id, name, description, price, unit, min_quantity, image, category, available, availability_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(item.id, item.name, item.description, item.price, item.unit || null, item.min_quantity || null, item.image, item.category, item.available, item.availability_type).run();
    }

    // --- Seed Calendar Events ---
    const now = Date.now();
    const events = [
      { id: 'evt1', date: new Date(now + 86400000 * 2).toISOString().split('T')[0], type: 'ORDER_PICKUP', title: 'Manual Order Pickup', location: 'HQ - West End', time: '11:00 AM - 6:00 PM', description: 'Online pre-orders available.', image: BBQ_IMGS.wholeBrisket, tags: JSON.stringify(['#preorder']) },
      { id: 'evt2', date: new Date(now + 86400000 * 5).toISOString().split('T')[0], type: 'BLOCKED', title: 'Kitchen Closed', location: null, time: null, description: null, image: null, tags: null },
    ];

    for (const evt of events) {
      await db.prepare(
        `INSERT OR REPLACE INTO calendar_events (id, date, type, title, description, location, time, image, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(evt.id, evt.date, evt.type, evt.title, evt.description, evt.location, evt.time, evt.image, evt.tags).run();
    }

    // --- Seed Users (admin + dev) ---
    const users = [
      { id: 'admin1', name: 'Pitmaster Dave', email: 'admin@bizos.app', role: 'ADMIN', is_verified: 1, stamps: 0 },
      { id: 'dev1', name: 'Developer', email: 'dev@bizos.app', role: 'DEV', is_verified: 1, stamps: 0 },
    ];

    for (const user of users) {
      await db.prepare(
        `INSERT OR REPLACE INTO users (id, name, email, role, is_verified, stamps) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(user.id, user.name, user.email, user.role, user.is_verified, user.stamps).run();
    }

    // --- Seed Cook Days ---
    await db.prepare(
      `INSERT OR REPLACE INTO cook_days (id, date, location, is_open) VALUES (?, ?, ?, ?)`
    ).bind('cd1', new Date(now + 86400000 * 2).toISOString(), 'Brewery Setup - West End', 1).run();

    // --- Seed Social Post ---
    await db.prepare(
      `INSERT OR REPLACE INTO social_posts (id, platform, content, image, scheduled_for, status, hashtags) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind('p1', 'Instagram', 'Sold out of Brisket for today! 🍖🔥 Catch us next week at the Brewery.', BBQ_IMGS.wholeBrisket, new Date().toISOString(), 'Posted', JSON.stringify(['#soldout', '#brisket', '#bizos', '#bbq'])).run();

    // --- Seed Full Settings (all images, rewards, catering, invoices) ---
    await db.prepare("INSERT OR REPLACE INTO settings (key, data) VALUES ('general', ?)")
      .bind(JSON.stringify({
        maintenanceMode: false,
        heroCateringImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
        heroCookImage: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=1200&q=80",
        homePromoterImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1950&q=80",
        homeScheduleCardImage: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=800&q=80",
        homeMenuCardImage: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
        menuHeroImage: "",
        diyHeroImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1950&q=80",
        diyCardPackageImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
        diyCardCustomImage: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
        cateringPackageImages: {
          essential: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80",
          pitmaster: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
          wholehog: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
        },
        eventsHeroImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1950&q=80",
        promotersHeroImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1950&q=80",
        promotersSocialImage: "https://strummingbird.com.au/wp-content/uploads/2025/06/SB25-Website-Image-Resize-4-1024x576.jpg",
        galleryHeroImage: "https://images.unsplash.com/photo-1516054575922-f0b8eeadec1a?auto=format&fit=crop&w=1950&q=80",
        maintenanceImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1950&q=80",
        stripeConnected: false,
        squareConnected: false,
        squareApplicationId: "",
        squareLocationId: "",
        smartPayConnected: false,
        smartPayPublicKey: "",
        smartPaySecretKey: "",
        smsConnected: false,
        facebookConnected: false,
        facebookAppId: "",
        facebookPageId: "",
        facebookPageAccessToken: "",
        manualTickerImages: [
          BBQ_IMGS.brisketPlate,
          BBQ_IMGS.burger1,
          BBQ_IMGS.porkRibs,
          BBQ_IMGS.wings,
          BBQ_IMGS.burger2,
          BBQ_IMGS.fries,
        ],
        businessName: "BizOS",
        businessAddress: "Ipswich, QLD",
        logoUrl: "/logo.png",
        adminUsername: "admin",
        adminPassword: "123",
        rewards: {
          enabled: true,
          programName: "Meat Sweats Club",
          staffPin: "1234",
          maxStamps: 10,
          rewardTitle: "Free Burger",
          rewardImage: BBQ_IMGS.burger1,
          possiblePrizes: [
            { id: 'p1', title: 'Free Brisket Burger', image: BBQ_IMGS.burger1 },
            { id: 'p2', title: 'Loaded Fries', image: BBQ_IMGS.fries },
            { id: 'p3', title: 'Free Drink', image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80" },
          ],
        },
        cateringPackages: [
          {
            id: 'pkg_essential',
            name: 'The Essentials',
            description: 'The "No Fuss" option. Perfect for casual backyard gatherings or office lunches.',
            price: 35,
            minPax: 10,
            meatLimit: 2,
            sideLimit: 2,
            image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80",
          },
          {
            id: 'pkg_pitmaster',
            name: 'The Pitmaster',
            description: 'Our Crowd Favorite. A balanced spread of our best smokers cuts and sides.',
            price: 48,
            minPax: 10,
            meatLimit: 3,
            sideLimit: 3,
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
          },
          {
            id: 'pkg_wholehog',
            name: 'The Whole Hog',
            description: 'The ultimate BBQ experience. Full variety of meats, sides, and premium additions.',
            price: 65,
            minPax: 10,
            meatLimit: 4,
            sideLimit: 4,
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
          },
        ],
        emailSettings: {
          enabled: false,
          provider: 'smtp',
          fromEmail: 'noreply@bizos.app',
          fromName: 'BizOS',
          adminEmail: 'admin@bizos.app',
        },
        invoiceSettings: {
          paymentUrl: '',
          paymentLabel: 'Pay Now',
          headerColor: '#d9381e',
          accentColor: '#eab308',
          logoUrl: '',
          footerNote: 'Thank you for your business! If you have questions about this invoice, reply to this email or give us a call.',
          thankYouMessage: "Here's your invoice. Please review the details below and arrange payment at your earliest convenience.",
          bankDetails: '',
          smsTemplate: 'Hi {name}, you have an invoice for ${total} from {business}. Order #{orderNum}.{payLink}\n\nCheers!',
        },
      })).run();

    return json({ success: true, message: 'Database seeded with all data: 16 menu items, 2 events, 2 users, 1 cook day, 1 social post, full settings' });
  } catch (err: any) {
    const status = err.status || 500;
    return json({ error: err.message || 'Internal Server Error' }, status);
  }
};
