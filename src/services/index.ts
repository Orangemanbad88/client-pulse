/**
 * Service router — exports from mock-service or supabase-service
 * based on NEXT_PUBLIC_DATA_SOURCE env var.
 *
 * Uses dynamic re-export pattern to avoid pulling supabase-service
 * (which uses server-only APIs) into client bundles.
 */

const isSupabase = process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase';

async function svc() {
  if (isSupabase) {
    return import('./supabase-service');
  }
  return import('./mock-service');
}

// ---- Reads ----

export const getClients = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getClients']>) => {
  const s = await svc();
  return s.getClients(...args);
};

export const getClient = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getClient']>) => {
  const s = await svc();
  return s.getClient(...args);
};

export const getClientPreferences = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getClientPreferences']>) => {
  const s = await svc();
  return s.getClientPreferences(...args);
};

export const getClientActivities = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getClientActivities']>) => {
  const s = await svc();
  return s.getClientActivities(...args);
};

export const getClientTransactions = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getClientTransactions']>) => {
  const s = await svc();
  return s.getClientTransactions(...args);
};

export const getClientMatches = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getClientMatches']>) => {
  const s = await svc();
  return s.getClientMatches(...args);
};

export const getAllMatches = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getAllMatches']>) => {
  const s = await svc();
  return s.getAllMatches(...args);
};

export const getAIProfile = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getAIProfile']>) => {
  const s = await svc();
  return s.getAIProfile(...args);
};

export const getAllTriggers = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getAllTriggers']>) => {
  const s = await svc();
  return s.getAllTriggers(...args);
};

export const getClientTriggers = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getClientTriggers']>) => {
  const s = await svc();
  return s.getClientTriggers(...args);
};

export const getRecentActivities = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getRecentActivities']>) => {
  const s = await svc();
  return s.getRecentActivities(...args);
};

export const getDashboardStats = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['getDashboardStats']>) => {
  const s = await svc();
  return s.getDashboardStats(...args);
};

// ---- Writes ----

export const createClient = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['createClient']>) => {
  const s = await svc();
  return s.createClient(...args);
};

export const updateTriggerStatus = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['updateTriggerStatus']>) => {
  const s = await svc();
  return s.updateTriggerStatus(...args);
};

export const updateMatchStatus = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['updateMatchStatus']>) => {
  const s = await svc();
  return s.updateMatchStatus(...args);
};

export const updateClient = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['updateClient']>) => {
  const s = await svc();
  return s.updateClient(...args);
};

export const createActivity = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['createActivity']>) => {
  const s = await svc();
  return s.createActivity(...args);
};

export const createTrigger = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['createTrigger']>) => {
  const s = await svc();
  return s.createTrigger(...args);
};

export const deleteClient = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['deleteClient']>) => {
  const s = await svc();
  return s.deleteClient(...args);
};

export const bulkInsertMatches = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['bulkInsertMatches']>) => {
  const s = await svc();
  return s.bulkInsertMatches(...args);
};

export const upsertAIProfile = async (...args: Parameters<Awaited<ReturnType<typeof svc>>['upsertAIProfile']>) => {
  const s = await svc();
  return s.upsertAIProfile(...args);
};
