// ============================================================
// ClientPulse - Core Types
// ============================================================

export type ClientType = 'rental' | 'buyer' | 'seller' | 'investor' | 'multi';
export type ClientStatus = 'active' | 'past_client' | 'lead' | 'inactive';
export type ContactMethod = 'email' | 'phone' | 'text' | 'any';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type LifecycleStage =
  | 'new_lead'
  | 'active_search'
  | 'hot_decision'
  | 'under_contract'
  | 'active_client'
  | 'renewal_window'
  | 'past_client';

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  new_lead: 'New Lead',
  active_search: 'Active Search',
  hot_decision: 'Hot / Decision',
  under_contract: 'Under Contract',
  active_client: 'Active Client',
  renewal_window: 'Renewal Window',
  past_client: 'Past Client',
};

export const LIFECYCLE_COLORS: Record<LifecycleStage, string> = {
  new_lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  active_search: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  hot_decision: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  under_contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  active_client: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  renewal_window: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  past_client: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
};

export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'apartment'
  | 'duplex'
  | 'triplex'
  | 'fourplex'
  | 'multi_family';

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: 'Single Family',
  condo: 'Condo',
  townhouse: 'Townhouse',
  apartment: 'Apartment',
  duplex: 'Duplex',
  triplex: 'Triplex',
  fourplex: 'Fourplex',
  multi_family: 'Multi-Family',
};

export type Amenity =
  | 'pool'
  | 'washer_dryer'
  | 'garage'
  | 'pet_friendly'
  | 'furnished'
  | 'fenced_yard'
  | 'waterfront'
  | 'new_construction'
  | 'gated_community'
  | 'central_ac'
  | 'fireplace'
  | 'dock';

export const AMENITY_LABELS: Record<Amenity, string> = {
  pool: 'Pool',
  washer_dryer: 'W/D',
  garage: 'Garage',
  pet_friendly: 'Pet-Friendly',
  furnished: 'Furnished',
  fenced_yard: 'Fenced Yard',
  waterfront: 'Waterfront',
  new_construction: 'New Construction',
  gated_community: 'Gated',
  central_ac: 'Central A/C',
  fireplace: 'Fireplace',
  dock: 'Dock',
};

// ---- Client Profile ----

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: ContactMethod;
  clientType: ClientType;
  status: ClientStatus;
  lifecycleStage: LifecycleStage;
  source: string;
  assignedAgent: string;
  notes: string;
  createdAt: string;
  lastContact: string;
  avatarUrl?: string;
}

export interface RentalPreferences {
  budgetMin: number;
  budgetMax: number;
  bedrooms: number;
  bathrooms: number;
  sqftMin: number;
  preferredAreas: string[];
  propertyTypes: PropertyType[];
  mustHaveAmenities: Amenity[];
  pets: string;
  moveInTimeline: string;
  leaseTermPref: string;
  currentLeaseExpiration?: string;
  currentAddress: string;
}

export interface BuyerPreferences {
  budgetMin: number;
  budgetMax: number;
  bedrooms: number;
  bathrooms: number;
  sqftMin: number;
  preferredAreas: string[];
  propertyTypes: PropertyType[];
  mustHaveFeatures: Amenity[];
  preApproved: boolean;
  preApprovalAmount?: number;
  lenderContact: string;
  downPayment: string;
  timeline: string;
  investmentIntent: boolean;
}

export interface ClientPreferences {
  clientId: string;
  rental?: RentalPreferences;
  buyer?: BuyerPreferences;
}

// ---- Activity ----

export type ActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'text'
  | 'showing'
  | 'listing_viewed'
  | 'comp_report'
  | 'offer'
  | 'lease_signed'
  | 'purchase_closed'
  | 'follow_up'
  | 'system';

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  note: '📝',
  call: '📞',
  email: '✉️',
  text: '💬',
  showing: '🏠',
  listing_viewed: '👁️',
  comp_report: '📊',
  offer: '📋',
  lease_signed: '✍️',
  purchase_closed: '🎉',
  follow_up: '🔔',
  system: '⚙️',
};

export interface Activity {
  id: string;
  clientId: string;
  type: ActivityType;
  title: string;
  description: string;
  propertyId?: string;
  propertyAddress?: string;
  timestamp: string;
  agentName: string;
}

// ---- Transactions ----

export interface Transaction {
  id: string;
  clientId: string;
  propertyId: string;
  propertyAddress: string;
  type: 'lease' | 'sale';
  date: string;
  amount: number;
  leaseEndDate?: string;
  notes: string;
}

// ---- Property Match ----

export interface PropertyMatch {
  id: string;
  clientId: string;
  clientName: string;
  listingId: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: PropertyType;
  matchScore: number;
  matchReasons: string[];
  status: 'new' | 'sent' | 'dismissed' | 'interested';
  foundAt: string;
  mlsNumber?: string;
  photoUrl?: string;
}

// ---- AI Profile ----

export interface AIProfile {
  clientId: string;
  summary: string;
  nextActions: NextAction[];
  updatedAt: string;
}

export interface NextAction {
  id: string;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  category: 'outreach' | 'follow_up' | 'match' | 'admin' | 'renewal';
  dueDate?: string;
  completed: boolean;
}

// ---- Triggers ----

export type TriggerType =
  | 'lease_expiration'
  | 'new_client_followup'
  | 'post_showing'
  | 'move_in_checkin'
  | 'quarterly_touchbase'
  | 'annual_review'
  | 'stale_lead'
  | 'new_listing_match'
  | 'price_change';

export interface Trigger {
  id: string;
  clientId: string;
  clientName: string;
  type: TriggerType;
  title: string;
  description: string;
  fireDate: string;
  status: 'pending' | 'fired' | 'completed' | 'dismissed';
  messageDraft?: string;
  urgency: UrgencyLevel;
}

// ---- Dashboard Stats ----

export interface DashboardStats {
  totalActiveClients: number;
  pendingFollowUps: number;
  leaseExpirationsThisMonth: number;
  newListingsToday: number;
  matchesPending: number;
  leadsThisWeek: number;
  conversionRate: number;
  avgResponseTime: string;
}

// ---- Intake Form ----

export interface ClientIntakeData {
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: ContactMethod;
  source: string;
  // Type
  clientType: ClientType;
  // Preferences (dynamic based on type)
  rentalPrefs?: Partial<RentalPreferences>;
  buyerPrefs?: Partial<BuyerPreferences>;
  // Situation
  currentAddress: string;
  currentLeaseExpiration?: string;
  reasonForMoving: string;
  urgency: UrgencyLevel;
  notes: string;
}
