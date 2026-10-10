"use client";

// Formulaire de connexion — email/mot de passe via NextAuth Credentials.
import { useState } from "react";
import { signIn } from "next-auth/react";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "gerant@saverdev.org", role: "Gérant" },
  { email: "eleveur@saverdev.org", role: "Éleveur" },
  { email: "bailleur@saverdev.org", role: "Bailleur" },
  { email: "admin@saverdev.org", role: "Admin" },
];

export function LoginForm() {
  const [email, setEmail] = useState("gerant@saverdev.org");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants incorrects. Vérifiez votre email et mot de passe.");
    } else if (res?.ok) {
      // Recharge la page pour que le serveur récupère la session
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <SaverdevLogo size={72} variant="light" />
          <h1 className="text-2xl font-bold mt-4 text-slate-900">SAVERDEV Élevage</h1>
          <p className="text-sm text-slate-500 mt-1">Sahel Vert · Développement</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Connexion
            </CardTitle>
            <CardDescription>Authentifiez-vous pour accéder à l'application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="gerant@saverdev.org"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-primary" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-[0.7rem] text-muted-foreground mb-2 uppercase tracking-wider">Comptes démo (mot de passe : demo)</p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => { setEmail(a.email); setPassword("demo"); }}
                    className="text-left px-2 py-1.5 rounded-md hover:bg-muted text-xs transition-colors border border-border"
                  >
                    <span className="font-medium text-foreground">{a.role}</span>
                    <br />
                    <span className="text-muted-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[0.7rem] text-muted-foreground mt-6">
          © {new Date().getFullYear()} SAVERDEV · Données sensibles — accès réservé
        </p>
      </div>
    </div>
  );
}
