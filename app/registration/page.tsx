import React from 'react';
import CinematicBackground from '@/components/brand/CinematicBackground';
import ElevariBlend from '@/components/brand/ElevariBlend';
import WhatsAppButton from '@/components/brand/WhatsAppButton';

export default function RegistrationPage() {
  return (
    <CinematicBackground className="flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full z-10">
        <ElevariBlend size={64} className="mb-8 mx-auto" />
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Crear Cuenta / Create Account
        </h1>
        <p className="text-slate-300 text-center mb-8">
          Únete a Elevari y comienza a gestionar tus reservas de propiedades.<br/>
          Join Elevari and start managing your property reservations.
        </p>

        {/* Registration form placeholder */}
        <form className="space-y-4 bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Correo electrónico / Email
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus-ring-amber-500"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Contraseña / Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus-ring-amber-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Registrarse / Register
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center mt-6">
          ¿Ya tienes cuenta? <a href="/login" className="text-amber-400 hover:text-amber-300">Inicia sesión / Sign in</a>
        </p>
      </div>

      <WhatsAppButton />
    </CinematicBackground>
  );
}