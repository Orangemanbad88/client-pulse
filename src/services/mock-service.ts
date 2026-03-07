import mockData from '@/data/mock-data.json';
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

// Simulated async to match future Supabase service interface

export const getClients = async (): Promise<Client[]> => {
  return mockData.clients as Client[];
};

export const getClient = async (id: string): Promise<Client | null> => {
  return (mockData.clients as Client[]).find((c) => c.id === id) || null;
};

export const getClientPreferences = async (clientId: string): Promise<ClientPreferences | null> => {
  return (mockData.preferences as ClientPreferences[]).find((p) => p.clientId === clientId) || null;
};

export const getClientActivities = async (clientId: string): Promise<Activity[]> => {
  return (mockData.activities as Activity[])
    .filter((a) => a.clientId === clientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getClientTransactions = async (clientId: string): Promise<Transaction[]> => {
  return (mockData.transactions as Transaction[])
    .filter((t) => t.clientId === clientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getClientMatches = async (clientId: string): Promise<PropertyMatch[]> => {
  return (mockData.matches as PropertyMatch[])
    .filter((m) => m.clientId === clientId)
    .sort((a, b) => b.matchScore - a.matchScore);
};

export const getAllMatches = async (): Promise<PropertyMatch[]> => {
  return (mockData.matches as PropertyMatch[]).sort((a, b) => b.matchScore - a.matchScore);
};

export const getAIProfile = async (clientId: string): Promise<AIProfile | null> => {
  return (mockData.aiProfiles as AIProfile[]).find((p) => p.clientId === clientId) || null;
};

export const getAllTriggers = async (): Promise<Trigger[]> => {
  return (mockData.triggers as Trigger[]).sort(
    (a, b) => new Date(a.fireDate).getTime() - new Date(b.fireDate).getTime()
  );
};

export const getClientTriggers = async (clientId: string): Promise<Trigger[]> => {
  return (mockData.triggers as Trigger[])
    .filter((t) => t.clientId === clientId)
    .sort((a, b) => new Date(a.fireDate).getTime() - new Date(b.fireDate).getTime());
};

export const getRecentActivities = async (limit = 10): Promise<Activity[]> => {
  return (mockData.activities as Activity[])
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const clients = mockData.clients as Client[];
  const triggers = mockData.triggers as Trigger[];
  const matches = mockData.matches as PropertyMatch[];

  const activeClients = clients.filter((c) => c.status === 'active').length;
  const pendingFollowUps = triggers.filter((t) => t.status === 'fired').length;
  const renewals = clients.filter((c) => c.lifecycleStage === 'renewal_window').length;
  const newMatches = matches.filter((m) => m.status === 'new').length;
  const newLeads = clients.filter((c) => {
    const created = new Date(c.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;

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

export const createClient = async (data: ClientIntakeData): Promise<Client> => {
  const newClient: Client = {
    id: `cl_${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    preferredContact: data.preferredContact,
    clientType: data.clientType,
    status: 'active',
    lifecycleStage: 'new_lead',
    source: data.source,
    assignedAgent: 'Agent',
    notes: data.notes,
    createdAt: new Date().toISOString(),
    lastContact: new Date().toISOString(),
  };

  // Save preferences in-memory
  if (data.rentalPrefs || data.buyerPrefs) {
    (mockData.preferences as ClientPreferences[]).push({
      clientId: newClient.id,
      rental: data.rentalPrefs as ClientPreferences['rental'],
      buyer: data.buyerPrefs as ClientPreferences['buyer'],
    });
  }

  (mockData.clients as Client[]).push(newClient);
  return newClient;
};

// ---- Write Operations ----

export const updateTriggerStatus = async (id: string, status: 'completed' | 'dismissed'): Promise<void> => {
  const trigger = (mockData.triggers as Trigger[]).find((t) => t.id === id);
  if (trigger) trigger.status = status;
};

export const updateMatchStatus = async (id: string, status: 'sent' | 'dismissed' | 'interested'): Promise<void> => {
  const match = (mockData.matches as PropertyMatch[]).find((m) => m.id === id);
  if (match) match.status = status;
};

export const updateClient = async (id: string, data: Partial<Client>): Promise<Client> => {
  const client = (mockData.clients as Client[]).find((c) => c.id === id);
  if (!client) throw new Error(`Client ${id} not found`);
  Object.assign(client, data);
  return client;
};

export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  const activity: Activity = {
    id: `act_${Date.now()}`,
    clientId: input.clientId,
    type: input.type,
    title: input.title,
    description: input.description,
    propertyId: input.propertyId,
    propertyAddress: input.propertyAddress,
    timestamp: new Date().toISOString(),
    agentName: input.agentName,
  };
  (mockData.activities as Activity[]).push(activity);
  return activity;
};

export const createTrigger = async (input: CreateTriggerInput): Promise<Trigger> => {
  const trigger: Trigger = {
    id: `trg_${Date.now()}`,
    clientId: input.clientId,
    clientName: input.clientName,
    type: input.type,
    title: input.title,
    description: input.description,
    fireDate: input.fireDate,
    status: 'fired',
    messageDraft: input.messageDraft,
    urgency: input.urgency,
  };
  (mockData.triggers as Trigger[]).push(trigger);
  return trigger;
};

export const deleteClient = async (id: string): Promise<void> => {
  const idx = (mockData.clients as Client[]).findIndex((c) => c.id === id);
  if (idx !== -1) (mockData.clients as Client[]).splice(idx, 1);
};

export const bulkInsertMatches = async (clientId: string, matches: Omit<PropertyMatch, 'id' | 'foundAt'>[]): Promise<PropertyMatch[]> => {
  // Remove old matches
  const existing = mockData.matches as PropertyMatch[];
  const filtered = existing.filter((m) => m.clientId !== clientId);
  existing.length = 0;
  existing.push(...filtered);

  // Add new matches
  const created = matches.map((m, i) => ({
    ...m,
    id: `match_${Date.now()}_${i}`,
    foundAt: new Date().toISOString(),
  } as PropertyMatch));
  existing.push(...created);
  return created;
};

export const upsertAIProfile = async (
  clientId: string,
  summary: string,
  actions: NextAction[],
): Promise<void> => {
  const profiles = mockData.aiProfiles as AIProfile[];
  const existing = profiles.find((p) => p.clientId === clientId);
  if (existing) {
    existing.summary = summary;
    existing.nextActions = actions;
    existing.updatedAt = new Date().toISOString();
  } else {
    profiles.push({ clientId, summary, nextActions: actions, updatedAt: new Date().toISOString() });
  }
};
