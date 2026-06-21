import React, { useState, useEffect } from 'react';
import { Droplets, Thermometer, Wind, Activity, Waves, RefreshCcw, FlaskConical, Leaf, Filter, LogOut } from 'lucide-react';

import Header from './components/Header';
import Overview from './components/Overview';
import DetailView from './components/DetailView';
import AddDeviceModal from './components/AddDeviceModal';
import Login from './components/Login';
import EmptyState from './components/EmptyState';
import CctvKolam from './components/cctvKolam';
import { X } from 'lucide-react';

export default function App() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || null);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Admin');
  const [selectedDevice, setSelectedDevice] = useState(() => localStorage.getItem('lastViewedDevice') || '');
  const [activeDetail, setActiveDetail] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sensorData, setSensorData] = useState({ suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, power: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [tableData, setTableData] = useState([]);
  const [allStatuses, setAllStatuses] = useState({});
  const [filterDate, setFilterDate] = useState(''); // <-- STATE FILTER TANGGAL UDAH ADA
  const [showCctvModal, setShowCctvModal] = useState(false);

  /// FUNGSI LOGOUT (KURAS MEMORI TOTAL)
  const handleLogout = () => {
    localStorage.removeItem('userId');
    //localStorage.removeItem('lastViewedDevice');
    localStorage.removeItem('userName');
    setUserId(null);
    setUserName('');
    setDevices([]);
    setSelectedDevice('');
    setSensorData({ suhu: 0, ph: 0, do: 0, tds: 0, flow1: 0, flow2: 0, power: true });
    setTableData([]);
  };

  const fetchDevices = () => {
    if (!userId) { setIsLoading(false); return; }
    fetch(`https://api.aquasafe.my.id/api/devices/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setDevices(data);
          const savedDevice = localStorage.getItem('lastViewedDevice');
          const deviceExists = data.some(d => d.device_id === savedDevice);
          setSelectedDevice(deviceExists ? savedDevice : data[0].device_id);
        } else {
          setDevices([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (userId) fetchDevices();
  }, [userId]);

  useEffect(() => {
    if (selectedDevice) localStorage.setItem('lastViewedDevice', selectedDevice);
  }, [selectedDevice]);

  useEffect(() => {
    if (!selectedDevice || !userId) return;
    const fetchData = () => {
      fetch(`https://api.aquasafe.my.id/api/sensor/${selectedDevice}`)
        .then(res => res.json())
        .then(data => {
          if (data.suhu !== undefined) {
            if (data.ph !== undefined) {
              if (data.ph < 4.0) data.ph = 4.0;
              else if (data.ph > 9.0) data.ph = 9.0;
            }
            setSensorData(data);
          }
        })
        .catch(err => console.error("Gagal memuat sensor:", err));

      // === UBAH JALUR FETCH HISTORY AGAR NGIRIM PARAMETER TANGGAL KE BACKEND ===
      const dateQuery = filterDate ? `?date=${filterDate}` : '';
      fetch(`https://api.aquasafe.my.id/api/history/${selectedDevice}${dateQuery}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map(row => {
              const dateObj = new Date(row.waktu);
              const isLive = isNaN(dateObj);

              // === PERUBAHAN 1: PECAH FORMAT TANGGAL & WAKTU ===
              const timeStr = isLive ? "Live" : dateObj.toLocaleTimeString('id-ID', { hour12: false });
              const dateStr = isLive ? "" : dateObj.toLocaleDateString('sv-SE'); // Format YYYY-MM-DD
              const fullTimeStr = isLive ? "Live" : `${dateStr} ${timeStr}`; // Gabungan buat DetailView

              let phClamped = row.ph || 0;
              if (phClamped < 4.0) phClamped = 4.0;
              else if (phClamped > 9.0) phClamped = 9.0;

              return {
                id: row.id,
                time: timeStr,
                date: dateStr, // Disimpen buat filter kalender
                fullTime: fullTimeStr, // Disimpen buat grafik detail
                temp: row.suhu?.toFixed(1) || "0.0",
                ph: phClamped.toFixed(2),
                flow: row.flow1?.toFixed(1) || "0.0",
                doVal: row.do_level || 0,
                tdsVal: row.tds || 0,
                f2: row.flow2 || 0,
              };
            });
            setTableData(formatted);
          }
        });

      fetch(`https://api.aquasafe.my.id/api/status/all`)
        .then(res => res.json())
        .then(data => setAllStatuses(data));
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [selectedDevice, userId, filterDate]); // <-- Tambahkan filterDate ke array dependensi agar fetch terpicu ulang saat ganti tanggal

  const handleAddNewDevice = (newDevice) => {
    fetch('https://api.aquasafe.my.id/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: newDevice.device_id, user_id: userId, nama_kolam: newDevice.nama_kolam })
    })
      .then(() => { fetchDevices(); setSelectedDevice(newDevice.device_id); setIsAddModalOpen(false); })
      .catch(err => console.error("Gagal menyimpan ke server:", err));
  };

  // === PERUBAHAN 2: LOGIKA FILTER DITAMBAH TANGGAL ===
  const filteredTableData = tableData.filter(row => {
    const matchSearch = row.fullTime.includes(searchQuery) || row.temp.includes(searchQuery);
    const matchDate = filterDate ? row.date === filterDate : true;
    return matchSearch && matchDate;
  });

  // === OTAK SATPAM ALARM DIPERBAIKI ===
  // Jika server tidak menerima update lebih dari 5 menit (300000 ms), anggap mati!
  const isMati = !sensorData?.lastUpdated || (Date.now() - sensorData.lastUpdated > 300000);
  const activeAlarms = [];

  if (isMati) {
    const lastUpdateDate = new Date(sensorData.lastUpdated);
    const timeStr = isNaN(lastUpdateDate) ? 'SEKARANG' : lastUpdateDate.toLocaleTimeString('id-ID', { hour12: false }).substring(0, 5);
    activeAlarms.push({ time: timeStr, msg: '🚨 PERANGKAT OFFLINE', type: 'critical' });
  } else {
    // Jika perangkat beneran terkoneksi dan ngalir data, baru satpamnya menyisir parameter!
    if (sensorData?.pakanKosong === 1) {
      activeAlarms.push({ time: 'SEKARANG', msg: '🚨 Segera Isi Ulang Stok Pakan!', type: 'critical' });
    }
    if (sensorData?.power === false) {
      activeAlarms.push({ time: 'SEKARANG', msg: 'PLN Terputus! Pakai Baterai.', type: 'critical' });
    }
    if (sensorData?.suhu > 30 || sensorData?.suhu < 24) {
      activeAlarms.push({ time: 'LIVE', msg: `Suhu Air Bahaya: ${sensorData.suhu}°C`, type: 'warning' });
    }
    if (sensorData?.ph > 8.0 || sensorData?.ph < 5.0) {
      activeAlarms.push({ time: 'LIVE', msg: `pH Level Bahaya: ${sensorData.ph}`, type: 'warning' });
    }
    if (sensorData?.do < 3.0) {
      activeAlarms.push({ time: 'LIVE', msg: `Oksigen (DO) Drop: ${sensorData.do} mg/L`, type: 'warning' });
    }
    if (sensorData?.tds > 1000 || sensorData?.tds < 300) {
      activeAlarms.push({ time: 'LIVE', msg: `TDS Nutrisi Bahaya: ${sensorData.tds} PPM`, type: 'warning' });
    }
    // Jika Flow air bernilai 0 atau di bawah 5.0, alarm langsung teriak mampet!
    if (sensorData?.flow1 < 5.0) {
      activeAlarms.push({ time: 'LIVE', msg: `Flow 1 Mampet/Mati: ${sensorData.flow1} L/m`, type: 'warning' });
    }
    if (sensorData?.flow2 < 5.0) {
      activeAlarms.push({ time: 'LIVE', msg: `Flow 2 Mampet/Mati: ${sensorData.flow2} L/m`, type: 'warning' });
    }
  }

  const getDetailConfig = (sensorName) => {
    const isSuhuBahaya = sensorData.suhu > 30 || (sensorData.suhu < 24 && sensorData.suhu !== 0) || !sensorData.suhu;
    const isPhBahaya = (sensorData.ph < 5.0 && sensorData.ph !== 0) || sensorData.ph > 8.0;
    const isDoBahaya = (sensorData.do < 3.0 && sensorData.do !== 0);
    const isTdsBahaya = (sensorData.tds < 300 && sensorData.tds !== 0) || sensorData.tds > 1000;
    const isFlow1Bahaya = (sensorData.flow1 < 5.0 && sensorData.flow1 !== 0) || !sensorData.flow1;
    const isFlow2Bahaya = (sensorData.flow2 < 5.0 && sensorData.flow2 !== 0);

    const getStyle = (isBahaya, normalColor, normalBg, normalBorder, normalHex) => {
      if (isBahaya) {
        return {
          color: 'text-red-400',
          bg: 'bg-red-950/80 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse',
          border: 'border-red-500/80',
          hex: '#ef4444'
        };
      }
      return { color: normalColor, bg: normalBg, border: normalBorder, hex: normalHex };
    };

    switch (sensorName) {
      case 'Suhu Air':
        return { val: sensorData.suhu, unit: '°C', ...getStyle(isSuhuBahaya, 'text-blue-400', 'bg-[#0f172a]', 'border-blue-900/50', '#60a5fa'), icon: <Thermometer />, desc: "Suhu air dipantau ketat untuk menjaga stabilitas." };
      case 'pH Level':
        return { val: sensorData.ph, unit: 'pH', ...getStyle(isPhBahaya, 'text-fuchsia-400', 'bg-[#1e112a]', 'border-fuchsia-900/50', '#e879f9'), icon: <FlaskConical />, desc: "Keseimbangan asam basa air krusial." };
      case 'O2 Terlarut':
        return { val: sensorData.do, unit: 'mg/L', ...getStyle(isDoBahaya, 'text-indigo-400', 'bg-[#16172e]', 'border-indigo-900/50', '#818cf8'), icon: <Wind />, desc: "Kadar oksigen terlarut (DO) yang esensial." };
      case 'TDS Nutrisi':
        return { val: sensorData.tds, unit: 'PPM', ...getStyle(isTdsBahaya, 'text-lime-400', 'bg-[#141f12]', 'border-lime-900/50', '#a3e635'), icon: <Leaf />, desc: "Total padatan terlarut sebagai indikator nutrisi." };
      case 'Flow 1':
        return { val: sensorData.flow1, unit: 'L/M', ...getStyle(isFlow1Bahaya, 'text-sky-400', 'bg-[#0c1e2e]', 'border-sky-900/50', '#38bdf8'), icon: <RefreshCcw />, desc: "Debit sirkulasi air utama." };
      case 'Flow 2':
        return { val: sensorData.flow2, unit: 'L/M', ...getStyle(isFlow2Bahaya, 'text-teal-400', 'bg-[#0d2222]', 'border-teal-900/50', '#2dd4bf'), icon: <Filter />, desc: "Kecepatan aliran pengolahan biofilter." };
      default:
        return { val: 0, unit: '', color: 'text-gray-400', bg: 'bg-[#131b2c]', border: 'border-gray-800', hex: '#9ca3af', icon: <Activity />, desc: "" };
    }
  };

  const sortedDevices = [...devices].sort((a, b) => {
    const getRank = (stat) => {
      // Peringkat 3 = Kuning (Bahaya), Peringkat 2 = Hijau (Normal), Peringkat 1 = Merah (Mati/Kosong)
      if (!stat || Object.keys(stat).length === 0) return 1; // Merah

      const isDeviceMati = !stat.lastUpdated || (Date.now() - stat.lastUpdated > 300000);
      if (isDeviceMati) return 1; // Merah

      // Cek apakah ada satupun sensor yang menyentuh batas bahaya
      const isSuhuBahaya = stat.suhu > 30 || (stat.suhu < 24 && stat.suhu !== 0);
      const isPhBahaya = (stat.ph < 5.0 && stat.ph !== 0) || stat.ph > 8.0;
      const isDoBahaya = stat.do < 3.0 && stat.do !== 0;
      const isTdsBahaya = (stat.tds < 300 && stat.tds !== 0) || stat.tds > 1000;
      const isFlow1Bahaya = stat.flow1 < 5.0 && stat.flow1 !== 0;
      const isFlow2Bahaya = stat.flow2 < 5.0 && stat.flow2 !== 0;

      if (isSuhuBahaya || isPhBahaya || isDoBahaya || isTdsBahaya || isFlow1Bahaya || isFlow2Bahaya) {
        return 3; // Kuning (Prioritas Tertinggi)
      }

      return 2; // Hijau (Aman/Normal)
    };

    return getRank(allStatuses[b.device_id]) - getRank(allStatuses[a.device_id]);
  });


  if (!userId) {
    return <Login onLogin={(id, nama) => {
      setUserId(id);
      setUserName(nama || 'Admin');
      localStorage.setItem('userId', id);
      if (nama) localStorage.setItem('userName', nama);
    }} />;
  }

  return (
    <div className="min-h-screen bg-[url('/background1.jpg')] bg-cover bg-fixed bg-center text-slate-100 font-sans overflow-x-hidden relative">

      {/* Overlay Gelap Kaca */}
      <div className="absolute inset-0 bg-[#030712]/90 backdrop-blur-md z-0 pointer-events-none fixed"></div>

      {/* Konten Utama Dasbor dibungkus relative z-10 */}
      <div className="relative z-10 p-4 md:p-8">
        <button
          onClick={handleLogout}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 bg-red-600/20 border border-red-500/30 text-red-400 p-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:bg-red-600 hover:text-white hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] hover:scale-105 backdrop-blur-md transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-semibold">
            <span className="pl-1 pr-2">Keluar</span>
          </span>
        </button>

        <Header
          devices={sortedDevices}
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
          sensorData={sensorData}
          activeAlarms={activeAlarms}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenCctvModal={() => setShowCctvModal(true)}
          allStatuses={allStatuses}
          userName={userName}
        />

        <AddDeviceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewDevice} />



        <main className="max-w-[1800px] mx-auto">
          {isLoading ? (
            <div className="min-h-[70vh] flex items-center justify-center text-slate-500">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : devices.length === 0 ? (
            <EmptyState onOpenAddModal={() => setIsAddModalOpen(true)} />
          ) : activeDetail === null ? (
            <Overview
              getDetailConfig={getDetailConfig}
              setActiveDetail={setActiveDetail}
              filteredTableData={filteredTableData}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeAlarms={activeAlarms}
              selectedDevice={selectedDevice}
              sensorData={sensorData}
              // === PERUBAHAN 4: NGIRIM PROPS KALENDER KE OVERVIEW ===
              filterDate={filterDate}
              setFilterDate={setFilterDate}
            />
          ) : (
            <DetailView
              activeDetail={activeDetail}
              setActiveDetail={setActiveDetail}
              detailData={getDetailConfig(activeDetail)}
              sensorData={sensorData} // 🔥 KIRIM DATA SENSOR (YANG ADA RATA-RATANYA)
              // === OTAK PEMILIH DATA GRAFIK (DINAMIS) ===
              chartData={tableData.slice(0, 15).reverse().map(d => {
                let chartVal = 0;
                if (activeDetail === 'Suhu Air') chartVal = parseFloat(d.temp);
                else if (activeDetail === 'pH Level') chartVal = parseFloat(d.ph);
                else if (activeDetail === 'O2 Terlarut') chartVal = parseFloat(d.doVal);
                else if (activeDetail === 'TDS Nutrisi') chartVal = parseFloat(d.tdsVal);
                else if (activeDetail === 'Flow 1') chartVal = parseFloat(d.flow);
                else if (activeDetail === 'Flow 2') chartVal = parseFloat(d.f2);

                return { time: d.fullTime, val: chartVal };
              })}
              selectedDevice={selectedDevice}
            />
          )}
        </main>

        {/* 🔥 MODAL CCTV (LIFTED TO APP.JSX) */}
        {showCctvModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f1a]/80 backdrop-blur-md px-4 animate-in fade-in duration-300">
            <div className="w-full max-w-3xl relative">
              {/* Tombol Close */}
              <button
                onClick={() => setShowCctvModal(false)}
                className="absolute -top-12 right-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-full p-2 transition-all hover:rotate-90 z-10 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <X size={20} />
              </button>

              {/* Komponen CCTV */}
              <CctvKolam />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}