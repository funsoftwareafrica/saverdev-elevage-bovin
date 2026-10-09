"use client";

// Page de connexion SAVERDEV — template cohérent avec l'app.
// Palette SAVERDEV, icônes Hugeicons, effets 3D, dégradés, animations.
// 4 profils démo (Éleveur, Gérant, Bailleur, Admin) en accès rapide.

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { PALETTE } from "@/lib/config";
import { HugeiconsIcon } from "@hugeicons/react";
import { User, Shield, Menu, Lock, Eye, EyeOff, ArrowRight, Check, AlertTriangle } from "@/lib/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Comptes démo (depuis prisma/seed.ts)
const DEMO_ACCOUNTS: { email: string; name: string; role: Role; password: string; color: string }[] = [
  { email: "beneficiaire@saverdev.org", name: "Ibrahim Sawadogo", role: "BENEFICIAIRE", password: "demo", color: PALETTE.primary },
  { email: "beneficiaire@saverdev.org", name: "Awa Traoré", role: "BENEFICIAIRE", password: "demo", color: "#1E6091" },
  { email: "sinergi@saverdev.org", name: "Bailleur SAVERDEV", role: "SINERGI", password: "demo", color: "#8D6E63" },
  { email: "e2a@saverdev.org", name: "Administrateur", role: "E2A", password: "demo", color: "#14532A" },
];

export function LoginView() {
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const account = DEMO_ACCOUNTS.find((a) => a.email === email && a.password === password);
      if (account) {
        login({ email: account.email, name: account.name, role: account.role });
        toast.success("Connexion réussie", { description: `Bienvenue, ${account.name}` });
      } else {
        setError("Email ou mot de passe incorrect. Utilisez un compte démo ci-dessous.");
        setLoading(false);
      }
    }, 600);
  };

  const quickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setLoading(true);
    setTimeout(() => {
      login({ email: account.email, name: account.name, role: account.role });
      toast.success("Connexion réussie", { description: `Bienvenue, ${account.name} (${ROLE_LABELS[account.role]})` });
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh relative overflow-hidden p-4">
      {/* Décor de fond : halos animés */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Carte de connexion 3D */}
      <LoginCard3D>
        <div className="relative z-10">
          {/* En-tête avec logo */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3"
            >
              <SaverdevLogo size={64} variant="light" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-2xl font-bold text-gradient"
            >
              SAVERDEV
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground mt-0.5"
            >
              Sahel Vert · Développement
            </motion.p>
          </div>

          {/* Indicateur "Connexion" */}
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HugeiconsIcon icon={Lock} size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Connexion</h2>
              <p className="text-[0.65rem] text-muted-foreground">Accédez à votre espace de gestion</p>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <div className="relative">
                <HugeiconsIcon icon={User} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@saverdev.org"
                  className="pl-9 h-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Mot de passe</Label>
              <div className="relative">
                <HugeiconsIcon icon={Lock} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="pl-9 pr-9 h-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <HugeiconsIcon icon={showPassword ? EyeOff : Eye} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2"
              >
                <HugeiconsIcon icon={AlertTriangle} size={16} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium relative overflow-hidden"
            >
              {loading ? (
                <motion.span
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.span
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Connexion en cours...
                </motion.span>
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <HugeiconsIcon icon={ArrowRight} size={16} />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Comptes démo</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Accès rapide — 4 profils */}
          <div className="grid grid-cols-2 gap-2.5">
            {DEMO_ACCOUNTS.map((account, i) => (
              <motion.button
                key={account.email}
                type="button"
                onClick={() => quickLogin(account)}
                disabled={loading}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-2.5 rounded-lg border border-border bg-white p-2.5 text-left hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div
                  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold"
                  style={{ background: account.color }}
                >
                  {account.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.7rem] font-semibold text-foreground truncate">{ROLE_LABELS[account.role]}</p>
                  <p className="text-[0.6rem] text-muted-foreground truncate">{account.email}</p>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight}
                  size={14}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </motion.button>
            ))}
          </div>

          {/* Pied de page */}
          <p className="text-center text-[0.6rem] text-muted-foreground mt-5">
            SAVERDEV — Sahel Vert pour un Développement Durable · v1.0
          </p>
        </div>
      </LoginCard3D>
    </div>
  );
}

// Carte 3D avec parallaxe souris (même style que le dashboard)
function LoginCard3D({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div ref={ref} style={{ perspective: "1200px" }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.25),0_8px_24px_-4px_rgba(0,0,0,0.08)]"
      >
        {/* Bordure dégradée animée */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${PALETTE.primary}30, transparent 40%, ${PALETTE.secondary}20)`,
          }}
        />
        {/* Halo interne */}
        <motion.div
          aria-hidden
          className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div style={{ transform: "translateZ(20px)" }} className="relative">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
