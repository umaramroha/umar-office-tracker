insert into organizations (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Umar Office')
on conflict do nothing;

insert into office_locations (organization_id, name, latitude, longitude, radius_meters)
values ('11111111-1111-1111-1111-111111111111', 'Head Office', 12.9716, 77.5946, 120);
