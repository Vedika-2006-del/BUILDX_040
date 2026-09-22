const NAGPUR={lat:21.1078,lng:79.0882};

function initMap(id){
  const el=document.getElementById(id);
  if(!el||typeof L==='undefined') return null;

  const map=L.map(id).setView([NAGPUR.lat,NAGPUR.lng],12);

  // No API key required for this demo basemap.
  // Uses Esri World Street Map tiles instead of CARTO/OSM public tiles.
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:'Tiles © Esri — Source: Esri, OpenStreetMap contributors, GIS User Community',
      maxZoom:19
    }
  ).addTo(map);

  const pts=[
    ['🚑 Ambulance',21.112,79.065],
    ['🏥 CityCare Trauma Center',21.132,79.083],
    ['🏥 Government Trauma Hospital',21.091,79.103],
    ['🩸 Blood Bank',21.125,79.055],
    ['🚨 Emergency • Khapri',21.067,79.083]
  ];

  pts.forEach(p=>{
    L.marker([p[1],p[2]]).addTo(map).bindPopup('<b>'+p[0]+'</b>');
  });

  return map;
}

document.addEventListener('DOMContentLoaded',()=>{
  window.maps={};

  ['liveMap','adminMap','trackingMap'].forEach(id=>{
    const m=initMap(id);
    if(m) window.maps[id]=m;
  });

  document.getElementById('centerMap')?.addEventListener(
    'click',
    ()=>window.maps.liveMap?.setView([21.1078,79.0882],13)
  );
});
