require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const mysql = require('mysql2');
const http = require('http');
const WebSocket = require('ws');

const app = express();
// Kita buat server HTTP terpisah agar bisa di-bridge ke WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
// 1.5 INISIALISASI TABEL LOG (OTOMATIS DIBUAT JIKA BELUM ADA)
// =================================================================
db.query(`CREATE TABLE IF NOT EXISTS pakan_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50),
    jenis_trigger VARCHAR(50),
    jumlah_gram INT,
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error('❌ Gagal membuat tabel pakan_logs:', err);
    else console.log('✅ Tabel pakan_logs siap');
});

db.query(`CREATE TABLE IF NOT EXISTS device_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50),
    status VARCHAR(50),
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error('❌ Gagal membuat tabel device_logs:', err);
    else console.log('✅ Tabel device_logs siap');
});

// Fungsi Helper untuk mendeteksi event pakan/stok dan mencatatnya ke log
const checkAndLogEvents = (deviceId, newData) => {
    const prevData = currentData[deviceId] || {};

    if (!newData) return;

    // --- OVERRIDE STATUS DARI MEMORI HARIAN (AGAR TIDAK KEMBALI "BELUM") ---
    if (prevData.memoriSudahPagi) newData.sudahPakan1 = 1;
    if (prevData.memoriSudahSore) newData.sudahPakan2 = 1;

    // 1. Cek Jadwal Pagi (berubah dari belum -> sudah)
    const newPagi = newData.sudahPakan1 === 1 || newData.sudahPakan1 === true;
    const prevPagi = prevData.sudahPakan1 === 1 || prevData.sudahPakan1 === true;
    if (newPagi && !prevPagi) {
        db.query('INSERT INTO pakan_logs (device_id, jenis_trigger, jumlah_gram) VALUES (?, ?, (SELECT gram_pagi FROM Pakan WHERE device_id = ? LIMIT 1))', [deviceId, 'Jadwal Pagi', deviceId]);

        if (currentData[deviceId]) currentData[deviceId].memoriSudahPagi = true;

        console.log(`📝 Log Event: ${deviceId} berhasil diberi pakan (Jadwal Pagi)`);
    }

    // 2. Cek Jadwal Sore (berubah dari belum -> sudah)
    const newSore = newData.sudahPakan2 === 1 || newData.sudahPakan2 === true;
    const prevSore = prevData.sudahPakan2 === 1 || prevData.sudahPakan2 === true;
    if (newSore && !prevSore) {
        db.query('INSERT INTO pakan_logs (device_id, jenis_trigger, jumlah_gram) VALUES (?, ?, (SELECT gram_sore FROM Pakan WHERE device_id = ? LIMIT 1))', [deviceId, 'Jadwal Sore', deviceId]);

        if (currentData[deviceId]) currentData[deviceId].memoriSudahSore = true;
        console.log(`📝 Log Event: ${deviceId} berhasil diberi pakan (Jadwal Sore)`);
    }

    // 3. Cek Stok Pakan (IR Sensor mendeteksi habis)
    const newKosong = newData.pakanKosong === 1 || newData.pakanKosong === true;
    const prevKosong = prevData.pakanKosong === 1 || prevData.pakanKosong === true;
    if (newKosong && !prevKosong) {
        db.query('INSERT INTO device_logs (device_id, status) VALUES (?, ?)', [deviceId, 'STOK PAKAN HABIS']);
        console.log(`🚨 Log Event: Stok pakan habis pada ${deviceId}`);
    }
};

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
        flow1: 12.5, flow2: 8.0, flow3: 4.2, flow4: 12.0,
        lastUpdated: Date.now()
    }
};

// JALUR TOL HTTP CLOUDFLARE (BUAT ESP32)
app.post('/api/sensor/update', (req, res) => {
    const { deviceId, data } = req.body;

    if (!currentData[deviceId]) {
        currentData[deviceId] = { suhu: 0, ph: 7.0, do: 0, tds: 0, flow1: 0, flow2: 0, lastUpdated: Date.now() };
    }

    if (data && data.ph !== undefined) {
        if (data.ph < 4.0 || data.ph > 9.0) {
            // Anomali terdeteksi: abaikan data baru, pakai data terakhir yang valid
            data.ph = currentData[deviceId].ph;
        }
    }

    console.log(`📥 Data HTTP Masuk [${deviceId}]:`, data);

    // --- CEK DAN CATAT LOG EVENT (JADWAL & STOK) ---
    checkAndLogEvents(deviceId, data);

    currentData[deviceId] = { ...currentData[deviceId], ...data, lastUpdated: Date.now() };

    const sql = `INSERT INTO sensor_logs (device_id, suhu, ph, do_level, tds, flow1, flow2) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        deviceId, data.suhu, data.ph, data.do, data.tds,
        data.flow1, data.flow2
    ];

    db.query(sql, values, (err) => {
        if (err) console.error(`❌ Gagal log HTTP [${deviceId}]:`, err.message);
    });

    const sql2 = 'SELECT * FROM Pakan WHERE device_id = ?;';
    db.query(sql2, [deviceId], (err, result) => {
        if (err) {
            console.error(`❌ Gagal mengambil data pakan:`, err);
            return res.json({ success: true, message: "Data tersimpan, tapi gagal ambil pakan", data_pakan: null });
        }

        console.log(`Data pakan dari DB [${deviceId}]:`, result);

        let datapakan;
        if (result && result.length > 0) {
            // Simpan datanya dulu untuk dikirim ke ESP32
            datapakan = result[0];
        }

        db.query('SELECT * FROM Pakan WHERE device_id = ?;', [deviceId], (err, result) => {
            if (err || result.length === 0) {
                return res.json({ success: true, data_pakan: null });
            }

            res.json({ success: true, message: "Data Berhasil tersimpan 123", data_pakan: datapakan });
        });
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
            currentData[deviceId] = { suhu: 0, ph: 7.0, do: 0, tds: 0, flow1: 0, flow2: 0, flow3: 0, flow4: 0, pakansekarang: 0, lastUpdated: Date.now() };
        }

        if (data && data.ph !== undefined) {
            if (data.ph < 4.0 || data.ph > 9.0) {
                // Anomali terdeteksi: abaikan data baru, pakai data terakhir yang valid
                data.ph = currentData[deviceId].ph;
            }
        }

        // --- CEK DAN CATAT LOG EVENT (JADWAL & STOK) ---
        checkAndLogEvents(deviceId, data);

        currentData[deviceId] = { ...currentData[deviceId], ...data, lastUpdated: Date.now() };

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
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                console.error(`❌ Gagal: Device ID [${device_id}] sudah ada.`);
                return res.status(400).json({ success: false, message: 'ID Perangkat sudah terdaftar atau sedang digunakan!' });
            }
            // Kalau error database lain:
            return res.status(500).json({ success: false, message: err.message });
        }

        currentData[device_id] = { suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, flow3: 0, flow4: 0 };
        res.json({ success: true, message: "Perangkat berhasil didaftarkan" });
    });
});

app.get('/api/sensor/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;

    // Jika data di memori sudah ada dan valid, langsung kembalikan
    if (currentData[deviceId] && currentData[deviceId].lastUpdated) {
        return res.json(currentData[deviceId]);
    }

    // Jika memori kosong (misal karena backend baru restart), ambil 1 data terakhir dari database!
    db.query('SELECT * FROM sensor_logs WHERE device_id = ? ORDER BY id DESC LIMIT 1', [deviceId], (err, results) => {
        if (err || results.length === 0) {
            return res.json(currentData[deviceId] || { suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, flow3: 0, flow4: 0 });
        }

        const row = results[0];
        // Masukkan data terakhir dari database ke memori agar alat tidak dikira 0
        currentData[deviceId] = {
            ...currentData[deviceId],
            suhu: row.suhu,
            ph: row.ph,
            do: row.do,
            tds: row.tds,
            flow1: row.flow1,
            flow2: row.flow2,
            flow3: row.flow3,
            flow4: row.flow4,
            // Konversi format waktu MySQL ke timestamp js (Pastikan timezone +07:00 / WIB)
            lastUpdated: row.waktu ? new Date(row.waktu.replace(' ', 'T') + '+07:00').getTime() : Date.now()
        };

        res.json(currentData[deviceId]);
    });
});

app.get('/api/history/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    const dateFilter = req.query.date;

    let sql = 'SELECT * FROM sensor_logs WHERE device_id = ?';
    let params = [deviceId];

    if (dateFilter) {
        sql += ' AND DATE(waktu) = ?';
        params.push(dateFilter);
    }

    sql += ' ORDER BY id DESC LIMIT 400';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/pakan/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;

    db.query('SELECT * FROM Pakan WHERE device_id = ?;', [deviceId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.json({ device_id: deviceId, pagi: '08:00', sore: '16:00', sekarang: 0, gram_pagi: 70, gram_sore: 70, gram_manual: 70 });
        }
    });
});


// =================================================================
// 5. JALUR KONTROL AUTO-FEEDER (DARI WEB KE ALAT)
// =================================================================
app.post('/api/feeder/schedule', (req, res) => {
    const { deviceId, jadwalPagi, jadwalSore, gramPagi, gramSore } = req.body;

    const payload = JSON.stringify({
        perintah: "SET_JADWAL",
        pagi: jadwalPagi,
        sore: jadwalSore
    });

    const topic = `aquasafe/kontrol/${deviceId}/feeder`;

    mqttClient.publish(topic, payload, (err) => {
        if (err) {
            console.error('❌ Gagal ngirim jadwal MQTT:', err);
            return res.status(500).json({ success: false, message: 'Gagal ngirim ke alat' });
        }

        // LOGIKA: Cek dulu datanya ada atau kosong
        db.query('SELECT * FROM Pakan WHERE device_id = ?;', [deviceId], (checkErr, results) => {
            if (checkErr) {
                console.error('❌ Gagal cek tabel Pakan:', checkErr);
            } else if (results.length > 0) {
                // Kalau ada isinya, kita UPDATE
                db.query('UPDATE Pakan SET pagi = ?, sore = ?, gram_pagi = ? , gram_sore = ? WHERE device_id = ?;', [jadwalPagi, jadwalSore, gramPagi, gramSore, deviceId], (errUpdate) => {
                    if (errUpdate) console.error('❌ Gagal update DB:', errUpdate);
                });
            } else {
                // Kalau KOSONG, kita bikin baris BARU (INSERT)
                db.query('INSERT INTO Pakan (device_id, pagi, sore, sekarang, gram_pagi, gram_sore, gram_manual) VALUES (?, ?, ?, 0, ?, ?, 70)', [deviceId, jadwalPagi, jadwalSore, gramPagi, gramSore], (errInsert) => {
                    if (errInsert) console.error('❌ Gagal insert DB:', errInsert);
                });
            }
        });

        console.log(`✅ Jadwal Pakan terkirim via MQTT [${topic}]:`, payload);
        res.json({ success: true, message: 'Jadwal dan gram pakan berhasil di-set!' });
    });
});

app.post('/api/feeder/manual', (req, res) => {
    const { deviceId, action, gramManual } = req.body; // action: 1 (On) or 0 (Off)

    // Perintah manual feed ke ESP32
    const payload = JSON.stringify({
        perintah: action === 1 ? "BERI_MAKAN_SEKARANG" : "BERHENTI_MAKAN",
        sekarang: action,
        gram: gramManual
    });

    const topic = `aquasafe/kontrol/${deviceId}/feeder`;

    mqttClient.publish(topic, payload, (err) => {
        if (err) {
            console.error('❌ Gagal trigger manual feed MQTT:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengirim sinyal ke alat' });
        }

        // Update database jadi 1 atau 0 sesuai tombol yang dipencet
        db.query('UPDATE Pakan SET sekarang = ?, gram_manual = ? WHERE device_id = ?;', [action, gramManual, deviceId], (err) => {
            if (err) console.error(err);
        });

        // Catat ke Log Pakan Riwayat Manual
        if (action === 1) {
            db.query('INSERT INTO pakan_logs (device_id, jenis_trigger, jumlah_gram) VALUES (?, ?, ?)', [deviceId, 'Manual (Aplikasi)', gramManual]);
            console.log(`📝 Log Event: ${deviceId} diberi pakan MANUAL sebanyak ${gramManual}g`);
        }

        console.log(`✅ Sinyal Manual Feed (${action}) terkirim via MQTT [${topic}]`);
        res.json({ success: true, message: action === 1 ? 'Alat MENYALA!' : 'Alat BERHENTI!' });
    });
});


// =================================================================
// 6. BACKGROUND JOB: MENGHITUNG RATA-RATA 24 JAM
// =================================================================
// Fungsi ini berjalan diam-diam setiap 1 menit untuk merekap nilai rata-rata tiap device
const runBackgroundJob = () => {
    // --- SYNC MEMORI HARIAN DARI DATABASE (Mengatasi restart & reset jam 00:00) ---
    db.query('SELECT device_id, jenis_trigger FROM pakan_logs WHERE DATE(waktu) = CURDATE()', (err, results) => {
        if (!err) {
            // Reset memori harian terlebih dahulu (saat pergantian hari jam 00:00)
            Object.keys(currentData).forEach(id => {
                currentData[id].memoriSudahPagi = false;
                currentData[id].memoriSudahSore = false;
            });
            // Timpa memori dengan data aktual dari database hari ini
            results.forEach(row => {
                if (!currentData[row.device_id]) {
                    currentData[row.device_id] = {};
                }
                if (row.jenis_trigger === 'Jadwal Pagi') {
                    currentData[row.device_id].memoriSudahPagi = true;
                    currentData[row.device_id].sudahPakan1 = 1;
                }
                if (row.jenis_trigger === 'Jadwal Sore') {
                    currentData[row.device_id].memoriSudahSore = true;
                    currentData[row.device_id].sudahPakan2 = 1;
                }
            });
        }
    });

    const deviceIds = Object.keys(currentData);
    if (deviceIds.length === 0) return;

    const currentTime = Date.now();

    deviceIds.forEach(deviceId => {
        const cData = currentData[deviceId];

        // --- CEK LOG OFFLINE / ONLINE ---
        if (cData.lastUpdated && (currentTime - cData.lastUpdated > 300000)) {
            // Alat terdeteksi mati (tidak ada kabar > 5 menit)
            if (!cData.isLoggedOffline) {
                db.query('INSERT INTO device_logs (device_id, status) VALUES (?, ?)', [deviceId, 'ALAT OFFLINE']);
                cData.isLoggedOffline = true;
                console.log(`🚨 Log Event: ${deviceId} OFFLINE`);
            }
        } else {
            // Alat aktif / baru saja update
            if (cData.isLoggedOffline) {
                db.query('INSERT INTO device_logs (device_id, status) VALUES (?, ?)', [deviceId, 'ALAT ONLINE KEMBALI']);
                cData.isLoggedOffline = false;
                console.log(`✅ Log Event: ${deviceId} ONLINE KEMBALI`);
            }
        }

        const query = `
            SELECT 
                AVG(suhu) as avg_suhu,
                AVG(ph) as avg_ph,
                AVG(do_level) as avg_do,
                AVG(tds) as avg_tds,
                AVG(flow1) as avg_flow1,
                AVG(flow2) as avg_flow2
            FROM sensor_logs 
            WHERE device_id = ? AND waktu >= NOW() - INTERVAL 24 HOUR
        `;
        db.query(query, [deviceId], (err, results) => {
            if (!err && results.length > 0 && currentData[deviceId]) {
                // Sisipkan data rata-rata langsung ke memory server
                currentData[deviceId].avg24h = results[0];
            }
        });
    });
};

setInterval(runBackgroundJob, 60000); // 60000 ms = 1 menit
setTimeout(runBackgroundJob, 2000); // Eksekusi awal 2 detik setelah server hidup

// =================================================================
// 7. SISTEM CCTV (WEBSOCKETS VIDEO STREAMING REAL-TIME)
// =================================================================
/*const viewers = new Set();

wss.on('connection', (ws, req) => {
    // Pintu masuk untuk ESP32-CAM
    if (req.url === '/api/stream/input') {
        console.log('🔗 [WebSockets] ESP32-CAM Terhubung! (Kamera Mengirim Video)');

        // Terima foto dari ESP32, langsung lempar ke semua layar React (Broadcast)
        ws.on('message', (message) => {
            for (let viewer of viewers) {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(message);
                }
            }
        });

        ws.on('close', () => console.log('❌ [WebSockets] ESP32-CAM Terputus!'));
    }
    // Pintu keluar untuk layar Web React
    else if (req.url === '/api/stream/output') {
        console.log('💻 [WebSockets] Layar React Web Terhubung! (Menonton Video)');
        viewers.add(ws);

        ws.on('close', () => {
            console.log('❌ [WebSockets] Layar React Web Terputus!');
            viewers.delete(ws);
        });
    }
    // Kalau ada yang nyoba nembak URL asal-asalan, tolak
    else {
        ws.close();
    }
});

*/
// PERHATIKAN: Sekarang kita pakai 'server.listen', BUKAN 'app.listen'
server.listen(PORT, () => {
    console.log(`🚀 Server Backend Multi-Device berjalan pada port ${PORT} (Dengan WebSockets)`);
});