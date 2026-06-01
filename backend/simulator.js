
const mqtt = require('mqtt');

// Kita numpang pakai server satelit gratis (Public Broker)
const client = mqtt.connect('mqtt://100.64.178.105:1883');

client.on('connect', () => {
    console.log('✅ Fake ESP32 Terhubung ke Satpam NUC!');

    // Kirim data setiap 3 detik biar grafiknya cepet gerak
    setInterval(() => {
        // Bikin data acak sesuai kebutuhan tabel sensor_logs lu
        const dataSensor = {
            suhu: +(26 + Math.random() * 5).toFixed(1),
            ph: +(6.5 + Math.random() * 1.5).toFixed(2),
            do: +(6 + Math.random() * 2).toFixed(1),
            tds: Math.floor(400 + Math.random() * 100),
            flow1: +(10 + Math.random() * 3).toFixed(1),
            flow2: +(8 + Math.random() * 2).toFixed(1),
            flow3: +(4 + Math.random() * 1).toFixed(1),
            flow4: +(10 + Math.random() * 2).toFixed(1)
        };

        // 2. NAMA TOPIK HARUS MATCH SAMA BACKEND (aquasafe/data/KTP_ALAT)
        const topic = 'aquasafe/data/AQUA-001';

        client.publish(topic, JSON.stringify(dataSensor));
        console.log(`[${new Date().toLocaleTimeString()}] 📤 Mengirim data ke AQUA-001:`, dataSensor);
    }, 3000);
});

client.on('error', (err) => {
    console.error('❌ Gagal connect ke MQTT:', err.message);
});