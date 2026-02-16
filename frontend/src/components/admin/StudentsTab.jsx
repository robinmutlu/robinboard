import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  FaDownload,
  FaExclamationTriangle,
  FaFileExcel,
  FaFileUpload,
  FaSearch,
  FaTrash,
  FaUserGraduate,
  FaUserPlus,
} from "react-icons/fa";

const normalizeRow = (row) => ({
  name: row["Ad Soyad"] || row["ad soyad"] || row.name || "",
  class: row["Sınıf"] || row["sınıf"] || row.class || "",
  birthDate: row["Doğum Tarihi"] || row["doğum tarihi"] || row.birthDate || "",
});

const StudentsTab = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStudent, setNewStudent] = useState({ name: "", class: "", birthDate: "" });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("/api/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newStudent.name || !newStudent.class || !newStudent.birthDate) {
      alert("Tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/students", newStudent);
      setNewStudent({ name: "", class: "", birthDate: "" });
      fetchStudents();
    } catch {
      alert("Ekleme hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const binaryData = loadEvent.target?.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      const formattedData = data.map(normalizeRow).filter((item) => item.name && item.class);

      if (formattedData.length === 0) {
        alert("Geçerli öğrenci satırı bulunamadı.");
        event.target.value = null;
        return;
      }

      if (!window.confirm(`${formattedData.length} öğrenci eklensin mi?`)) {
        event.target.value = null;
        return;
      }

      setLoading(true);
      try {
        await axios.delete("/api/students");
        await axios.post("/api/students", formattedData);
        alert("Liste yüklendi.");
        fetchStudents();
      } catch {
        alert("Liste yükleme hatası.");
      } finally {
        setLoading(false);
        event.target.value = null;
      }
    };

    reader.readAsBinaryString(file);
  };

  const downloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Ad Soyad": "Örnek İsim", "Sınıf": "9-A", "Doğum Tarihi": "15-04" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Öğrenciler");
    XLSX.writeFile(wb, "ornek_ogrenci_listesi.xlsx");
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Tüm liste silinsin mi?")) {
      return;
    }
    try {
      await axios.delete("/api/students");
      fetchStudents();
    } catch {
      alert("Silme hatası.");
    }
  };

  const handleDeleteOne = async (student) => {
    if (!window.confirm("Silinsin mi?")) {
      return;
    }

    if (!student?.id) {
      alert("Öğrenci kimliği bulunamadı. Listeyi yenileyip tekrar deneyin.");
      return;
    }

    try {
      await axios.delete(`/api/students/${student.id}`);
      await fetchStudents();
    } catch {
      alert("Silme hatası.");
    }
  };

  const filtered = students.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white lg:h-[calc(100vh-200px)] h-auto">
      <div className="lg:col-span-1 space-y-6 h-fit">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4 shadow-lg">
          <h3 className="font-bold text-lg text-blue-400 border-b border-gray-700 pb-2">
            <FaFileExcel /> Toplu İşlemler
          </h3>
          <button
            onClick={downloadSample}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 border border-gray-600 text-sm"
          >
            <FaDownload /> Örnek Şablon İndir
          </button>
          <input
            type="file"
            accept=".xlsx,.csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg"
          >
            <FaFileUpload /> Excel Yükle
          </button>
          <button
            onClick={handleDeleteAll}
            className="w-full bg-red-900/30 hover:bg-red-900/80 text-red-200 font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-red-900/50 text-sm"
          >
            <FaTrash /> TÜM LİSTEYİ SİL
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-emerald-400 border-b border-gray-700 pb-2">
            <FaUserPlus /> Hızlı Ekle
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newStudent.name}
              onChange={(event) => setNewStudent({ ...newStudent, name: event.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-emerald-500 outline-none"
              placeholder="Ad Soyad"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newStudent.class}
                onChange={(event) => setNewStudent({ ...newStudent, class: event.target.value })}
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-emerald-500 outline-none"
                placeholder="Sınıf"
              />
              <input
                type="text"
                value={newStudent.birthDate}
                onChange={(event) =>
                  setNewStudent({ ...newStudent, birthDate: event.target.value })
                }
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-emerald-500 outline-none"
                placeholder="Tarih (GG-AA)"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg shadow-lg mt-2"
            >
              {loading ? "..." : "EKLE"}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl h-[600px] lg:h-full">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h3 className="font-bold flex items-center gap-2 text-xl">
            <FaUserGraduate className="text-gray-500" /> Öğrenci Listesi
            <span className="bg-gray-800 px-3 py-1 rounded-full text-xs text-emerald-400 border border-gray-700">
              {students.length}
            </span>
          </h3>
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm focus:border-emerald-500 outline-none w-56"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {filtered.length > 0 ? (
            <table className="w-full text-left text-sm border-separate border-spacing-y-1">
              <thead className="text-gray-500 text-xs uppercase sticky top-0 bg-gray-900 z-10">
                <tr>
                  <th className="pb-2 pl-2">Ad Soyad</th>
                  <th className="pb-2">Sınıf</th>
                  <th className="pb-2">D. Tarihi</th>
                  <th className="pb-2 text-right pr-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => (
                  <tr
                    key={student.id || `${student.name}-${index}`}
                    className="bg-gray-800 hover:bg-gray-750 group rounded-lg"
                  >
                    <td className="p-3 rounded-l-lg font-medium">{student.name}</td>
                    <td className="p-3 text-emerald-400 font-bold">{student.class}</td>
                    <td className="p-3 text-gray-400">{student.birthDate}</td>
                    <td className="p-3 rounded-r-lg text-right">
                      <button
                        onClick={() => handleDeleteOne(student)}
                        className="text-red-500 hover:bg-red-500/10 p-2 rounded opacity-0 group-hover:opacity-100"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
              <FaExclamationTriangle className="text-4xl mb-2" />
              <p>Liste boş.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsTab;
