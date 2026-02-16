import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";

const Login = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/auth/status");
        if (res.data?.authenticated) {
          navigate("/admin/dashboard");
        }
      } catch {
        // Oturum kontrolü başarısız olsa bile giriş ekranı açılmalı.
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", { password });
      if (res.data?.success) {
        navigate("/admin/dashboard");
        return;
      }
      setError("Giriş başarısız.");
    } catch (err) {
      setError(err.response?.data?.message || "Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-600 p-4 rounded-full">
            <FaLock className="text-2xl" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Yönetici Girişi</h2>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-4 focus:border-emerald-500 outline-none text-center tracking-widest"
          placeholder="Şifreniz"
        />
        {error && <p className="text-red-500 text-center mb-4 text-sm font-bold">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-60"
        >
          {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
        </button>
      </form>
    </div>
  );
};

export default Login;
