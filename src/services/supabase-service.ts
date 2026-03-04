import { createServerSupabaseClient } from '@/lib/supabase';
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
} from '@/types/client';

const db = () => createServerSupabaseClient();

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

  if (clientsRes.error) throw new Error(`getDashboardStats clients: ${clientsRes.error.message}`);
  if (triggersRes.error) throw new Error(`getDashboardStats triggers: ${triggersRes.error.message}`);
  if (matchesRes.error) throw new Error(`getDashboardStats matches: ${matchesRes.error.message}`);

  const clients = clientsRes.data;
  const triggers = triggersRes.data;
  const matches = matchesRes.data;

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
    newListingsToday: 3,
    matchesPending: newMatches,
    leadsThisWeek: newLeads,
    conversionRate: 0.68,
    avgResponseTime: '2.4 hrs',
  };
};

// ---- Create ----

export const createClient = async (data: ClientIntakeData): Promise<Client> => {
  const { data: inserted, error } = await db()
    .from('clients')
    .insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      preferred_contact: data.preferredContact,
      client_type: data.clientType,
      status: 'active',
      lifecycle_stage: 'new_lead',
      source: data.source,
      assigned_agent: 'Agent',
      notes: data.notes,
    })
    .select()
    .single();

  if (error) throw new Error(`createClient: ${error.message}`);
  return snakeToCamel<Client>(inserted);
};
