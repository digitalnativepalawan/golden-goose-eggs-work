-- ═══════════════════════════════════════════════════════
-- SEED DATA WITH UNSPLASH PALAWAN IMAGES
-- Copy this into Supabase SQL editor and run.
-- ═══════════════════════════════════════════════════════

-- ── DESTINATIONS ──
UPDATE public.destinations SET
  image = 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80',
  images = '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80","https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"]'::jsonb
WHERE name ILIKE '%long beach%';

UPDATE public.destinations SET
  image = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  images = '["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80","https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80"]'::jsonb
WHERE name ILIKE '%boayan%' OR name ILIKE '%island%';

UPDATE public.destinations SET
  image = 'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b0f?w=800&q=80',
  images = '["https://images.unsplash.com/photo-1529914247497-d032997414d1?w=800&q=80"]'::jsonb
WHERE name ILIKE '%falls%' OR name ILIKE '%pamuayan%';

UPDATE public.destinations SET
  image = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  images = '["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"]'::jsonb
WHERE name ILIKE '%market%' OR name ILIKE '%poblacion%';

UPDATE public.destinations SET
  image = 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80',
  images = '["https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80","https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80"]'::jsonb
WHERE name ILIKE '%alimanguan%';

-- If no destinations exist yet, insert a few featured ones
INSERT INTO public.destinations (name, lat, lng, category, image, images, description, tip, color, featured, barangay, rating, travel, temp, season)
SELECT 'Long Beach', 10.2586, 119.2034, 'beach',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  '["https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80","https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"]'::jsonb,
  'The longest continuous beach in the Philippines at 14.7km of pristine white sand.',
  'Best visited at sunrise or late afternoon for golden hour photos.',
  '#0ea5e9', true, 'San Vicente', '4.8', '15 min drive', '28°C', 'Nov–May'
WHERE NOT EXISTS (SELECT 1 FROM public.destinations WHERE name = 'Long Beach');

INSERT INTO public.destinations (name, lat, lng, category, image, images, description, tip, color, featured, barangay, rating, travel, temp, season)
SELECT 'Port Barton', 10.4716, 119.2015, 'island',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
  '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80","https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80"]'::jsonb,
  'A sleepy fishing village turned backpacker haven with crystal clear waters.',
  'Rent a boat at the port for island hopping at 1500-2000 PHP.',
  '#22d3ee', true, 'Port Barton', '4.6', '2 hr drive', '29°C', 'Nov–May'
WHERE NOT EXISTS (SELECT 1 FROM public.destinations WHERE name = 'Port Barton');

INSERT INTO public.destinations (name, lat, lng, category, image, images, description, tip, color, featured, barangay, rating, travel, temp, season)
SELECT 'Pamuayan Falls', 10.3100, 119.2500, 'waterfall',
  'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b0f?w=800&q=80',
  '["https://images.unsplash.com/photo-1529914247497-d032997414d1?w=800&q=80"]'::jsonb,
  'A majestic 50-foot waterfall hidden in the jungle, perfect for a refreshing dip.',
  'Wear waterproof shoes. The trail can be slippery after rain.',
  '#34d399', true, 'Alimanguan', '4.5', '45 min trek', '26°C', 'Year-round'
WHERE NOT EXISTS (SELECT 1 FROM public.destinations WHERE name = 'Pamuayan Falls');

INSERT INTO public.destinations (name, lat, lng, category, image, images, description, tip, color, featured, barangay, rating, travel, temp, season)
SELECT 'Hidden Beach', 10.2200, 119.1800, 'beach',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
  '["https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80","https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80"]'::jsonb,
  'A secret stretch of powdery sand accessible only by boat.',
  'Ask locals at the barangay hall for boat hire. Bring your own food.',
  '#f59e0b', true, 'Alimanguan', '4.9', '30 min by boat', '30°C', 'Dec–Apr'
WHERE NOT EXISTS (SELECT 1 FROM public.destinations WHERE name = 'Hidden Beach');

-- ── TRIBES ──
INSERT INTO public.tribes (title, where_text, when_text, sub, thumb_url, images, video_url, video_type, joined, extra, cap, tags, sort_order)
VALUES
  ('Sunset Chasers', 'Long Beach', 'Today, 5:30 PM', 'Chasing the golden hour together 🌅',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
   '["https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80","https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"]'::jsonb,
   '', null, 8, 3, 12, ARRAY['sunset','beach','photography'], 1),
  ('Island Hopping', 'Port Barton', 'Tomorrow, 8:00 AM', 'Full day island hopping with lunch included 🚣',
   'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
   '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80","https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80"]'::jsonb,
   '', null, 5, 2, 10, ARRAY['island','hopping','snorkeling'], 2),
  ('Waterfall Trek', 'Pamuayan Falls', 'May 20, 7:00 AM', 'Jungle trek to the hidden waterfall 🌿',
   'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b0f?w=800&q=80',
   '["https://images.unsplash.com/photo-1529914247497-d032997414d1?w=800&q=80"]'::jsonb,
   '', null, 3, 1, 8, ARRAY['trek','waterfall','nature'], 3),
  ('Surf Session', 'Alimanguan Beach', 'May 21, 6:00 AM', 'Dawn patrol with local surf instructors 🏄',
   'https://images.unsplash.com/photo-1502680390548-bdbac40f733b?w=800&q=80',
   '["https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80"]'::jsonb,
   '', null, 6, 2, 6, ARRAY['surf','ocean','morning'], 4),
  ('Beach Cleanup', 'Long Beach', 'May 22, 4:00 PM', 'Give back to the beach that gives us so much 💚',
   'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
   '["https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80"]'::jsonb,
   '', null, 12, 5, 30, ARRAY['volunteer','beach','community'], 5);

-- ── EVENTS ──
INSERT INTO public.events (title, org, where_text, when_text, price, tags, images, video_url, video_type, sort_order)
VALUES
  ('Full Moon Party', 'Baybay Beach Club', 'Baybay, San Vicente', 'Tonight, 9:00 PM', 'Free entry',
   ARRAY['party','nightlife','moon'],
   '["https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80"]'::jsonb,
   '', null, 1),
  ('Acoustic Night', 'Poblacion Live', 'Poblacion Park, San Vicente', 'May 18, 7:30 PM', 'Free',
   ARRAY['music','acoustic','chill'],
   '["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80"]'::jsonb,
   '', null, 2),
  ('Island Hopping Festival', 'San Vicente Tourism', 'Port Barton', 'May 25, All Day', '500 PHP',
   ARRAY['festival','island','community'],
   '["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80","https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80","https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80"]'::jsonb,
   '', null, 3),
  ('Lechon Feast', 'Sunset Resort', 'Sunset Resort, San Vicente', 'May 20, 6:00 PM', '350 PHP',
   ARRAY['food','feast','lechon'],
   '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"]'::jsonb,
   '', null, 4),
  ('Sunset Yoga', 'Long Beach Wellness', 'Long Beach', 'Daily, 5:00 PM', '200 PHP',
   ARRAY['yoga','wellness','sunset'],
   '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"]'::jsonb,
   '', null, 5);

-- ── TODAY: HAPPENING EVENTS WITH IMAGES ──
INSERT INTO public.today_content (key, data) VALUES
  ('happening', '[
    {"title":"Sunset Sailing","place":"Long Beach","time":"5:00 PM","dist":"2km away","vibe":"Chill","images":["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80","https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80"]},
    {"title":"Beach Volleyball","place":"Alimanguan","time":"4:00 PM","dist":"5km away","vibe":"Active","images":["https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80"]},
    {"title":"Night Market","place":"Poblacion","time":"6:00 PM","dist":"1km away","vibe":"Foodie","images":["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"]},
    {"title":"Mangrove Tour","place":"Port Barton","time":"7:00 AM","dist":"8km away","vibe":"Nature","images":["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80"]},
    {"title":"Stargazing","place":"Hidden Beach","time":"8:30 PM","dist":"4km away","vibe":"Romantic","images":["https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80"]}
  ]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- ── TODAY: LOCAL TIPS WITH IMAGES ──
INSERT INTO public.today_content (key, data) VALUES
  ('locals', '[
    {"badge":"🍽️","biz":"Mama Zita''s","text":"Best sinigang in town. Ask for the marine fish version.","meta":"Open 7AM–9PM · Poblacion","images":["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"]},
    {"badge":"🏄","biz":"Wave Riders","text":"Surf lessons at 6AM, boards included. 500php/session.","meta":"Alimanguan Beach · Daily","images":["https://images.unsplash.com/photo-1502680390548-bdbac40f733b?w=800&q=80"]},
    {"badge":"💆","biz":"Island Spa","text":"Traditional hilot massage, beachside. Pure bliss.","meta":"Sunset Resort · 10AM–8PM","images":["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80"]},
    {"badge":"🥥","biz":"Coconut Joe","text":"Fresh buko juice, the best way to cool down.","meta":"Long Beach · All day","images":["https://images.unsplash.com/photo-1536663815808-535e8927b8df?w=800&q=80"]}
  ]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- ── MYSANVIC UPCOMING WITH IMAGES ──
INSERT INTO public.my_sanvic_upcoming (badge, badge_style, title, meta, cta, action, images, video_url, video_type, sort_order)
VALUES
  ('Today', 'solid', 'Sunset Chasers', '5:30 PM · Long Beach', 'Open Tribe Chat', 'tribe',
   '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80","https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80"]'::jsonb,
   '', null, 1),
  ('Today', 'solid', 'Lechon by the Beach', '6:00 PM · Sunset Resort', 'View Details', 'event',
   '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"]'::jsonb,
   '', null, 2),
  ('Tomorrow', 'solid', 'Island Hopping Tribe', '8:00 AM · Port Barton', 'Open Tribe Chat', 'tribe',
   '["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80","https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80"]'::jsonb,
   '', null, 3),
  ('May 18', 'soft', 'Acoustic Night', '7:30 PM · Poblacion', "I'm Interested", 'event',
   '["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80"]'::jsonb,
   '', null, 4),
  ('This Week', 'solid', 'Full Moon Party', '9:00 PM · Baybay Beach', 'View Details', 'event',
   '["https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80"]'::jsonb,
   '', null, 5);

-- ── HUNT REWARDS WITH IMAGES ──
INSERT INTO public.hunt_rewards (title, subtitle, badge, dest_id, images, video_url, video_type, points_required, sort_order)
VALUES
  ('Long Beach Explorer', 'Unlock Long Beach to earn this reward.', 'NEW', '',
   '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80","https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80"]'::jsonb,
   '', null, 100, 1),
  ('Island Hopper', 'Discover all islands near Port Barton.', 'SOON', '',
   '["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80","https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80"]'::jsonb,
   '', null, 200, 2),
  ('Waterfall Hunter', 'Find Pamuayan Falls.', '', '',
   '["https://images.unsplash.com/photo-1432405972618-c6b0cfba8b0f?w=800&q=80"]'::jsonb,
   '', null, 150, 3),
  ('Sunset Chaser', 'Watch sunset from 3 different spots.', 'HOT', '',
   '["https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80"]'::jsonb,
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 300, 4),
  ('Hidden Beach Seeker', 'Locate the secret beach.', 'LEGENDARY', '',
   '["https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80","https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80"]'::jsonb,
   '', null, 500, 5);
