import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCloudUploadAlt, FaPen, FaTrash, FaVideo } from "react-icons/fa";

const MediaTab = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await axios.get("/api/files");
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Dosyalar alınamadı", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTimeout(fetchFiles, 400);
    } catch {
      alert("Yükleme başarısız.");
    } finally {
      setUploading(false);
      event.target.value = null;
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm("Bu dosya silinsin mi?")) {
      return;
    }
    try {
      await axios.post("/api/files/delete", { filename });
      fetchFiles();
    } catch {
      alert("Silme işlemi başarısız.");
    }
  };

  const handleCaptionChange = async (filename, caption) => {
    try {
      await axios.post("/api/files/update", { filename, caption });
    } catch {
      alert("Altyazı kaydedilemedi.");
    }
  };

  return (
    <div className="space-y-8 text-white h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar">
      <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors group">
        <input
          type="file"
          id="fileUpload"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleUpload}
          disabled={uploading}
        />
        <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center">
          <FaCloudUploadAlt className="text-5xl text-gray-500 group-hover:text-emerald-500 mb-2 transition-colors" />
          <h3 className="font-bold text-xl">{uploading ? "Dosya yükleniyor..." : "Yeni Medya Yükle"}</h3>
          <p className="text-sm text-gray-400 mt-2">Resim (JPG, PNG) veya Video (MP4)</p>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex flex-col shadow-lg group relative"
            >
              <div className="h-40 bg-black flex items-center justify-center overflow-hidden relative">
                {file.type === "video" ? (
                  <>
                    <video src={file.url} className="w-full h-full object-cover opacity-80" muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="text-3xl text-white/50" />
                    </div>
                  </>
                ) : (
                  <img src={file.url} className="w-full h-full object-cover" alt={file.name} />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 hover:scale-110 transition-all shadow-xl"
                    title="Sil"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-2 bg-gray-900">
                <div className="flex items-center gap-2 bg-black rounded p-2 border border-gray-700">
                  <FaPen className="text-gray-500 text-xs" />
                  <input
                    type="text"
                    defaultValue={file.caption || ""}
                    onBlur={(event) => handleCaptionChange(file.name, event.target.value)}
                    placeholder="Altyazı ekle..."
                    className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-gray-600"
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 bg-gray-800 rounded-xl border border-gray-700 border-dashed">
            <p className="text-gray-400">Henüz dosya yüklenmemiş.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaTab;
