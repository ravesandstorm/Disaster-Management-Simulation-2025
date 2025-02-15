document.addEventListener("DOMContentLoaded", () => {
    var truckTime = 0;
    const sendTruckEvery = 75;
    setInterval(() => {
        truckTime+=1;
        console.log(truckTime);
        // periodActions();
    }, 100);

    function pause(time){
        return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, time);
        });
    }
    const map = L.map("map").setView([21.2514, 81.6296], 12.4);
  
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);
  
    const raipurBoundary = [
      [21.20, 81.55],
      [21.20, 81.70],
      [21.30, 81.70],
      [21.30, 81.55]
    ];
    L.polygon(raipurBoundary, {
      color: "blue",
      opacity: 0.2,
      fillColor: "blue",
      fillOpacity: 0.1
    }).addTo(map);
  
    // Define major localities with an initial report count.
    const localities = [
      { name: "Pandri", lat: 21.2800, lng: 81.68, count: 0 },
      { name: "Naya Raipur", lat: 21.2100, lng: 81.6000, count: 0 },
      { name: "Aranya", lat: 21.2300, lng: 81.6600, count: 0 },
      { name: "Civil Lines", lat: 21.2750, lng: 81.59, count: 0 }
    ];
  
    let localityMarkers = {};
    localities.forEach(locality => {
      const marker = L.circleMarker([locality.lat, locality.lng], {
        radius: 8,
        color: "gray",
        fillColor: "gray",
        fillOpacity: 0.5
      }).addTo(map);
      marker.bindPopup(`${locality.name}: ${locality.count}`);
      localityMarkers[locality.name] = marker;
    });
  
    const warehouseLocation = [21.2514, 81.6296];
    const warehouseIcon = L.divIcon({
      html: '<div style="width:20px; height:20px; background-color: grey; border:2px solid black;"></div>',
      className: "",
      iconSize: [20, 20]
    });
    const warehouseMarker = L.marker(warehouseLocation, { icon: warehouseIcon }).addTo(map);

    let currentHighlightedLocality = null;
    let warehouseToLocalityLine = null;
    
    async function startAnim(coords){
        var coordinateArray = coords;
        var myPolyline = L.polyline(coordinateArray, {
            color: "red",
            opacity: 0.6
        });
        myPolyline.addTo(map);
        var myMovingMarker = L.animatedMarker(coordinateArray, 1000, {
            autostart: true
        });
        map.addLayer(myMovingMarker);

        console.log('started truck');
        await pause(25000);
        console.log('i have waited.');
        map.removeLayer(myPolyline);
        map.removeLayer(myMovingMarker);
        // PUT METHOD HERE
    }

    async function updateWarehouseToLocalityPath(locality) {
      let x = 4;
      while (warehouseToLocalityLine && x>0){
        map.removeLayer(warehouseToLocalityLine);
        x=x-3;
      }
      const result = await getRouteData(warehouseLocation[0], warehouseLocation[1], locality.lat, locality.lng);
      if (result) {
        // Note: OSRM returns coordinates as [longitude, latitude]. Convert each point to [latitude, longitude] for Leaflet.
        const routeCoordinates = result.geometry.map(coord => [coord[1], coord[0]]);

        warehouseToLocalityLine = L.polyline(routeCoordinates, {
          color: "blue",
          weight: 3,
          opacity: 0.3
        }).addTo(map);

        if(routeCoordinates && truckTime>sendTruckEvery){
            startAnim(routeCoordinates);
            truckTime=0;
        }
      }
    }
  
    //update sidebar display of locality counters.
    function updateLocalityDisplay() {
      const container = document.getElementById("locality-counters");
      if (container) {
        container.innerHTML = "";
        localities.forEach(locality => {
          const div = document.createElement("div");
          div.textContent = `${locality.name}: ${locality.count}`;
          container.appendChild(div);
        });
      }
    }
  
    // Function to update the styles and popup texts for locality markers.
    function updateLocalityMarkers() {
      let maxCount = Math.max(...localities.map(l => l.count));
      localities.forEach(locality => {
        const marker = localityMarkers[locality.name];
        if (locality.count === maxCount && maxCount > 0) {
          marker.setStyle({ color: "red", fillColor: "red", fillOpacity: 0.8 });
          marker.bindPopup(`${locality.name} is most affected! Count: ${locality.count}`);
          // Update highlighted locality and draw blue route if it changes.
          if (!currentHighlightedLocality || currentHighlightedLocality.name !== locality.name) {
            currentHighlightedLocality = locality;
            updateWarehouseToLocalityPath(locality);
          }
        } else {
          marker.setStyle({ color: "gray", fillColor: "gray", fillOpacity: 0.5 });
          marker.bindPopup(`${locality.name}: ${locality.count}`);
        }
      });
    }

    async function getRouteData(lat1, lon1, lat2, lon2) {
      const url = `https://router.project-osrm.org/route/v1/car/${lon1},${lat1};${lon2},${lat2}?steps=true&geometries=geojson`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === "Ok" && data.routes.length > 0) {
          const route = data.routes[0]; // take the most optimal route
          const geometry = route.geometry.coordinates; // the 2D array of coordinates
          const distance = route.distance; // total distance in meters
          return { geometry, distance };
        } else {
          throw new Error("No valid routes found");
        }
      } catch (err) {
        console.error("API Fetch Error:", err);
        return null;
      }

    }
  
    const socket = io("http://localhost:3000", { transports: ["websocket"] });
  
    socket.on("new-disaster", (report) => {
      const reportMarker = L.circleMarker([report.location.latitude, report.location.longitude], {
        radius: 5,
        color: "#000",
        fillColor: "#f00",
        fillOpacity: 0.7,
        weight: 1,
        opacity: 0.8
      }).addTo(map);
      reportMarker.bindPopup(
        `Victim: ${report.victimName}<br>
         Severity: ${report.severity}<br>
         Needs: ${report.needs.join(", ")}<br>
         Reported At: ${report.reportTime}`
      );
  
      // Calculate the nearest locality using a basic distance check.
      let closest = null;
      let minDistance = Infinity;
      localities.forEach(locality => {
        const dx = locality.lat - report.location.latitude;
        const dy = locality.lng - report.location.longitude;
        // CUSTOM HEURISTIC
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          closest = locality;
        }
      });
  
      if (closest) {
        // Draw a faint dashed line from the report point to the nearest locality.
        L.polyline([
          [report.location.latitude, report.location.longitude],
          [closest.lat, closest.lng]
        ], {
          color: "#aaa",
          weight: 1,
          opacity: 0.85,
          dashArray: "5,5"
        }).addTo(map);
  
        console.log(localities);

        // Increase the count for that locality and update marker styling.
        closest.count += 1;
        setInterval(() => {
            updateLocalityDisplay();
        }, 1000);
        updateLocalityMarkers();
      }

      const reportList = document.getElementById("report-list");
      const reportItem = document.createElement("div");
      reportItem.className = "report-item";
      reportItem.innerHTML = `<b>Victim:</b> ${report.victimName}<br>
       <b>Location:</b> (${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)})<br>
       <b>Severity:</b> <span class="severity-${report.severity.toLowerCase()}">${report.severity}</span>`;
      reportList.prepend(reportItem);
    });
  });
  