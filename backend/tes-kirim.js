fetch('http://localhost:5000/api/sensor/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        deviceId: "AQUA-COBA1",
        data: { suhu: 28.5, ph: 7.2, do: 8.1, tds: 400, flow1: 10, flow2: 8, flow3: 5, flow4: 12, sekarang: 0 }
    })
})
    .then(response => response.json())
    .then(hasil => console.log("Balasan dari Server:", hasil))
    .catch(error => console.error("Waduh error:", error));
