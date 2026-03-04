/**
 * Service router — exports from mock-service or supabase-service
 * based on NEXT_PUBLIC_DATA_SOURCE env var.
 *
 * Default: 'mock' (safe for local dev without Supabase).
 */

import * as mock from './mock-service';
import * as supabase from './supabase-service';

const svc = process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase' ? supabase : mock;

export const getClients = svc.getClients;
export const getClient = svc.getClient;
export const getClientPreferences = svc.getClientPreferences;
export const getClientActivities = svc.getClientActivities;
export const getClientTransactions = svc.getClientTransactions;
export const getClientMatches = svc.getClientMatches;
export const getAllMatches = svc.getAllMatches;
export const getAIProfile = svc.getAIProfile;
export const getAllTriggers = svc.getAllTriggers;
export const getClientTriggers = svc.getClientTriggers;
export const getRecentActivities = svc.getRecentActivities;
export const getDashboardStats = svc.getDashboardStats;
export const createClient = svc.createClient;
export const updateTriggerStatus = svc.updateTriggerStatus;
export const updateMatchStatus = svc.updateMatchStatus;
export const updateClient = svc.updateClient;
export const createActivity = svc.createActivity;
export const createTrigger = svc.createTrigger;
export const upsertAIProfile = svc.upsertAIProfile;
