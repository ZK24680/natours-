/* eslint-disable */

export const displayMap = locations => {
  var map = L.map('map', { zoomControl: false });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const points = [];
  locations.forEach((location, index) => {
    points.push([location.coordinates[1], location.coordinates[0]]);

    const markerIcon = L.icon({
      iconUrl: '/img/pin.png',
      iconSize: [32, 40],
      iconAnchor: [16, 45],
      popupAnchor: [0, -50]
    });

    L.marker([location.coordinates[1], location.coordinates[0]], {
      icon: markerIcon
    })
      .addTo(map)
      .bindPopup(`<p>Day ${location.day} : ${location.description}</p>`)
      .openPopup();
  });

  const bound = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bound);
  map.scrollWheelZoom.disable();
};
