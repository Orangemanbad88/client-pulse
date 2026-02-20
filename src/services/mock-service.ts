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
  // Mock: In production, this writes to Supabase
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
  return newClient;
};
