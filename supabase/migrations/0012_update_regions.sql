-- Rename existing centers to their updated names/codes, and split Mindanao
-- into its two centers (Davao and Davao Oriental). Matched by the old code
-- so existing region_id references on course_offerings/events/profiles keep
-- pointing at the same row.

update regions set
  name = 'Central Visayas Pranic Healing and Training Center',
  code = 'Cebu'
where code = 'CENTRAL_VISAYAS';

update regions set
  name = 'Mindanao Pranic Healing and Training Center Davao',
  code = 'MPHTC DVO'
where code = 'MINDANAO';

update regions set
  name = 'North Luzon Pranic Healing and Training Center Cordillera Administrative Region',
  code = 'NLPHTC CAR'
where code = 'BAGUIO';

update regions set
  name = 'North Luzon Pranic Healing and Training Center La Union',
  code = 'NLPHTC LU'
where code = 'NORTH_LUZON';

update regions set
  name = 'South Luzon Pranic Healing and Training Center Laguna',
  code = 'SLPHTC Lag'
where code = 'SOUTH_LUZON';

-- National Capital Region keeps its existing name and NCR code as-is.

insert into regions (name, code, city, is_main_center)
values ('Mindanao Pranic Healing and Training Center Davao Oriental', 'MPHTC D.Or', 'Davao Oriental', false);
