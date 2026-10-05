-- Seed data generated from src/data/*. Safe to re-run: existing rows are left untouched.

insert into public.categories (id, label, position) values
  ('cleansers', 'Cleansers', 0),
  ('serums', 'Serums', 1),
  ('moisturizers', 'Moisturizers', 2),
  ('oils', 'Oils', 3)
on conflict (id) do nothing;

insert into public.products (id, slug, name, subtitle, category, price, badge, rating, reviews, stock, image, gallery, status, featured, description, ingredients, size) values
  ('p1', 'barrier-repair-serum', 'Barrier Repair Serum', 'Ceramides + Niacinamide 5%', 'serums', 42, 'New', 4.5, 162, 48, '/images/serum.jpg', '["/images/serum.jpg","/images/lifestyle-1.jpg","/images/lifestyle-2.jpg"]'::jsonb, 'active', true, 'A lightweight serum that restores the skin barrier with ceramides and 5% niacinamide. Calms redness and visibly improves texture in two weeks.', '["Ceramide NP","Niacinamide 5%","Panthenol","Squalane"]'::jsonb, '30 ml'),
  ('p2', 'cloud-cleanser', 'Cloud Cleanser', 'Amino Acid Gel', 'cleansers', 22, 'pH 5.5', 4.8, 311, 120, '/images/cleanser.jpg', '["/images/cleanser.jpg","/images/cleanse.jpg","/images/lifestyle-2.jpg"]'::jsonb, 'active', true, 'A pH-balanced gel cleanser that lifts impurities without stripping. Leaves skin soft, never tight.', '["Coco-glucoside","Glycerin","Aloe vera","Green tea"]'::jsonb, '150 ml'),
  ('p3', 'dew-moisture-cream', 'Dew Moisture Cream', 'Ceramide-rich hydration', 'moisturizers', 38, '', 4.6, 204, 64, '/images/cream.jpg', '["/images/cream.jpg","/images/nourish.jpg","/images/lifestyle-2.jpg"]'::jsonb, 'active', false, 'A cushiony daily moisturizer with ceramides and hyaluronic acid for all-day barrier-supporting hydration.', '["Ceramide AP","Hyaluronic acid","Shea butter","Oat extract"]'::jsonb, '50 ml'),
  ('p4', 'radiance-treatment-serum', 'Radiance Treatment Serum', 'Vitamin C + Botanical Blend', 'serums', 54, 'Bestseller', 4.7, 428, 9, '/images/radiance.jpg', '["/images/radiance.jpg","/images/lifestyle-2.jpg","/images/lifestyle-2.jpg"]'::jsonb, 'active', true, 'A stabilised vitamin C serum with botanical extracts to brighten dullness and even tone.', '["Ascorbyl glucoside","Rosehip","Ferulic acid","Licorice root"]'::jsonb, '30 ml'),
  ('p5', 'hydra-restore-essence', 'Hydra Restore Essence', 'Hyaluronic acid + Aloe', 'serums', 29, '', 4.4, 97, 80, '/images/essence.jpg', '["/images/essence.jpg","/images/hydrate.jpg","/images/lifestyle-2.jpg"]'::jsonb, 'active', false, 'A weightless essence that floods skin with multi-weight hyaluronic acid.', '["Hyaluronic acid","Aloe vera","Betaine","Cucumber extract"]'::jsonb, '100 ml'),
  ('p6', 'botanical-face-oil', 'Botanical Face Oil', 'Jojoba + Rosehip + Bakuchiol', 'oils', 46, 'New', 4.9, 76, 0, '/images/oil.jpg', '["/images/oil.jpg","/images/lifestyle-1.jpg","/images/lifestyle-2.jpg"]'::jsonb, 'active', false, 'A silky blend of cold-pressed oils with bakuchiol, a gentle plant alternative to retinol.', '["Jojoba oil","Rosehip oil","Bakuchiol","Vitamin E"]'::jsonb, '30 ml'),
  ('p7', 'renewal-night-cream', 'Renewal Night Cream', 'Peptides + Botanical support', 'moisturizers', 58, '', 4.5, 133, 31, '/images/night.jpg', '["/images/night.jpg","/images/nourish.jpg","/images/lifestyle-2.jpg"]'::jsonb, 'draft', false, 'An overnight cream with peptides that supports skin renewal while you sleep.', '["Peptide complex","Squalane","Chamomile","Shea butter"]'::jsonb, '50 ml')
on conflict (id) do nothing;

insert into public.cms_documents (key, value) values
  ('sections', '[{"id":"hero","label":"Hero banner","visible":true},{"id":"manifesto","label":"Statement strip","visible":true},{"id":"collections","label":"Collections","visible":true},{"id":"featured","label":"Featured products","visible":true},{"id":"about","label":"About / our story","visible":true},{"id":"routine","label":"Routine steps","visible":true},{"id":"trust","label":"Trust highlights","visible":true},{"id":"testimonials","label":"Testimonials","visible":true},{"id":"journal","label":"Journal preview","visible":true},{"id":"contact","label":"Contact form","visible":true}]'::jsonb),
  ('hero', '{"eyebrow":"","primaryLabel":"Shop Now","primaryLink":"/shop","secondaryLabel":"Learn More","secondaryLink":"/#about","image":"https://images.unsplash.com/photo-1543366749-4dad497ea0a0?w=1471&q=80","alt":"Skincare model with dewy skin","title":"Natural Skincare","text":"Awaken your skin with gentle actives and nourishing oils. Formulated to restore barrier health and glow naturally."}'::jsonb),
  ('manifesto', '{"lines":["Refresh your skin,","love yourself,","renew your glow."],"images":["/images/model-serum.jpg","/images/model-mask.jpg","/images/leaf.jpg"]}'::jsonb),
  ('collections', '[{"id":"hydrate","title":"Hydrate & Restore","blurb":"Moisture-rich serums with hyaluronic acid","series":"Essential Hydration Collection","image":"/images/hydrate.jpg","category":"serums"},{"id":"cleanse","title":"Cleanse & Purify","blurb":"pH-balanced cleansers for sensitive skin","series":"Gentle Care Collection","image":"/images/cleanse.jpg","category":"cleansers"},{"id":"renew","title":"Renew & Repair","blurb":"Anti-aging actives with botanical support","series":"Advanced Renewal Series","image":"/images/renew.jpg","category":"serums"},{"id":"botanical","title":"Botanical Blend","blurb":"Nature-inspired actives for healthy glow","series":"Natural Radiance Collection","image":"/images/botanical.jpg","category":"oils"},{"id":"nourish","title":"Nourish & Protect","blurb":"Rich moisturizers with barrier protection","series":"Barrier Repair Collection","image":"/images/nourish.jpg","category":"moisturizers"}]'::jsonb),
  ('menu', '[{"id":"cleansers","title":"Refresh: Cleansers","blurb":"pH-balanced, non‑stripping","image":"/images/cleanser.jpg","category":"cleansers"},{"id":"serums","title":"Treat: Serums","blurb":"Actives that respect your barrier","image":"/images/serum.jpg","category":"serums"},{"id":"moisturizers","title":"Nourish: Moisturizers","blurb":"Ceramide-rich hydration","image":"/images/cream.jpg","category":"moisturizers"}]'::jsonb),
  ('about', '{"eyebrow":"Our story","title":"Skincare that respects your skin","text":["Benlle began with a simple question: why do effective formulas have to be harsh? We pair clinically proven botanicals with barrier-friendly actives, so skin gets stronger, calmer and clearer.","Every formula is dermatologist tested, vegan, and packaged in recyclable glass."],"image":"/images/about.jpg","stats":[{"value":"98%","label":"felt calmer skin in 2 weeks*"},{"value":"12","label":"clinical studies"},{"value":"100%","label":"recyclable packaging"}],"note":"*Consumer study, 112 participants, 14 days."}'::jsonb),
  ('routine', '{"eyebrow":"The routine","title":"Three steps. Nothing more.","text":"A good routine is one you will actually do. Skin renews roughly every 28 days, so give it a month.","steps":[{"title":"Cleanse","text":"Lukewarm water and a gentle, pH-balanced gel. Skin should feel soft, never squeaky.","category":"cleansers","cta":"Shop cleansers"},{"title":"Treat","text":"A serum matched to your main concern, whether that is barrier, hydration or glow.","category":"serums","cta":"Shop serums"},{"title":"Nourish","text":"Finish with a rich moisturizer to seal everything in, and sunscreen by day.","category":"moisturizers","cta":"Shop moisturizers"}]}'::jsonb),
  ('navigation', '[{"label":"Shop","to":"/shop","dropdown":false},{"label":"About","to":"/#about","dropdown":false},{"label":"Contact","to":"/#contact","dropdown":false},{"label":"Collections","to":"/#collections","dropdown":true},{"label":"Journal","to":"/journal","dropdown":false}]'::jsonb),
  ('copy', '{"collectionsTitle":"Explore collections","collectionsText":"Targeted routines for every skin goal.","featuredTitle":"Featured products","featuredText":"Thoughtful formulas, consciously packaged.","journalTitle":"From the journal","contactTitle":"Get in touch","contactText":"Questions about a product or your routine? Our skin advisors reply within a day.","newsletterTitle":"Stay in the glow","newsletterText":"Routines, launches and 10% off your first order."}'::jsonb),
  ('brand', '{"accent":"#10b981"}'::jsonb),
  ('trust', '[{"icon":"Leaf","title":"Clinically proven botanicals","text":"Every active is backed by independent clinical data."},{"icon":"Recycle","title":"Sustainably packaged","text":"Recyclable glass and refillable pumps."},{"icon":"ShieldCheck","title":"Dermatologist tested","text":"Gentle on even the most sensitive skin."},{"icon":"Truck","title":"Free shipping over $60","text":"Carbon-neutral delivery worldwide."}]'::jsonb),
  ('testimonials', '[{"id":"t1","name":"Amara O.","text":"My skin has never felt calmer. The barrier serum is a staple.","rating":5},{"id":"t2","name":"Lena K.","text":"Cloud Cleanser is the first cleanser that does not leave me tight.","rating":5},{"id":"t3","name":"Mateo R.","text":"Simple, effective, and the packaging is gorgeous.","rating":4}]'::jsonb),
  ('settings', '{"name":"Benlle","tagline":"Botanical · Clinical · Kind","description":"Natural skincare crafted with clinically proven botanicals. Gentle, effective, and sustainable.","announcements":["Free shipping on orders over $60","New: Barrier Repair Serum 2.0 is here"],"freeShippingThreshold":60,"shippingFlat":6,"contact":{"email":"hello@benlle.example","phone":"+1 (555) 010-2030"}}'::jsonb)
on conflict (key) do nothing;

insert into public.journal_posts (id, slug, title, excerpt, category, image, date, read_time, published, body) values
  ('j1', 'rebuild-a-stressed-skin-barrier', 'How to rebuild a stressed skin barrier', 'Redness, tightness and stinging are often barrier signals, not skin types.', 'Skin science', '/images/journal-barrier.jpg', '2026-09-12', 6, true, '["Your skin barrier is a thin layer of lipids and cells that keeps moisture in and irritants out. When it is compromised, skin feels tight, looks red and reacts to products it used to tolerate.","Start by simplifying. Pause exfoliating acids and strong actives for two weeks, and use a pH-balanced cleanser that does not leave skin squeaky.","Then rebuild. Ceramides, cholesterol and fatty acids replace what is missing, while niacinamide supports the skin''s own lipid production. Layer a serum under a rich moisturizer morning and night.","Most people see calmer, more comfortable skin in about two weeks. Reintroduce actives one at a time, slowly."]'::jsonb),
  ('j2', 'niacinamide-explained', 'Niacinamide, explained simply', 'One of the most studied ingredients in skincare, and what it actually does.', 'Ingredients', '/images/journal-niacinamide.jpg', '2026-08-28', 4, true, '["Niacinamide is a form of vitamin B3. It is well tolerated, works for nearly every skin type and has clinical data behind it.","At around 5% it helps regulate oil, soften the look of pores, calm redness and support the skin barrier.","It pairs well with almost everything, including vitamin C, ceramides and hyaluronic acid. Use it once or twice daily after cleansing."]'::jsonb),
  ('j3', 'slower-morning-routine', 'A slower morning routine in three steps', 'Cleanse, treat, protect. Nothing more is needed.', 'Routine', '/images/journal-routine.jpg', '2026-08-05', 5, true, '["A good routine is one you will actually do. Three steps are enough: cleanse, treat, nourish.","Cleanse with lukewarm water and a gentle gel. Treat with a serum matched to your main concern. Finish with a moisturizer and sunscreen.","Give it a month before judging results. Skin renews roughly every 28 days, so patience is part of the routine."]'::jsonb)
on conflict (id) do nothing;

insert into public.media_assets (url) values
  ('https://images.unsplash.com/photo-1543366749-4dad497ea0a0?w=1471&q=80'),
  ('/images/serum.jpg'),
  ('/images/cleanser.jpg'),
  ('/images/cream.jpg'),
  ('/images/radiance.jpg'),
  ('/images/essence.jpg'),
  ('/images/oil.jpg'),
  ('/images/night.jpg'),
  ('/images/hydrate.jpg'),
  ('/images/cleanse.jpg'),
  ('/images/renew.jpg'),
  ('/images/botanical.jpg'),
  ('/images/nourish.jpg'),
  ('/images/model-serum.jpg'),
  ('/images/model-mask.jpg'),
  ('/images/leaf.jpg'),
  ('/images/journal-barrier.jpg'),
  ('/images/journal-niacinamide.jpg'),
  ('/images/journal-routine.jpg'),
  ('/images/lifestyle-1.jpg'),
  ('/images/lifestyle-2.jpg'),
  ('/images/about.jpg')
on conflict (url) do nothing;
