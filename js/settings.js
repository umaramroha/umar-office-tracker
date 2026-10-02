UOT.loadOfficeLocation = async (orgId) => {
  const { data } = await sb.from('office_locations').select('*').eq('organization_id', orgId).maybeSingle();
  return data;
};

UOT.saveOfficeLocation = async (orgId, { name, latitude, longitude, radius_meters }) => {
  const existing = await UOT.loadOfficeLocation(orgId);
  if (existing) {
    const { error } = await sb.from('office_locations')
      .update({ name, latitude, longitude, radius_meters }).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from('office_locations')
      .insert({ organization_id: orgId, name, latitude, longitude, radius_meters });
    if (error) throw error;
  }
};

UOT.useMyLocation = async () => {
  const pos = await UOT.getPosition();
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
};
