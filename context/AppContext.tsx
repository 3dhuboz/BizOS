
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User, MenuItem, Order, CookDay, UserRole, CartItem, SocialPost, AppSettings, CalendarEvent, GalleryPost } from '../types';
import { INITIAL_MENU, INITIAL_COOK_DAYS, INITIAL_ADMIN_USER, INITIAL_DEV_USER, INITIAL_SETTINGS, INITIAL_EVENTS } from '../constants';
import { setAiApiKey } from '../services/ai';
import { setDevApiKey } from '../services/api';
import { setPlatformDevKey } from '../services/platformApi';
import { getBusinessConfig, type BusinessConfig, type BusinessLabels } from '../utils/businessConfig';
import { useAuth, useUser } from '@clerk/react';
import {
  initApi,
  fetchMenu,
  upsertMenuItem as apiUpsertMenuItem,
  deleteMenuItem as apiDeleteMenuItem,
  fetchOrders,
  createOrder as apiCreateOrder,
  updateOrder as apiUpdateOrder,
  fetchEvents,
  upsertEvent,
  deleteEvent,
  fetchUsers,
  fetchCurrentUser,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  fetchSocialPosts,
  upsertSocialPost,
  deleteSocialPost as apiDeleteSocialPost,
  fetchGalleryPosts,
  submitGalleryPost,
  updateGalleryPost,
  toggleGalleryLike as apiToggleGalleryLike,
  fetchSettings,
  updateSettings as apiUpdateSettings,
  seedDatabase,
} from '../services/api';

interface AppContextType {
  user: User | null;
  users: User[];
  login: (role: UserRole, email?: string, password?: string, name?: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  addUser: (newUser: User) => void;
  updateUserProfile: (updatedUser: User) => void;
  adminUpdateUser: (updatedUser: User) => void;
  deleteUser: (userId: string) => void;

  menu: MenuItem[];
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;

  cookDays: CookDay[];
  addCookDay: (day: CookDay) => void;

  // Calendar & Events
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (event: CalendarEvent) => void;
  removeCalendarEvent: (eventId: string) => void;
  checkAvailability: (date: string) => boolean;
  isDatePastCutoff: (dateStr: string) => boolean;

  orders: Order[];
  createOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrder: (order: Order) => void;

  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, specificDate?: string) => void;
  updateCartItemQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  socialPosts: SocialPost[];
  addSocialPost: (post: SocialPost) => void;
  updateSocialPost: (post: SocialPost) => void;
  deleteSocialPost: (postId: string) => void;

  galleryPosts: GalleryPost[];
  addGalleryPost: (post: GalleryPost) => void;
  toggleGalleryLike: (postId: string) => Promise<void>;

  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;

  // Reminders
  reminders: string[];
  toggleReminder: (eventId: string) => void;

  // Rewards
  verifyStaffPin: (pin: string, action: 'ADD' | 'REDEEM') => boolean;

  // New State
  selectedOrderDate: string | null;
  setSelectedOrderDate: (date: string | null) => void;

  isLoading: boolean;
  connectionError: string | null;

  // Business config
  businessConfig: BusinessConfig;
  getLabel: (key: keyof BusinessLabels) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!CLERK_KEY;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const BUILD_VERSION = '2026.03.20b';
  console.log(`[BizOS] Build ${BUILD_VERSION} — Clerk + D1 backend`);

  const clerkAuth = useAuth();
  const clerkUserHook = useUser();

  // When Clerk is not configured, treat auth as loaded immediately
  const authLoaded = hasClerk ? clerkAuth.isLoaded : true;
  const userLoaded = hasClerk ? clerkUserHook.isLoaded : true;
  const userId = hasClerk ? clerkAuth.userId : null;
  const clerkUser = hasClerk ? clerkUserHook.user : null;
  const getToken = hasClerk ? clerkAuth.getToken : (async () => null);
  const clerkSignOut = hasClerk ? clerkAuth.signOut : (async () => {});

  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [menu, setMenu] = useState<MenuItem[]>([]);

  const [cookDays, setCookDays] = useState<CookDay[]>([]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([]);

  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Local States
  const [cart, setCart] = useState<CartItem[]>(() => {
      const saved = localStorage.getItem('sm_cart');
      return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<string[]>([]);

  const [selectedOrderDate, setSelectedOrderDate] = useState<string | null>(() => {
      return localStorage.getItem('sm_selected_date');
  });

  // --- LOCAL PERSISTENCE EFFECTS ---
  useEffect(() => {
      try {
        localStorage.setItem('sm_cart', JSON.stringify(cart));
      } catch (e) { console.error("LS Error", e); }
  }, [cart]);

  useEffect(() => {
      try {
        if (selectedOrderDate) localStorage.setItem('sm_selected_date', selectedOrderDate);
        else localStorage.removeItem('sm_selected_date');
      } catch (e) { console.error("LS Error", e); }
  }, [selectedOrderDate]);

  // --- INIT API WITH CLERK TOKEN ---
  useEffect(() => {
    initApi(() => getToken());
  }, [getToken]);

  // --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    if (!authLoaded) return;

    const loadData = async () => {
      const loaded = new Set<string>();
      const REQUIRED = ['Menu', 'Orders', 'Settings'];
      const markLoaded = (source: string) => {
        loaded.add(source);
        if (REQUIRED.every(s => loaded.has(s))) {
          setIsLoading(false);
        }
      };

      // Timeout fallback
      const fallbackTimer = setTimeout(() => setIsLoading(false), 5000);

      try {
        // Load all data in parallel
        const [menuData, settingsData, ordersData, eventsData, socialData, galleryData] = await Promise.allSettled([
          fetchMenu(),
          fetchSettings(),
          fetchOrders().catch(() => []),
          fetchEvents().catch(() => []),
          fetchSocialPosts().catch(() => []),
          fetchGalleryPosts().catch(() => []),
        ]);

        // Menu
        if (menuData.status === 'fulfilled' && menuData.value.length > 0) {
          setMenu(menuData.value);
        } else {
          setMenu(INITIAL_MENU);
        }
        markLoaded('Menu');

        // Settings
        if (settingsData.status === 'fulfilled') {
          const s = settingsData.value;
          const aiKey = (s as any).openrouterApiKey || (s as any).geminiApiKey;
          if (aiKey) setAiApiKey(aiKey);
          setSettings(prev => ({ ...prev, ...s } as AppSettings));
        }
        markLoaded('Settings');

        // Orders
        if (ordersData.status === 'fulfilled' && ordersData.value.length > 0) {
          setOrders(ordersData.value);
        }
        markLoaded('Orders');

        // Events
        if (eventsData.status === 'fulfilled' && eventsData.value.length > 0) {
          setCalendarEvents(eventsData.value);
        } else {
          setCalendarEvents(INITIAL_EVENTS);
        }

        // Social Posts
        if (socialData.status === 'fulfilled' && socialData.value.length > 0) {
          setSocialPosts(socialData.value);
        }

        // Gallery
        if (galleryData.status === 'fulfilled' && galleryData.value.length > 0) {
          setGalleryPosts(galleryData.value);
        }

        setConnectionError(null);
      } catch (err: any) {
        console.error('[Data Load] Error:', err);
        setConnectionError('Failed to load data. Please check your connection.');
        setIsLoading(false);
      }

      clearTimeout(fallbackTimer);
    };

    loadData();
  }, [authLoaded]);

  // --- CLERK AUTH STATE -> USER PROFILE ---
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (userId && clerkUser) {
      // Fetch user profile from D1
      fetchCurrentUser().then(profile => {
        setUser(profile);
      }).catch(err => {
        console.warn('[Auth] Profile fetch failed:', err);
        // Create a basic user from Clerk data
        setUser({
          id: userId,
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: (clerkUser.publicMetadata?.role as UserRole) || UserRole.CUSTOMER,
          isVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified',
          stamps: 0,
        });
      });

      // Load admin data if user is admin
      if (clerkUser.publicMetadata?.role === 'ADMIN' || clerkUser.publicMetadata?.role === 'DEV') {
        fetchUsers().then(data => setUsers(data)).catch(() => {});
      }
    } else if (!userId) {
      // Check if we have a local admin user (backdoor login)
      setUser(prev => {
        if (prev && (prev.id === 'admin1' || prev.id === 'dev1')) return prev;
        return null;
      });
    }
  }, [userId, clerkUser, authLoaded, userLoaded]);

  // --- ACTIONS ---

  const login = async (role: UserRole, email?: string, password?: string, name?: string, rememberMe: boolean = true) => {
    try {
        if (role === UserRole.ADMIN) {
            // Dev backdoor — hardcoded, not in database
            if (email === 'dev' && password === '123') {
                setUser(INITIAL_DEV_USER);
                // Set dev API key so backend accepts requests without Clerk JWT
                const key = (settings as any).devApiKey || import.meta.env.VITE_DEV_API_KEY || 'bizos-dev-key';
                setDevApiKey(key);
                setPlatformDevKey(key);
                return;
            }
            if (email === settings.adminUsername && password === settings.adminPassword) {
                setUser(INITIAL_ADMIN_USER);
                return;
            }
            throw new Error('Invalid admin credentials');
        }
        // For customer auth, Clerk handles sign-in/sign-up via its components
        // This path is kept for compatibility but Clerk's useSignIn/useSignUp should be preferred
        throw new Error('Please use the sign-in form to log in.');
    } catch (e) {
        console.error("Auth Error", e);
        throw e;
    }
  };

  const logout = async () => {
    // Check if using Clerk auth or local admin backdoor
    if (user?.id === 'admin1' || user?.id === 'dev1') {
      setUser(null);
    } else {
      await clerkSignOut();
      setUser(null);
    }
  };

  const addUser = async (newUser: User) => {
    const created = await apiCreateUser(newUser);
    setUsers(prev => [...prev, created]);
  };

  const updateUserProfile = async (updatedUser: User) => {
    await apiUpdateUser(updatedUser.id, updatedUser);
    if (user?.id === updatedUser.id) setUser(updatedUser);
  };

  const adminUpdateUser = async (updatedUser: User) => {
    await apiUpdateUser(updatedUser.id, updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const deleteUser = async (userId: string) => {
    await apiDeleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const addMenuItem = async (item: MenuItem) => {
    await apiUpsertMenuItem(item);
    setMenu(prev => [...prev.filter(m => m.id !== item.id), item]);
  };

  const updateMenuItem = async (item: MenuItem) => {
    await apiUpsertMenuItem(item);
    setMenu(prev => prev.map(m => m.id === item.id ? item : m));
  };

  const deleteMenuItem = async (itemId: string) => {
    await apiDeleteMenuItem(itemId);
    setMenu(prev => prev.filter(m => m.id !== itemId));
  };

  const addCalendarEvent = async (event: CalendarEvent) => {
    await upsertEvent(event);
    setCalendarEvents(prev => [...prev.filter(e => e.id !== event.id), event]);
  };

  const updateCalendarEvent = async (event: CalendarEvent) => {
    await upsertEvent(event);
    setCalendarEvents(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const removeCalendarEvent = async (eventId: string) => {
    await deleteEvent(eventId);
    setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // STRICT CUTOFF LOGIC: 9AM Morning PRIOR to cook date
  const isDatePastCutoff = (dateStr: string): boolean => {
      const cookDate = new Date(dateStr);
      const cutoffDate = new Date(cookDate);
      cutoffDate.setDate(cookDate.getDate() - 1);
      cutoffDate.setHours(9, 0, 0, 0);
      const now = new Date();
      return now > cutoffDate;
  };

  const checkAvailability = (dateStr: string): boolean => {
    if (isDatePastCutoff(dateStr)) return false;
    const blocked = calendarEvents.find(e => e.date === dateStr && e.type === 'BLOCKED');
    if (blocked) return false;
    const ordersOnDay = orders.filter(o => o.cookDay === dateStr && o.type === 'CATERING');
    if (ordersOnDay.length >= 2) return false;
    return true;
  };

  const createOrder = async (order: Order) => {
    await apiCreateOrder(order);
    setOrders(prev => [order, ...prev]);

    if (order.discountApplied && user && user.hasCateringDiscount) {
        const updatedUser = { ...user, hasCateringDiscount: false };
        setUser(updatedUser);
        await updateUserProfile(updatedUser);
    }

    clearCart();
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await apiUpdateOrder(orderId, { status });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    if (status === 'Confirmed') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.type === 'CATERING') {
             const dateStr = new Date(order.cookDay).toISOString().split('T')[0];
             const newEvent: CalendarEvent = {
              id: `evt_o_${order.id}`,
              date: dateStr,
              type: 'ORDER_PICKUP',
              title: `Pickup: ${order.customerName}`,
              orderId: order.id
            };
            await upsertEvent(newEvent);
            setCalendarEvents(prev => [...prev.filter(e => e.id !== newEvent.id), newEvent]);
        }
    }
  };

  const updateOrder = async (updatedOrder: Order) => {
    await apiUpdateOrder(updatedOrder.id, updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const addToCart = (item: MenuItem, quantity: number = 1, specificDate?: string) => {
    if (specificDate && selectedOrderDate && selectedOrderDate !== specificDate) {
        if (!window.confirm(`Your cart contains items for ${new Date(selectedOrderDate).toLocaleDateString()}. Clear cart to add items for ${new Date(specificDate).toLocaleDateString()}?`)) {
            return;
        }
        setCart([]);
        setSelectedOrderDate(specificDate);
    }

    if (!selectedOrderDate && specificDate) {
        setSelectedOrderDate(specificDate);
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...item, quantity: quantity }];
    });
  };

  const updateCartItemQuantity = (itemId: string, delta: number) => {
      setCart(prev => {
          return prev.map(item => {
              if (item.id === itemId) {
                  return { ...item, quantity: Math.max(0, item.quantity + delta) };
              }
              return item;
          }).filter(i => i.quantity > 0);
      });
  };

  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(i => i.id !== itemId));
  const clearCart = () => setCart([]);

  const addSocialPost = async (post: SocialPost) => {
    await upsertSocialPost(post);
    setSocialPosts(prev => [post, ...prev]);
  };

  const updateSocialPost = async (post: SocialPost) => {
    await upsertSocialPost(post);
    setSocialPosts(prev => prev.map(p => p.id === post.id ? post : p));
  };

  const deleteSocialPost = async (postId: string) => {
    await apiDeleteSocialPost(postId);
    setSocialPosts(prev => prev.filter(p => p.id !== postId));
  };

  const addGalleryPost = async (post: GalleryPost) => {
    await submitGalleryPost(post);
    setGalleryPosts(prev => [post, ...prev]);
  };

  const toggleGalleryLike = async (postId: string) => {
    if (!user) return;
    const updated = await apiToggleGalleryLike(postId);
    setGalleryPosts(prev => prev.map(p => p.id === postId ? updated : p));
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    try {
        const result = await apiUpdateSettings(newSettings);
        // Set AI key if it was updated
        const aiKey = (newSettings as any).openrouterApiKey || (newSettings as any).geminiApiKey;
        if (aiKey) setAiApiKey(aiKey);
        console.log('[Settings] Saved via API');
        return true;
    } catch (err: any) {
        console.error('[Settings] API write failed:', err.message);
        return false;
    }
  };

  const addCookDay = (day: CookDay) => setCookDays(prev => [...prev, day]);

  const toggleReminder = (eventId: string) => {
      let newReminders;
      if (reminders.includes(eventId)) newReminders = reminders.filter(id => id !== eventId);
      else newReminders = [...reminders, eventId];
      setReminders(newReminders);
  };

  // ─── BUSINESS CONFIG ───
  const businessConfig = useMemo(() => {
    const base = getBusinessConfig(settings.businessType);
    // Allow settings to override individual labels and features
    return {
      ...base,
      labels: { ...base.labels, ...(settings.businessLabels || {}) },
      features: { ...base.features, ...(settings.businessFeatures || {}) },
      aiPersona: settings.aiPersona || base.aiPersona,
    };
  }, [settings.businessType, settings.businessLabels, settings.businessFeatures, settings.aiPersona]);

  const getLabel = useCallback((key: keyof BusinessLabels): string => {
    return businessConfig.labels[key] || key;
  }, [businessConfig]);

  const verifyStaffPin = (pin: string, action: 'ADD' | 'REDEEM'): boolean => {
      if (pin !== settings.rewards.staffPin) return false;
      if (user) {
          const currentStamps = user.stamps || 0;
          let newStamps = currentStamps;
          if (action === 'ADD') newStamps = currentStamps + 1;
          else if (action === 'REDEEM') newStamps = Math.max(0, currentStamps - settings.rewards.maxStamps);

          const updatedUser = { ...user, stamps: newStamps };
          setUser(updatedUser);
          updateUserProfile(updatedUser);
      }
      return true;
  };

  return (
    <AppContext.Provider value={{
      user, users, login, logout, addUser, updateUserProfile, adminUpdateUser, deleteUser,
      menu, addMenuItem, updateMenuItem, deleteMenuItem,
      cookDays, addCookDay,
      calendarEvents, addCalendarEvent, updateCalendarEvent, removeCalendarEvent, checkAvailability, isDatePastCutoff,
      orders, createOrder, updateOrderStatus, updateOrder,
      cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart,
      socialPosts, addSocialPost, updateSocialPost, deleteSocialPost,
      galleryPosts, addGalleryPost, toggleGalleryLike,
      settings, updateSettings,
      reminders, toggleReminder,
      verifyStaffPin,
      selectedOrderDate, setSelectedOrderDate,
      isLoading,
      connectionError,
      businessConfig,
      getLabel,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
