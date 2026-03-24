/**
 * Business configuration system.
 * Drives labels, feature flags, and AI persona based on business type.
 * Makes the platform work for any business — food trucks, salons, trades, retail, etc.
 */

export type BusinessType =
  | 'food_truck' | 'restaurant' | 'catering'
  | 'trades' | 'salon' | 'fitness'
  | 'retail' | 'services' | 'custom';

export interface BusinessLabels {
  items: string;        // "Menu" | "Services" | "Treatments" | "Products"
  itemSingular: string; // "Dish" | "Service" | "Treatment" | "Product"
  booking: string;      // "Order" | "Appointment" | "Booking" | "Job"
  bookings: string;     // "Orders" | "Appointments" | "Bookings" | "Jobs"
  availability: string; // "Cook Days" | "Availability" | "Schedule"
  customer: string;     // "Customer" | "Client" | "Patient" | "Member"
  customers: string;    // "Customers" | "Clients" | "Patients" | "Members"
  package: string;      // "Catering Package" | "Service Bundle" | "Package"
  packages: string;     // "Catering Packages" | "Service Bundles" | "Packages"
  specialist: string;   // "Pitmaster" | "Stylist" | "Technician" | "Trainer"
  planner: string;      // "Planner" | "Schedule" | "Calendar"
  gallery: string;      // "Gallery" | "Portfolio" | "Showcase"
  tagline: string;      // "Low & Slow BBQ" | "Your Local Pro" etc.
}

export interface BusinessFeatures {
  menuBrowsing: boolean;
  onlineOrdering: boolean;
  catering: boolean;
  bookingPortal: boolean;
  gallery: boolean;
  rewards: boolean;
  aiChat: boolean;
  socialMedia: boolean;
  tracking: boolean;
  contracts: boolean;
  pitmaster: boolean;    // Cooking-specific features (temp logs, meat math)
  events: boolean;       // Public events calendar
  promoters: boolean;    // Promoters/marketing page
}

export interface AiPersona {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
}

export interface BusinessConfig {
  type: BusinessType;
  labels: BusinessLabels;
  features: BusinessFeatures;
  aiPersona: AiPersona;
  categories: string[];  // Default item categories for this business type
}

// ─── Preset Configurations ───────────────────────────────────

const FOOD_TRUCK_CONFIG: BusinessConfig = {
  type: 'food_truck',
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
  aiPersona: {
    name: 'Pitmaster Jay',
    role: 'Head Pitmaster & owner',
    personality: 'Friendly Australian BBQ expert. Uses Aussie slang. Passionate about Low & Slow cooking.',
    expertise: ['BBQ techniques', 'Meat preparation', 'Smoking', 'Temperature control', 'Australian BBQ culture'],
  },
  categories: ['Burgers', 'Meats', 'Sides', 'Platters', 'Drinks', 'Bulk Meats', 'Catering Packs', 'Trays', 'Hot Sides', 'Cold Sides', 'Bakery', 'Family Packs', 'Rubs & Sauces', 'Merch', 'Salads'],
};

const RESTAURANT_CONFIG: BusinessConfig = {
  type: 'restaurant',
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
  aiPersona: {
    name: 'Chef AI',
    role: 'Head Chef & restaurant guide',
    personality: 'Knowledgeable, warm, passionate about food and hospitality.',
    expertise: ['Menu recommendations', 'Wine pairing', 'Dietary accommodations', 'Special occasions'],
  },
  categories: ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Set Menus', 'Kids Menu', 'Specials'],
};

const CATERING_CONFIG: BusinessConfig = {
  type: 'catering',
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
  aiPersona: {
    name: 'Event AI',
    role: 'Event planning assistant',
    personality: 'Professional, organized, detail-oriented. Helps plan perfect events.',
    expertise: ['Event planning', 'Menu selection', 'Dietary requirements', 'Logistics', 'Pricing'],
  },
  categories: ['Canapes', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Platters', 'Buffet Items', 'Service'],
};

const TRADES_CONFIG: BusinessConfig = {
  type: 'trades',
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
  aiPersona: {
    name: 'Trade AI',
    role: 'Service booking assistant',
    personality: 'Helpful, straightforward, knowledgeable about common trade issues.',
    expertise: ['Service scheduling', 'Quote estimation', 'Common problems', 'Availability checking'],
  },
  categories: ['Emergency', 'Repairs', 'Installation', 'Maintenance', 'Inspection', 'Consultation'],
};

const SALON_CONFIG: BusinessConfig = {
  type: 'salon',
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
  aiPersona: {
    name: 'Style AI',
    role: 'Beauty consultant & booking assistant',
    personality: 'Warm, trendy, knowledgeable about beauty and self-care.',
    expertise: ['Treatment recommendations', 'Skincare advice', 'Booking help', 'Product suggestions'],
  },
  categories: ['Haircuts', 'Colour', 'Styling', 'Nails', 'Facials', 'Waxing', 'Massage', 'Packages'],
};

const FITNESS_CONFIG: BusinessConfig = {
  type: 'fitness',
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
  aiPersona: {
    name: 'Coach AI',
    role: 'Fitness coach & booking assistant',
    personality: 'Motivating, energetic, supportive. Helps people reach their fitness goals.',
    expertise: ['Workout recommendations', 'Class selection', 'Nutrition basics', 'Scheduling'],
  },
  categories: ['Group Classes', 'Personal Training', 'Yoga', 'Pilates', 'HIIT', 'Boxing', 'Recovery', 'Packages'],
};

const RETAIL_CONFIG: BusinessConfig = {
  type: 'retail',
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
  aiPersona: {
    name: 'Shop AI',
    role: 'Product specialist & shopping assistant',
    personality: 'Helpful, knowledgeable about products, great at recommendations.',
    expertise: ['Product recommendations', 'Size/fit advice', 'Order tracking', 'Gift suggestions'],
  },
  categories: ['New Arrivals', 'Best Sellers', 'Sale', 'Accessories', 'Gifts', 'Essentials'],
};

const SERVICES_CONFIG: BusinessConfig = {
  type: 'services',
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
  aiPersona: {
    name: 'Service AI',
    role: 'Booking assistant & service advisor',
    personality: 'Professional, efficient, solution-oriented.',
    expertise: ['Service selection', 'Quote estimation', 'Scheduling', 'FAQ answers'],
  },
  categories: ['Consultation', 'Standard Service', 'Premium Service', 'Emergency', 'Maintenance', 'Custom'],
};

const CUSTOM_CONFIG: BusinessConfig = {
  type: 'custom',
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
  aiPersona: {
    name: 'Business AI',
    role: 'Business assistant',
    personality: 'Helpful, professional, adaptable to any business context.',
    expertise: ['Booking', 'Pricing', 'Availability', 'General inquiries'],
  },
  categories: ['Category 1', 'Category 2', 'Category 3'],
};

// ─── Preset Map ──────────────────────────────────────────────

export const BUSINESS_PRESETS: Record<BusinessType, BusinessConfig> = {
  food_truck: FOOD_TRUCK_CONFIG,
  restaurant: RESTAURANT_CONFIG,
  catering: CATERING_CONFIG,
  trades: TRADES_CONFIG,
  salon: SALON_CONFIG,
  fitness: FITNESS_CONFIG,
  retail: RETAIL_CONFIG,
  services: SERVICES_CONFIG,
  custom: CUSTOM_CONFIG,
};

// ─── Helper to get config from settings ──────────────────────

export function getBusinessConfig(type?: BusinessType): BusinessConfig {
  return BUSINESS_PRESETS[type || 'food_truck'];
}

// ─── Display info for the setup wizard ───────────────────────

export interface BusinessTypeOption {
  type: BusinessType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  examples: string;
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { type: 'food_truck', label: 'Food Truck', description: 'Mobile food service, pop-ups, street food', icon: 'Truck', examples: 'BBQ truck, taco stand, coffee van' },
  { type: 'restaurant', label: 'Restaurant', description: 'Dine-in, takeaway, reservations', icon: 'UtensilsCrossed', examples: 'Cafe, bistro, fine dining' },
  { type: 'catering', label: 'Catering', description: 'Event catering, corporate functions, weddings', icon: 'ChefHat', examples: 'Wedding caterer, corporate catering' },
  { type: 'trades', label: 'Trades', description: 'Plumbing, electrical, building, HVAC', icon: 'Wrench', examples: 'Plumber, electrician, builder' },
  { type: 'salon', label: 'Salon & Spa', description: 'Hair, beauty, nails, massage', icon: 'Scissors', examples: 'Hair salon, nail bar, day spa' },
  { type: 'fitness', label: 'Fitness', description: 'Gym, personal training, yoga studio', icon: 'Dumbbell', examples: 'PT studio, yoga, CrossFit' },
  { type: 'retail', label: 'Retail', description: 'Online store, products, merchandise', icon: 'ShoppingBag', examples: 'Boutique, online shop, merch' },
  { type: 'services', label: 'Services', description: 'Consulting, cleaning, photography', icon: 'Briefcase', examples: 'Cleaner, photographer, tutor' },
  { type: 'custom', label: 'Custom', description: 'Configure everything yourself', icon: 'Settings', examples: 'Anything else' },
];
