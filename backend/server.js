require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// =================================================================
// 1. KONEKSI KE DATABASE MYSQL (DOCKER)
// =================================================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

console.log('✅ Database MySQL Pool Siap Digunakan!');

// =================================================================
// 2. SISTEM AUTENTIKASI (SESUAI DATABASE ASLI)
// =================================================================

// JALUR REGISTER (DAFTAR)
app.post('/api/register', (req, res) => {
    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
        return res.status(400).json({ success: false, message: 'Nama, Email, & Password wajib diisi!' });
    }

    const sql = 'INSERT INTO users (nama, email, password) VALUES (?, ?, ?)';
    db.query(sql, [nama, email, password], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Berhasil daftar! Silakan login.' });
    });
});

// JALUR LOGIN (MASUK)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';

    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (results.length > 0) {
            res.json({
                success: true,
                message: 'Berhasil masuk!',
                userId: results[0].id,
                nama: results[0].nama
            });
        } else {
            res.status(401).json({ success: false, message: 'Email atau Password salah!' });
        }
    });
});

// =================================================================
// 3. MEMORI GLOBAL & JALUR SENSOR ESP32
// =================================================================
let currentData = {
    "AQUA-TEST": {
        suhu: 27.4, ph: 7.18, do: 8.5, tds: 440,
        flow1: 12.5, flow2: 8.0, flow3: 4.2, flow4: 12.0
    }
};

// JALUR TOL HTTP CLOUDFLARE (BUAT ESP32)
app.post('/api/sensor/update', (req, res) => {
    const { deviceId, data } = req.body;

    console.log(`📥 Data HTTP Masuk [${deviceId}]:`, data);

    if (!currentData[deviceId]) {
        currentData[deviceId] = { suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, flow3: 0, flow4: 0 };
    }

    currentData[deviceId] = { ...currentData[deviceId], ...data };

    const sql = `INSERT INTO sensor_logs (device_id, suhu, ph, do_level, tds, flow1, flow2, flow3, flow4) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        deviceId, data.suhu, data.ph, data.do, data.tds,
        data.flow1, data.flow2, data.flow3, data.flow4
    ];

    db.query(sql, values, (err) => {
        if (err) console.error(`❌ Gagal log HTTP [${deviceId}]:`, err.message);
    });

    const sql2 = 'SELECT pagi,sore,sekarang FROM Pakan LIMIT 1;';
    db.query(sql2, (err, result) => {
        if (err) {
            console.error(`❌ Gagal mengambil data pakan:`, err);
            return res.json({ success: true, message: "Data tersimpan, tapi gagal ambil pakan", data_pakan: null });
        }

        console.log("Data pakan dari DB:", result);

        let datapakan;
        if (result && result.length > 0) {
            // Simpan datanya dulu untuk dikirim ke ESP32
            datapakan = result[0];

            if (result[0].sekarang > 0) {
                // Hapus tanda tutup kurung yang salah sebelum koma, dan tambahkan di akhir
                db.query('UPDATE Pakan SET sekarang=0;', (err, updateResult) => {
                    if (err) {
                        console.error(`❌ Gagal set 0`, err);
                    }
                }); // <-- Tutup kurung yang benar ada di sini
            }
        }

        res.json({ success: true, message: "Data Berhasil tersimpan 123", data_pakan: datapakan });
    });
});

// JALUR MQTT LOKAL (CADANGAN)
const mqttClient = mqtt.connect('mqtt://100.64.178.105:1883');
mqttClient.on('connect', () => {
    console.log('✅ Terhubung ke MQTT Broker Lokal!');
    mqttClient.subscribe('aquasafe/data/+', (err) => {
        if (!err) console.log('📡 Menunggu aliran data MQTT...');
    });
});

mqttClient.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        const deviceId = topic.split('/')[2];

        if (!currentData[deviceId]) {
            currentData[deviceId] = { suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, flow3: 0, flow4: 0, pakansekarang: 0 };
        }

        currentData[deviceId] = { ...currentData[deviceId], ...data };



        const sql = `INSERT INTO sensor_logs (device_id, suhu, ph, do_level, tds, flow1, flow2, flow3, flow4) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [deviceId, currentData[deviceId].suhu, currentData[deviceId].ph, currentData[deviceId].do, currentData[deviceId].tds, currentData[deviceId].flow1, currentData[deviceId].flow2, currentData[deviceId].flow3, currentData[deviceId].flow4];

        db.query(sql, values, (err) => {
            if (err) console.error(`❌ Gagal mencatat log DB [${deviceId}]:`, err.message);
        });
    } catch (error) {
        console.error('❌ Kesalahan parsing JSON MQTT:', error.message);
    }
});

// =================================================================
// 4. ENDPOINT API UNTUK KONSUMSI FRONTEND (REACT)
// =================================================================

app.get('/api/devices/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT device_id, nama_kolam FROM devices WHERE user_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/status/all', (req, res) => {
    res.json(currentData);
});

app.post('/api/devices', (req, res) => {
    const { device_id, user_id, nama_kolam } = req.body;
    const sql = 'INSERT INTO devices (device_id, user_id, nama_kolam) VALUES (?, ?, ?)';

    db.query(sql, [device_id, user_id, nama_kolam], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        currentData[device_id] = { suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, flow3: 0, flow4: 0 };
        res.json({ success: true, message: "Perangkat berhasil didaftarkan" });
    });
});

app.get('/api/sensor/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    res.json(currentData[deviceId] || { suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, flow3: 0, flow4: 0 });
});

app.get('/api/history/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    db.query('SELECT * FROM sensor_logs WHERE device_id = ? ORDER BY id DESC LIMIT 15', [deviceId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/pakan', (req, res) => {
    // JANGAN UBAH INI JADI 'SELECT sekarang' KARENA REACT BUTUH KOLOM 'pagi' DAN 'sore'
    db.query('SELECT * FROM Pakan LIMIT 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.json({ pagi: '08:00', sore: '16:00', sekarang: 0 });
        }
    });
});


// =================================================================
// 5. JALUR KONTROL AUTO-FEEDER (DARI WEB KE ALAT)
// =================================================================
app.post('/api/feeder/schedule', (req, res) => {
    // Tangkap data dari web React
    const { deviceId = "AQUA-COBA1", jadwalPagi, jadwalSore } = req.body;

    // Bungkus datanya jadi JSON biar gampang dibaca ESP32
    const payload = JSON.stringify({
        perintah: "SET_JADWAL",
        pagi: jadwalPagi,
        sore: jadwalSore
    });

    // Bikin alamat topik khusus untuk alat tersebut
    const topic = `aquasafe/kontrol/${deviceId}/feeder`;

    // TERBANGKAN KE ESP32 LEWAT MQTT! 🚀
    mqttClient.publish(topic, payload, (err) => {
        if (err) {
            console.error('❌ Gagal ngirim jadwal MQTT:', err);
            return res.status(500).json({ success: false, message: 'Gagal ngirim ke alat' });
        }
        console.log(`✅ Jadwal Pakan terkirim via MQTT [${topic}]:`, payload);
        res.json({ success: true, message: 'Jadwal pakan berhasil di-set!' });
    });
});

app.post('/api/feeder/manual', (req, res) => {
    const { deviceId = "AQUA-COBA1", action } = req.body; // action: 1 (On) or 0 (Off)

    // Perintah manual feed ke ESP32
    const payload = JSON.stringify({
        perintah: action === 1 ? "BERI_MAKAN_SEKARANG" : "BERHENTI_MAKAN",
        sekarang: action
    });

    const topic = `aquasafe/kontrol/${deviceId}/feeder`;

    mqttClient.publish(topic, payload, (err) => {
        if (err) {
            console.error('❌ Gagal trigger manual feed MQTT:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengirim sinyal ke alat' });
        }

        // Update database jadi 1 atau 0 sesuai tombol yang dipencet
        db.query('UPDATE Pakan SET sekarang = ?', [action], (err) => {
            if (err) console.error(err);
        });

        console.log(`✅ Sinyal Manual Feed (${action}) terkirim via MQTT [${topic}]`);
        res.json({ success: true, message: action === 1 ? 'Alat MENYALA!' : 'Alat BERHENTI!' });
    });
});



app.listen(PORT, () => {
    console.log(`🚀 Server Backend Multi-Device berjalan pada port ${PORT}`);
});