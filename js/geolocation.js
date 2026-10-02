UOT.getPosition = (opts = {}) => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('Geolocation unsupported'));
  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true, timeout: 12000, maximumAge: 0, ...opts
  });
});

UOT.distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

UOT.insideGeofence = (pos, loc) => {
  const d = UOT.distanceMeters(pos.coords.latitude, pos.coords.longitude, loc.latitude, loc.longitude);
  return { inside: d <= loc.radius_meters, distance: Math.round(d) };
};
