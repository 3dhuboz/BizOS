import { verifyAuth, requireAuth } from '../_lib/auth';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'DEV');

    if (request.method === 'GET') {
      return json({
        templates: [
          {
            type: 'food_truck',
            label: 'Food Truck',
            description: 'Mobile food service, pop-ups, street food',
            icon: 'Truck',
            examples: 'BBQ truck, taco stand, coffee van',
            labels: {
              items: 'Menu', itemSingular: 'Dish', booking: 'Order', bookings: 'Orders',
              availability: 'Cook Days', customer: 'Customer', customers: 'Customers',
              package: 'Catering Package', packages: 'Catering Packages',
              specialist: 'Pitmaster', planner: 'Planner', gallery: 'Gallery',
              tagline: 'Low & Slow BBQ',
            },
            features: {
              menuBrowsing: true, onlineOrdering: true, catering: true,
              bookingPortal: true, gallery: true, rewards: true, aiChat: true,
              socialMedia: true, tracking: true, contracts: true, pitmaster: true,
              events: true, promoters: true,
            },
            categories: ['Burgers', 'Meats', 'Sides', 'Platters', 'Drinks', 'Bulk Meats', 'Catering Packs', 'Trays', 'Hot Sides', 'Cold Sides', 'Bakery', 'Family Packs', 'Rubs & Sauces', 'Merch', 'Salads'],
          },
          {
            type: 'restaurant',
            label: 'Restaurant',
            description: 'Dine-in, takeaway, reservations',
            icon: 'UtensilsCrossed',
            examples: 'Cafe, bistro, fine dining',
            labels: {
              items: 'Menu', itemSingular: 'Dish', booking: 'Reservation', bookings: 'Reservations',
              availability: 'Open Hours', customer: 'Guest', customers: 'Guests',
              package: 'Set Menu', packages: 'Set Menus',
              specialist: 'Chef', planner: 'Schedule', gallery: 'Gallery',
              tagline: 'Fine Dining',
            },
            features: {
              menuBrowsing: true, onlineOrdering: true, catering: true,
              bookingPortal: true, gallery: true, rewards: true, aiChat: true,
              socialMedia: true, tracking: false, contracts: false, pitmaster: false,
              events: true, promoters: false,
            },
            categories: ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Set Menus', 'Kids Menu', 'Specials'],
          },
          {
            type: 'catering',
            label: 'Catering',
            description: 'Event catering, corporate functions, weddings',
            icon: 'ChefHat',
            examples: 'Wedding caterer, corporate catering',
            labels: {
              items: 'Menu', itemSingular: 'Dish', booking: 'Booking', bookings: 'Bookings',
              availability: 'Availability', customer: 'Client', customers: 'Clients',
              package: 'Catering Package', packages: 'Catering Packages',
              specialist: 'Event Manager', planner: 'Planner', gallery: 'Portfolio',
              tagline: 'Premium Event Catering',
            },
            features: {
              menuBrowsing: true, onlineOrdering: false, catering: true,
              bookingPortal: true, gallery: true, rewards: false, aiChat: true,
              socialMedia: true, tracking: false, contracts: true, pitmaster: false,
              events: true, promoters: true,
            },
            categories: ['Canapes', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Platters', 'Buffet Items', 'Service'],
          },
          {
            type: 'trades',
            label: 'Trades',
            description: 'Plumbing, electrical, building, HVAC',
            icon: 'Wrench',
            examples: 'Plumber, electrician, builder',
            labels: {
              items: 'Services', itemSingular: 'Service', booking: 'Job', bookings: 'Jobs',
              availability: 'Availability', customer: 'Client', customers: 'Clients',
              package: 'Service Package', packages: 'Service Packages',
              specialist: 'Technician', planner: 'Schedule', gallery: 'Portfolio',
              tagline: 'Professional Trade Services',
            },
            features: {
              menuBrowsing: true, onlineOrdering: false, catering: false,
              bookingPortal: true, gallery: true, rewards: false, aiChat: true,
              socialMedia: true, tracking: false, contracts: true, pitmaster: false,
              events: false, promoters: true,
            },
            categories: ['Emergency', 'Repairs', 'Installation', 'Maintenance', 'Inspection', 'Consultation'],
          },
          {
            type: 'salon',
            label: 'Salon & Spa',
            description: 'Hair, beauty, nails, massage',
            icon: 'Scissors',
            examples: 'Hair salon, nail bar, day spa',
            labels: {
              items: 'Treatments', itemSingular: 'Treatment', booking: 'Appointment', bookings: 'Appointments',
              availability: 'Schedule', customer: 'Client', customers: 'Clients',
              package: 'Treatment Package', packages: 'Treatment Packages',
              specialist: 'Stylist', planner: 'Schedule', gallery: 'Portfolio',
              tagline: 'Beauty & Wellness',
            },
            features: {
              menuBrowsing: true, onlineOrdering: false, catering: false,
              bookingPortal: true, gallery: true, rewards: true, aiChat: true,
              socialMedia: true, tracking: false, contracts: false, pitmaster: false,
              events: false, promoters: false,
            },
            categories: ['Haircuts', 'Colour', 'Styling', 'Nails', 'Facials', 'Waxing', 'Massage', 'Packages'],
          },
          {
            type: 'fitness',
            label: 'Fitness',
            description: 'Gym, personal training, yoga studio',
            icon: 'Dumbbell',
            examples: 'PT studio, yoga, CrossFit',
            labels: {
              items: 'Classes', itemSingular: 'Class', booking: 'Session', bookings: 'Sessions',
              availability: 'Timetable', customer: 'Member', customers: 'Members',
              package: 'Membership', packages: 'Memberships',
              specialist: 'Trainer', planner: 'Timetable', gallery: 'Gallery',
              tagline: 'Fitness & Wellness',
            },
            features: {
              menuBrowsing: true, onlineOrdering: false, catering: false,
              bookingPortal: true, gallery: true, rewards: true, aiChat: true,
              socialMedia: true, tracking: false, contracts: false, pitmaster: false,
              events: true, promoters: false,
            },
            categories: ['Group Classes', 'Personal Training', 'Yoga', 'Pilates', 'HIIT', 'Boxing', 'Recovery', 'Packages'],
          },
          {
            type: 'retail',
            label: 'Retail',
            description: 'Online store, products, merchandise',
            icon: 'ShoppingBag',
            examples: 'Boutique, online shop, merch',
            labels: {
              items: 'Products', itemSingular: 'Product', booking: 'Order', bookings: 'Orders',
              availability: 'Stock', customer: 'Customer', customers: 'Customers',
              package: 'Bundle', packages: 'Bundles',
              specialist: 'Expert', planner: 'Inventory', gallery: 'Showcase',
              tagline: 'Quality Products',
            },
            features: {
              menuBrowsing: true, onlineOrdering: true, catering: false,
              bookingPortal: false, gallery: true, rewards: true, aiChat: true,
              socialMedia: true, tracking: true, contracts: false, pitmaster: false,
              events: false, promoters: false,
            },
            categories: ['New Arrivals', 'Best Sellers', 'Sale', 'Accessories', 'Gifts', 'Essentials'],
          },
          {
            type: 'services',
            label: 'Services',
            description: 'Consulting, cleaning, photography',
            icon: 'Briefcase',
            examples: 'Cleaner, photographer, tutor',
            labels: {
              items: 'Services', itemSingular: 'Service', booking: 'Booking', bookings: 'Bookings',
              availability: 'Availability', customer: 'Client', customers: 'Clients',
              package: 'Service Package', packages: 'Service Packages',
              specialist: 'Consultant', planner: 'Schedule', gallery: 'Portfolio',
              tagline: 'Professional Services',
            },
            features: {
              menuBrowsing: true, onlineOrdering: false, catering: false,
              bookingPortal: true, gallery: true, rewards: false, aiChat: true,
              socialMedia: true, tracking: false, contracts: true, pitmaster: false,
              events: false, promoters: true,
            },
            categories: ['Consultation', 'Standard Service', 'Premium Service', 'Emergency', 'Maintenance', 'Custom'],
          },
          {
            type: 'custom',
            label: 'Custom',
            description: 'Configure everything yourself',
            icon: 'Settings',
            examples: 'Anything else',
            labels: {
              items: 'Items', itemSingular: 'Item', booking: 'Booking', bookings: 'Bookings',
              availability: 'Availability', customer: 'Customer', customers: 'Customers',
              package: 'Package', packages: 'Packages',
              specialist: 'Specialist', planner: 'Planner', gallery: 'Gallery',
              tagline: 'Your Business',
            },
            features: {
              menuBrowsing: true, onlineOrdering: true, catering: true,
              bookingPortal: true, gallery: true, rewards: true, aiChat: true,
              socialMedia: true, tracking: true, contracts: true, pitmaster: false,
              events: true, promoters: true,
            },
            categories: ['Category 1', 'Category 2', 'Category 3'],
          },
        ],
      });
    }

    if (request.method === 'PUT') {
      return json({ error: 'Template editing not yet implemented' }, 501);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message }, err.status || 500);
  }
};
