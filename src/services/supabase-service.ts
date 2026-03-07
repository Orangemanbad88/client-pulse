import { createServerSupabaseClient, createBrowserSupabaseClient } from '@/lib/supabase';
import { snakeToCamel, snakeToCamelArray } from '@/lib/case-utils';
import type {
  Client,
  ClientPreferences,
  Activity,
  Transaction,
  PropertyMatch,
  AIProfile,
  Trigger,
  DashboardStats,
  ClientIntakeData,
  CreateActivityInput,
  CreateTriggerInput,
  NextAction,
} from '@/types/client';

const db = () =>
  typeof window !== 'undefined'
    ? createBrowserSupabaseClient()
    : createServerSupabaseClient();

// ---- Clients ----

export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await db()
    .from('clients')
    .select('*')
    .order('last_contact', { ascending: false });

  if (error) throw new Error(`getClients: ${error.message}`);
  return snakeToCamelArray<Client>(data);
};

export const getClient = async (id: string): Promise<Client | null> => {
  const { data, error } = await db()
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`getClient: ${error.message}`);
  }
  return snakeToCamel<Client>(data);
};

// ---- Preferences ----

export const getClientPreferences = async (clientId: string): Promise<ClientPreferences | null> => {
  const { data, error } = await db()
    .from('client_preferences')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getClientPreferences: ${error.message}`);
  }
  return snakeToCamel<ClientPreferences>(data);
};

// ---- Activities ----

export const getClientActivities = async (clientId: string): Promise<Activity[]> => {
  const { data, error } = await db()
    .from('activities')
    .select('*')
    .eq('client_id', clientId)
    .order('timestamp', { ascending: false });

  if (error) throw new Error(`getClientActivities: ${error.message}`);
  return snakeToCamelArray<Activity>(data);
};

export const getRecentActivities = async (limit = 10): Promise<Activity[]> => {
  const { data, error } = await db()
    .from('activities')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getRecentActivities: ${error.message}`);
  return snakeToCamelArray<Activity>(data);
};

// ---- Transactions ----

export const getClientTransactions = async (clientId: string): Promise<Transaction[]> => {
  const { data, error } = await db()
    .from('transactions')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });

  if (error) throw new Error(`getClientTransactions: ${error.message}`);
  return snakeToCamelArray<Transaction>(data);
};

// ---- Property Matches ----

export const getClientMatches = async (clientId: string): Promise<PropertyMatch[]> => {
  const { data, error } = await db()
    .from('property_matches')
    .select('*')
    .eq('client_id', clientId)
    .order('match_score', { ascending: false });

  if (error) throw new Error(`getClientMatches: ${error.message}`);
  return snakeToCamelArray<PropertyMatch>(data);
};

export const getAllMatches = async (): Promise<PropertyMatch[]> => {
  const { data, error } = await db()
    .from('property_matches')
    .select('*')
    .order('match_score', { ascending: false });

  if (error) throw new Error(`getAllMatches: ${error.message}`);
  return snakeToCamelArray<PropertyMatch>(data);
};

// ---- AI Profiles ----

export const getAIProfile = async (clientId: string): Promise<AIProfile | null> => {
  const { data, error } = await db()
    .from('ai_profiles')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getAIProfile: ${error.message}`);
  }
  return snakeToCamel<AIProfile>(data);
};

// ---- Triggers ----

export const getAllTriggers = async (): Promise<Trigger[]> => {
  const { data, error } = await db()
    .from('triggers')
    .select('*')
    .order('fire_date', { ascending: true });

  if (error) throw new Error(`getAllTriggers: ${error.message}`);
  return snakeToCamelArray<Trigger>(data);
};

export const getClientTriggers = async (clientId: string): Promise<Trigger[]> => {
  const { data, error } = await db()
    .from('triggers')
    .select('*')
    .eq('client_id', clientId)
    .order('fire_date', { ascending: true });

  if (error) throw new Error(`getClientTriggers: ${error.message}`);
  return snakeToCamelArray<Trigger>(data);
};

// ---- Dashboard ----

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const supabase = db();

  const [clientsRes, triggersRes, matchesRes] = await Promise.all([
    supabase.from('clients').select('id, status, lifecycle_stage, created_at'),
    supabase.from('triggers').select('id, status'),
    supabase.from('property_matches').select('id, status'),
  ]);

  const clients = clientsRes.data ?? [];
  const triggers = triggersRes.data ?? [];
  const matches = matchesRes.data ?? [];

  const activeClients = clients.filter((c) => c.status === 'active').length;
  const pendingFollowUps = triggers.filter((t) => t.status === 'fired').length;
  const renewals = clients.filter((c) => c.lifecycle_stage === 'renewal_window').length;
  const newMatches = matches.filter((m) => m.status === 'new').length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newLeads = clients.filter((c) => new Date(c.created_at) >= weekAgo).length;

  return {
    totalActiveClients: activeClients,
    pendingFollowUps,
    leaseExpirationsThisMonth: renewals,
    newListingsToday: 0,
    matchesPending: newMatches,
    leadsThisWeek: newLeads,
    conversionRate: activeClients > 0 ? 0.68 : 0,
    avgResponseTime: activeClients > 0 ? '2.4 hrs' : '—',
  };
};

// ---- Create ----

export const createClient = async (data: ClientIntakeData): Promise<Client> => {
  const supabase = db();

  const { data: inserted, error } = await supabase
    .from('clients')
    .insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email || '',
      phone: data.phone || '',
      preferred_contact: data.preferredContact || 'any',
      client_type: data.clientType || 'rental',
      status: 'active',
      lifecycle_stage: 'new_lead',
      source: data.source || '',
      assigned_agent: 'Agent',
      notes: data.notes || '',
    })
    .select()
    .single();

  if (error) throw new Error(`createClient: ${error.message}`);

  // Save preferences
  if (data.rentalPrefs || data.buyerPrefs) {
    const { error: prefError } = await supabase
      .from('client_preferences')
      .insert({
        client_id: inserted.id,
        rental: data.rentalPrefs || null,
        buyer: data.buyerPrefs || null,
      });
    if (prefError) throw new Error(`createClient prefs: ${prefError.message}`);
  }

  return snakeToCamel<Client>(inserted);
};

// ---- Write Operations ----

export const updateTriggerStatus = async (id: string, status: 'completed' | 'dismissed'): Promise<void> => {
  const { error } = await db()
    .from('triggers')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(`updateTriggerStatus: ${error.message}`);
};

export const updateMatchStatus = async (id: string, status: 'sent' | 'dismissed' | 'interested'): Promise<void> => {
  const { error } = await db()
    .from('property_matches')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(`updateMatchStatus: ${error.message}`);
};

export const updateClient = async (id: string, data: Partial<Client>): Promise<Client> => {
  const { camelToSnake } = await import('@/lib/case-utils');
  const snakeData = camelToSnake(data as Record<string, unknown>);
  delete snakeData.id;
  delete snakeData.created_at;

  const { data: updated, error } = await db()
    .from('clients')
    .update(snakeData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`updateClient: ${error.message}`);
  return snakeToCamel<Client>(updated);
};

export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  const { data, error } = await db()
    .from('activities')
    .insert({
      client_id: input.clientId,
      type: input.type,
      title: input.title,
      description: input.description,
      property_id: input.propertyId || null,
      property_address: input.propertyAddress || null,
      agent_name: input.agentName,
    })
    .select()
    .single();

  if (error) throw new Error(`createActivity: ${error.message}`);
  return snakeToCamel<Activity>(data);
};

export const createTrigger = async (input: CreateTriggerInput): Promise<Trigger> => {
  const { data, error } = await db()
    .from('triggers')
    .insert({
      client_id: input.clientId,
      client_name: input.clientName,
      type: input.type,
      title: input.title,
      description: input.description,
      fire_date: input.fireDate,
      status: 'fired',
      message_draft: input.messageDraft || null,
      urgency: input.urgency,
    })
    .select()
    .single();

  if (error) throw new Error(`createTrigger: ${error.message}`);
  return snakeToCamel<Trigger>(data);
};

export const deleteClient = async (id: string): Promise<void> => {
  const { error } = await db()
    .from('clients')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`deleteClient: ${error.message}`);
};

export const bulkInsertMatches = async (clientId: string, matches: Omit<import('@/types/client').PropertyMatch, 'id' | 'foundAt'>[]): Promise<import('@/types/client').PropertyMatch[]> => {
  const supabase = db();

  // Clear old matches for this client
  await supabase.from('property_matches').delete().eq('client_id', clientId);

  if (matches.length === 0) return [];

  const rows = matches.map((m) => ({
    client_id: m.clientId,
    client_name: m.clientName,
    listing_id: m.listingId,
    address: m.address,
    city: m.city,
    price: m.price,
    bedrooms: m.bedrooms,
    bathrooms: m.bathrooms,
    sqft: m.sqft,
    property_type: m.propertyType,
    match_score: m.matchScore,
    match_reasons: m.matchReasons,
    status: m.status,
    photo_url: m.photoUrl || null,
    mls_number: m.mlsNumber || null,
  }));

  const { data, error } = await supabase
    .from('property_matches')
    .insert(rows)
    .select();

  if (error) throw new Error(`bulkInsertMatches: ${error.message}`);
  return snakeToCamelArray<import('@/types/client').PropertyMatch>(data);
};

export const upsertAIProfile = async (
  clientId: string,
  summary: string,
  actions: NextAction[],
): Promise<void> => {
  const { error } = await db()
    .from('ai_profiles')
    .upsert({
      client_id: clientId,
      summary,
      next_actions: actions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' });

  if (error) throw new Error(`upsertAIProfile: ${error.message}`);
};
