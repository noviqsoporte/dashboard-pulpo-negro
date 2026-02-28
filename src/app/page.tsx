"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Contraseña incorrecta");
      }
    } catch (_err) {
      setError("Error de red");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-[#f1f1f4] font-[var(--font-dm-sans)]">
      <div className="w-full max-w-sm p-8 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="El Pulpo Negro Logo"
          width={120}
          height={120}
          className="mb-4 mix-blend-screen rounded-full"
          priority
        />
        <h1 className="text-2xl font-bold mb-1">El Pulpo Negro</h1>
        <p className="text-[#8a8a9a] text-sm mb-8">Sistema de Gestión</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#12121a] border border-[#2a2a3e] rounded-md text-[#f1f1f4] focus:outline-none focus:border-[#d4a853] transition-colors"
            required
          />

          {error && <p className="text-[#ef4444] text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 bg-[#d4a853] hover:bg-[#e2bd6e] text-black font-bold rounded-md transition-colors disabled:opacity-70"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
