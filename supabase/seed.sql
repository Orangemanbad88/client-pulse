-- ============================================================
-- ClientPulse — Seed Data (from mock-data.json)
-- ============================================================
-- Deterministic UUIDs mapped from old string IDs

-- Client UUID mapping:
-- cl_001 → 00000000-0000-4000-a000-000000000001  Sarah Chen
-- cl_002 → 00000000-0000-4000-a000-000000000002  James Rodriguez
-- cl_003 → 00000000-0000-4000-a000-000000000003  Maria Gonzalez
-- cl_004 → 00000000-0000-4000-a000-000000000004  David Park
-- cl_005 → 00000000-0000-4000-a000-000000000005  Ashley Williams
-- cl_006 → 00000000-0000-4000-a000-000000000006  Robert Thompson
-- cl_007 → 00000000-0000-4000-a000-000000000007  Jennifer Nguyen
-- cl_008 → 00000000-0000-4000-a000-000000000008  Marcus Johnson
-- cl_009 → 00000000-0000-4000-a000-000000000009  Linda Martinez
-- cl_010 → 00000000-0000-4000-a000-00000000000a  Kevin O'Brien

-- ============================================================
-- Clients
-- ============================================================

INSERT INTO clients (id, first_name, last_name, email, phone, preferred_contact, client_type, status, lifecycle_stage, source, assigned_agent, notes, created_at, last_contact)
VALUES
  ('00000000-0000-4000-a000-000000000001', 'Sarah', 'Chen', 'sarah.chen@email.com', '(727) 555-0142', 'text', 'rental', 'active', 'active_search', 'Referral - Mike Torres', 'Agent', 'Has 2 medium dogs (labs). Needs fenced yard. Works remote so home office space important.', '2025-12-15T10:00:00Z', '2026-02-12T14:30:00Z'),
  ('00000000-0000-4000-a000-000000000002', 'James', 'Rodriguez', 'j.rodriguez@outlook.com', '(727) 555-0287', 'email', 'buyer', 'active', 'hot_decision', 'Website', 'Agent', 'Pre-approved with Wells Fargo. Looking to close by April. Wants investment potential.', '2026-01-08T09:00:00Z', '2026-02-13T11:00:00Z'),
  ('00000000-0000-4000-a000-000000000003', 'Maria', 'Gonzalez', 'maria.g@gmail.com', '(727) 555-0391', 'phone', 'rental', 'active', 'renewal_window', 'MLS Listing', 'Agent', 'Current tenant at 215 Palm Dr. Great tenant, always pays on time. Wants to stay in Dunedin.', '2025-03-20T08:00:00Z', '2026-02-10T16:00:00Z'),
  ('00000000-0000-4000-a000-000000000004', 'David', 'Park', 'david.park@techcorp.com', '(727) 555-0455', 'email', 'buyer', 'active', 'under_contract', 'Zillow', 'Agent', 'Relocating from Atlanta for work. Closing on 890 Bay Blvd on March 5. Needs fast timeline.', '2026-01-20T12:00:00Z', '2026-02-14T09:00:00Z'),
  ('00000000-0000-4000-a000-000000000005', 'Ashley', 'Williams', 'ashley.w@icloud.com', '(727) 555-0518', 'text', 'rental', 'active', 'new_lead', 'Instagram', 'Agent', 'Just moved to area. Nurse at Mease Countryside. Needs something close to hospital.', '2026-02-12T15:00:00Z', '2026-02-12T15:00:00Z'),
  ('00000000-0000-4000-a000-000000000006', 'Robert', 'Thompson', 'r.thompson@email.com', '(727) 555-0623', 'phone', 'investor', 'active', 'active_search', 'Referral - Chamber of Commerce', 'Agent', 'Owns 4 rentals already. Looking for 5th. Cash buyer. Wants 8%+ cap rate.', '2025-11-05T10:00:00Z', '2026-02-08T13:00:00Z'),
  ('00000000-0000-4000-a000-000000000007', 'Jennifer', 'Nguyen', 'jen.nguyen@yahoo.com', '(727) 555-0734', 'text', 'rental', 'active', 'active_client', 'Referral - Sarah Chen', 'Agent', 'Leased 412 Cypress Ln in October. Happy with the place. Has a cat.', '2025-09-18T11:00:00Z', '2026-01-15T10:00:00Z'),
  ('00000000-0000-4000-a000-000000000008', 'Marcus', 'Johnson', 'marcus.j@gmail.com', '(727) 555-0849', 'email', 'rental', 'active', 'hot_decision', 'Apartments.com', 'Agent', 'Young professional, just got engaged. Looking for 2BR+. Toured 4 places last week. Very interested in Clearwater Beach area.', '2026-01-28T14:00:00Z', '2026-02-13T17:00:00Z'),
  ('00000000-0000-4000-a000-000000000009', 'Linda', 'Martinez', 'linda.martinez@email.com', '(727) 555-0956', 'phone', 'buyer', 'past_client', 'past_client', 'Referral - Robert Thompson', 'Agent', 'Purchased 1450 Sunset Dr in August 2025. First-time homebuyer. Very happy. Good referral source.', '2025-04-10T09:00:00Z', '2025-12-20T11:00:00Z'),
  ('00000000-0000-4000-a000-00000000000a', 'Kevin', 'O''Brien', 'kevin.ob@proton.me', '(727) 555-1067', 'email', 'rental', 'inactive', 'past_client', 'Walk-in', 'Agent', 'Rented 330 Oak St for 2 years. Moved out of state to Oregon. Could return.', '2024-01-15T10:00:00Z', '2025-10-01T09:00:00Z');

-- ============================================================
-- Client Preferences
-- ============================================================

INSERT INTO client_preferences (client_id, rental, buyer)
VALUES
  ('00000000-0000-4000-a000-000000000001',
    '{"budgetMin":2200,"budgetMax":2600,"bedrooms":3,"bathrooms":2,"sqftMin":1400,"preferredAreas":["Dunedin","Palm Harbor"],"propertyTypes":["single_family","townhouse"],"mustHaveAmenities":["pet_friendly","fenced_yard","washer_dryer"],"pets":"2 medium Labrador mixes","moveInTimeline":"March 2026","leaseTermPref":"12 months","currentLeaseExpiration":"2026-03-15","currentAddress":"412 Main St, Dunedin, FL"}'::jsonb,
    NULL),
  ('00000000-0000-4000-a000-000000000002',
    NULL,
    '{"budgetMin":350000,"budgetMax":475000,"bedrooms":3,"bathrooms":2,"sqftMin":1600,"preferredAreas":["Dunedin","Clearwater","Safety Harbor"],"propertyTypes":["single_family"],"mustHaveFeatures":["garage","pool","central_ac"],"preApproved":true,"preApprovalAmount":500000,"lenderContact":"Mike Davis, Wells Fargo - (727) 555-8800","downPayment":"20% ($90,000 available)","timeline":"Close by April 2026","investmentIntent":true}'::jsonb),
  ('00000000-0000-4000-a000-000000000003',
    '{"budgetMin":1800,"budgetMax":2200,"bedrooms":2,"bathrooms":2,"sqftMin":1100,"preferredAreas":["Dunedin"],"propertyTypes":["single_family","condo","townhouse"],"mustHaveAmenities":["central_ac","washer_dryer"],"pets":"None","moveInTimeline":"April 2026 (current lease end)","leaseTermPref":"12 months","currentLeaseExpiration":"2026-04-01","currentAddress":"215 Palm Dr, Dunedin, FL"}'::jsonb,
    NULL),
  ('00000000-0000-4000-a000-000000000004',
    NULL,
    '{"budgetMin":400000,"budgetMax":550000,"bedrooms":4,"bathrooms":3,"sqftMin":2000,"preferredAreas":["Dunedin","Palm Harbor","Clearwater"],"propertyTypes":["single_family"],"mustHaveFeatures":["garage","pool","fenced_yard"],"preApproved":true,"preApprovalAmount":575000,"lenderContact":"Jane Smith, Chase - (813) 555-7700","downPayment":"25%","timeline":"Closing March 5, 2026","investmentIntent":false}'::jsonb),
  ('00000000-0000-4000-a000-000000000005',
    '{"budgetMin":1500,"budgetMax":2000,"bedrooms":2,"bathrooms":1,"sqftMin":900,"preferredAreas":["Safety Harbor","Clearwater","Dunedin"],"propertyTypes":["apartment","condo","townhouse"],"mustHaveAmenities":["central_ac","washer_dryer"],"pets":"None","moveInTimeline":"ASAP - within 2 weeks","leaseTermPref":"12 months","currentAddress":"Temporary housing"}'::jsonb,
    NULL),
  ('00000000-0000-4000-a000-000000000006',
    NULL,
    '{"budgetMin":250000,"budgetMax":400000,"bedrooms":3,"bathrooms":2,"sqftMin":1200,"preferredAreas":["Dunedin","Clearwater","Palm Harbor","Tarpon Springs"],"propertyTypes":["single_family","duplex","triplex","fourplex"],"mustHaveFeatures":["central_ac"],"preApproved":false,"lenderContact":"","downPayment":"Cash buyer","timeline":"Whenever right deal appears","investmentIntent":true}'::jsonb),
  ('00000000-0000-4000-a000-000000000008',
    '{"budgetMin":1800,"budgetMax":2400,"bedrooms":2,"bathrooms":2,"sqftMin":1000,"preferredAreas":["Clearwater Beach","Clearwater","Dunedin"],"propertyTypes":["condo","apartment","townhouse"],"mustHaveAmenities":["pool","washer_dryer","garage"],"pets":"None","moveInTimeline":"March-April 2026","leaseTermPref":"12 months","currentAddress":"505 Harbor Way #204, Clearwater, FL"}'::jsonb,
    NULL);

-- ============================================================
-- Activities
-- ============================================================

INSERT INTO activities (client_id, type, title, description, property_address, timestamp, agent_name)
VALUES
  ('00000000-0000-4000-a000-000000000001', 'showing', 'Toured 670 Patricia Ave', 'Showed 3BR/2BA in Dunedin. Sarah loved the layout and yard. Main concern: no W/D hookups. Spent 45 minutes.', '670 Patricia Ave, Dunedin, FL', '2026-02-11T14:00:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000001', 'showing', 'Toured 890 Pinehurst Rd', '3BR/2BA with fenced yard. Has W/D. Smaller than she wanted (1,250 sqft). 20 minute visit.', '890 Pinehurst Rd, Dunedin, FL', '2026-02-11T15:30:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000001', 'text', 'Follow-up after showings', 'Sarah texted back saying she''s still thinking about Patricia Ave. Asked if landlord would install W/D.', NULL, '2026-02-12T14:30:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000002', 'showing', 'Toured 445 Bayshore Blvd', '4BR/3BA, pool, 2-car garage. James very interested. Within budget at $449K. Wants to make offer.', '445 Bayshore Blvd, Dunedin, FL', '2026-02-13T10:00:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000002', 'comp_report', 'Pulled comps for 445 Bayshore', 'CompAtlas report showing comparable sales $425K-$470K range. Property fairly priced.', '445 Bayshore Blvd, Dunedin, FL', '2026-02-13T11:00:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000003', 'call', 'Lease renewal discussion', 'Maria called to ask about renewal options. Wants to stay but hoping for same rate. Current: $2,000/mo. Market suggests $2,100-$2,200.', NULL, '2026-02-10T16:00:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000004', 'system', 'Inspection scheduled', 'Home inspection for 890 Bay Blvd scheduled for Feb 18. Inspector: Pinellas Home Inspections.', NULL, '2026-02-14T09:00:00Z', 'System'),
  ('00000000-0000-4000-a000-000000000005', 'note', 'Initial intake completed', 'Ashley is a travel nurse starting at Mease Countryside next week. Needs a place within 15 min of hospital. Budget tight but flexible on size.', NULL, '2026-02-12T15:00:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000008', 'showing', 'Toured 3 condos in Clearwater Beach', 'Showed Marcus and his fiancée 3 units. They loved the Gulf views at 1200 Gulf Blvd #305 but it''s at top of budget ($2,400). Also liked 880 Mandalay.', '1200 Gulf Blvd #305, Clearwater Beach, FL', '2026-02-10T11:00:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000008', 'listing_viewed', 'Viewed 6 listings online', 'Marcus viewed multiple Clearwater Beach listings. Focused on 2BR condos with pool access. Spent most time on waterfront units.', NULL, '2026-02-13T17:00:00Z', 'System'),
  ('00000000-0000-4000-a000-000000000006', 'email', 'Sent investment analysis', 'Emailed Robert cap rate analysis on 3 potential investment properties. Best one: triplex on Alt 19 showing 8.3% cap rate.', NULL, '2026-02-08T13:00:00Z', 'Agent'),
  ('00000000-0000-4000-a000-000000000007', 'follow_up', '90-day check-in', 'Called Jennifer for quarterly check-in. Everything going well at 412 Cypress. No maintenance issues. Happy tenant.', NULL, '2026-01-15T10:00:00Z', 'Agent');

-- ============================================================
-- Transactions
-- ============================================================

INSERT INTO transactions (client_id, property_id, property_address, type, date, amount, lease_end_date, notes)
VALUES
  ('00000000-0000-4000-a000-000000000007', 'prop_cypress', '412 Cypress Ln, Dunedin, FL', 'lease', '2025-10-01', 2100, '2026-09-30', '12-month lease. $2,100/mo. First/last/security collected.'),
  ('00000000-0000-4000-a000-000000000003', 'prop_palm', '215 Palm Dr, Dunedin, FL', 'lease', '2025-04-01', 2000, '2026-04-01', '12-month lease. $2,000/mo. Excellent tenant.'),
  ('00000000-0000-4000-a000-000000000009', 'prop_sunset', '1450 Sunset Dr, Clearwater, FL', 'sale', '2025-08-15', 385000, NULL, 'First-time buyer. Clean closing.'),
  ('00000000-0000-4000-a000-00000000000a', 'prop_oak', '330 Oak St, Dunedin, FL', 'lease', '2024-02-01', 1850, '2025-09-30', 'Renewed once. Good tenant. Moved to Oregon.');

-- ============================================================
-- Property Matches
-- ============================================================

INSERT INTO property_matches (client_id, client_name, listing_id, address, city, price, bedrooms, bathrooms, sqft, property_type, match_score, match_reasons, status, found_at)
VALUES
  ('00000000-0000-4000-a000-000000000001', 'Sarah Chen', 'mls_28441', '725 Virginia Ln', 'Dunedin', 2350, 3, 2, 1520, 'single_family', 92, ARRAY['Pet-friendly','Fenced yard','W/D hookups','3BR/2BA match','Dunedin location','Within budget'], 'new', '2026-02-14T08:00:00Z'),
  ('00000000-0000-4000-a000-000000000001', 'Sarah Chen', 'mls_28455', '1100 San Mateo Dr', 'Dunedin', 2500, 3, 2, 1680, 'single_family', 87, ARRAY['Pet-friendly','W/D included','3BR/2BA match','Dunedin location'], 'new', '2026-02-14T08:00:00Z'),
  ('00000000-0000-4000-a000-000000000005', 'Ashley Williams', 'mls_28460', '2200 McMullen Booth Rd #112', 'Safety Harbor', 1750, 2, 1, 950, 'apartment', 85, ARRAY['Within budget','2BR match','Close to Mease Countryside','W/D in unit','Available now'], 'new', '2026-02-14T08:00:00Z'),
  ('00000000-0000-4000-a000-000000000008', 'Marcus Johnson', 'mls_28448', '880 Mandalay Ave #210', 'Clearwater Beach', 2200, 2, 2, 1150, 'condo', 90, ARRAY['Pool access','2BR/2BA match','Clearwater Beach location','Under budget','Garage parking'], 'sent', '2026-02-12T08:00:00Z'),
  ('00000000-0000-4000-a000-000000000006', 'Robert Thompson', 'mls_28470', '1580 Alt 19 N', 'Dunedin', 375000, 6, 3, 2800, 'triplex', 88, ARRAY['Investment property','Multi-family','8.3% estimated cap rate','Dunedin location','Within budget'], 'sent', '2026-02-07T08:00:00Z');

-- ============================================================
-- AI Profiles
-- ============================================================

INSERT INTO ai_profiles (client_id, summary, next_actions, updated_at)
VALUES
  ('00000000-0000-4000-a000-000000000001',
    'Sarah Chen is an active rental client looking for a pet-friendly 3BR/2BA home in Dunedin or Palm Harbor, budget $2,200-$2,600/month. She has two medium Labrador mixes and needs a fenced yard. Her current lease at 412 Main St expires March 15, 2026 (29 days). She''s viewed 8 properties in the last 30 days but hasn''t committed — the main blocker is finding pet-friendly options with W/D hookups in her target areas. She works remotely and values a dedicated home office space. Priority: HIGH due to imminent lease expiration.',
    '[{"id":"na_001","title":"Send new listing: 725 Virginia Ln","description":"92% match — pet-friendly 3BR/2BA with fenced yard AND W/D hookups in Dunedin. $2,350/mo. This checks every box.","urgency":"high","category":"match","dueDate":"2026-02-14","completed":false},{"id":"na_002","title":"Follow up on 670 Patricia Ave","description":"Sarah spent 45 minutes at this showing (longest of any tour). Check if landlord will install W/D — this could be the one.","urgency":"high","category":"follow_up","dueDate":"2026-02-15","completed":false},{"id":"na_003","title":"Lease expiration planning","description":"29 days until current lease expires. Schedule a call to discuss backup plan if preferred properties don''t work out. Consider month-to-month extension at current place.","urgency":"critical","category":"renewal","dueDate":"2026-02-16","completed":false}]'::jsonb,
    '2026-02-14T06:00:00Z'),
  ('00000000-0000-4000-a000-000000000002',
    'James Rodriguez is a pre-approved buyer ($500K) targeting 3BR/2BA single-family homes in Dunedin, Clearwater, or Safety Harbor, budget $350K-$475K. He wants investment potential and needs a pool and garage. He toured 445 Bayshore Blvd yesterday and is very interested — comps confirm fair pricing at $449K. He''s motivated to close by April 2026. Priority: HIGH — ready to make an offer.',
    '[{"id":"na_004","title":"Prepare offer for 445 Bayshore Blvd","description":"James is ready. Comps support $425K-$470K range. Recommend offering $440K with escalation clause to $455K.","urgency":"critical","category":"admin","dueDate":"2026-02-14","completed":false},{"id":"na_005","title":"Coordinate with Wells Fargo lender","description":"Contact Mike Davis to confirm pre-approval is current and get rate lock options before submitting offer.","urgency":"high","category":"admin","dueDate":"2026-02-14","completed":false}]'::jsonb,
    '2026-02-14T06:00:00Z'),
  ('00000000-0000-4000-a000-000000000003',
    'Maria Gonzalez is a current tenant at 215 Palm Dr, Dunedin. Excellent payment history, no issues. Her lease expires April 1, 2026 (46 days). She wants to renew but is hoping to keep the current $2,000/mo rate. Market analysis shows comparable rents at $2,100-$2,200. She''s been a client since March 2025 and is low maintenance. Priority: MEDIUM — renewal conversation needed.',
    '[{"id":"na_006","title":"Prepare renewal offer","description":"Draft lease renewal at $2,100/mo (5% increase, still below market). Include RentAtlas comp report to justify. Maria is a great tenant — small increase keeps her happy and you competitive.","urgency":"medium","category":"renewal","dueDate":"2026-02-18","completed":false}]'::jsonb,
    '2026-02-14T06:00:00Z'),
  ('00000000-0000-4000-a000-000000000005',
    'Ashley Williams is a new lead — travel nurse starting at Mease Countryside Hospital next week. Needs a 2BR within 15 minutes of the hospital, budget $1,500-$2,000/mo. She''s currently in temporary housing so timeline is URGENT. Best areas: Safety Harbor, Clearwater, Dunedin. No pets, flexible on amenities except needs W/D. Priority: HIGH — immediate housing need.',
    '[{"id":"na_007","title":"Send top 3 matches immediately","description":"Ashley needs a place this week. 2200 McMullen Booth Rd #112 is 85% match at $1,750. Find 2 more options and send all three today.","urgency":"critical","category":"match","dueDate":"2026-02-14","completed":false},{"id":"na_008","title":"Schedule showings for tomorrow","description":"Given urgency, try to book 2-3 showings for Feb 15. Ashley works nights so mornings/early afternoon best.","urgency":"critical","category":"outreach","dueDate":"2026-02-14","completed":false}]'::jsonb,
    '2026-02-14T06:00:00Z'),
  ('00000000-0000-4000-a000-000000000008',
    'Marcus Johnson is a hot rental lead recently engaged, looking for a 2BR/2BA in Clearwater Beach area, budget $1,800-$2,400/mo. He''s toured 4 properties last week and showed strong interest in both 1200 Gulf Blvd #305 ($2,400, at top of budget) and 880 Mandalay Ave #210 ($2,200). He''s been actively viewing listings online, focused on waterfront condos with pool access. Target move: March-April 2026. Priority: HIGH — close to decision.',
    '[{"id":"na_009","title":"Check availability on both top picks","description":"Confirm 1200 Gulf Blvd #305 and 880 Mandalay #210 are still available. Marcus is close to deciding.","urgency":"high","category":"follow_up","dueDate":"2026-02-14","completed":false},{"id":"na_010","title":"Send side-by-side comparison","description":"Create a comparison of the two units — price, sqft, amenities, proximity to beach. Help Marcus and his fiancée make a confident decision.","urgency":"medium","category":"outreach","dueDate":"2026-02-15","completed":false}]'::jsonb,
    '2026-02-14T06:00:00Z');

-- ============================================================
-- Triggers
-- ============================================================

INSERT INTO triggers (client_id, client_name, type, title, description, fire_date, status, urgency, message_draft)
VALUES
  ('00000000-0000-4000-a000-000000000001', 'Sarah Chen', 'lease_expiration', 'Lease expires in 29 days', 'Sarah''s lease at 412 Main St expires March 15. She hasn''t secured a new place yet.', '2026-02-14', 'fired', 'critical', 'Hi Sarah! Just checking in — your lease is up in about a month. I have a great new listing at 725 Virginia Ln that checks all your boxes (3BR, fenced yard, W/D, pet-friendly). Want to take a look this week?'),
  ('00000000-0000-4000-a000-000000000003', 'Maria Gonzalez', 'lease_expiration', 'Lease expires in 46 days', 'Maria''s lease at 215 Palm Dr expires April 1. She wants to renew. Need to prepare renewal offer.', '2026-02-14', 'fired', 'medium', 'Hi Maria! Your lease is coming up for renewal on April 1st. I''d love to have you stay — let''s chat about renewal terms this week. When works best for a quick call?'),
  ('00000000-0000-4000-a000-000000000005', 'Ashley Williams', 'new_client_followup', 'New client — 24hr follow-up', 'Ashley signed up 2 days ago and needs immediate housing. Follow up with property matches.', '2026-02-14', 'fired', 'critical', 'Hi Ashley! Welcome to the area! I found a few places near Mease Countryside that might work for you. Can I set up some showings for tomorrow?'),
  ('00000000-0000-4000-a000-000000000007', 'Jennifer Nguyen', 'quarterly_touchbase', 'Quarterly check-in due', 'Jennifer''s last check-in was Jan 15. Next quarterly touchbase due mid-April.', '2026-04-15', 'pending', 'low', NULL),
  ('00000000-0000-4000-a000-000000000009', 'Linda Martinez', 'annual_review', '6-month post-purchase check-in', 'Linda purchased 1450 Sunset Dr 6 months ago. Good time for a check-in and referral ask.', '2026-02-15', 'pending', 'low', 'Hi Linda! Can you believe it''s been 6 months since you closed on Sunset Dr? Hope you''re loving the place! If any friends or family are looking to buy or rent in the area, I''d love to help them out.'),
  ('00000000-0000-4000-a000-000000000008', 'Marcus Johnson', 'post_showing', 'Post-showing follow-up', 'Marcus toured 3 condos on Feb 10. Follow up on his favorites.', '2026-02-11', 'completed', 'high', NULL);
