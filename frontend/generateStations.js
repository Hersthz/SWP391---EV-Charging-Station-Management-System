import fs from "fs";

function randomNearbyStations(centerLat, centerLng, count = 15) {
    const stations = [];
    for (let i = 0; i < count; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.04;
        const offsetLng = (Math.random() - 0.5) * 0.04;
        stations.push({
            id: i + 1,
            name: `Station #${i + 1}`,
            address: `Mock Address ${i + 1}`,
            latitude: centerLat + offsetLat,
            longitude: centerLng + offsetLng,
            status: Math.random() > 0.5 ? "Available" : "Occupied",
            offline: Math.random() > 0.8,
            live: true,
            power: "150kW • Fast",
            available: `${Math.floor(Math.random() * 8)}/8 Available`,
            connectors: ["CCS", "CHAdeMO"],
            price: "$0.50/kWh",
            updated: "Just now"
        });
    }
    return stations;
}


const data = randomNearbyStations(10.859793024118192, 106.78373298325317, 15);
fs.writeFileSync("stations.json", JSON.stringify(data, null, 2));
console.log("stations.json created!");