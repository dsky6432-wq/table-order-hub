import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    id: "basic",
    name: "Osnovni",
    price: "1000",
    features: ["Digitalni meni", "QR kod za svaki sto", "Online porudžbine", "Dashboard u realnom vremenu"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "2000",
    features: ["Sve iz Osnovnog", "Različite teme", "Personalizacija dizajna", "Brending sa logom", "Analitika porudžbina"],
  },
];

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          const metadata = data.user.user_metadata as { restaurant_name?: string; subscription_plan?: string };
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                user_id: data.user.id,
                restaurant_name: metadata.restaurant_name || "",
                subscription_plan: metadata.subscription_plan === "premium" ? "premium" : "basic",
              },
              { onConflict: "user_id" }
            );

          if (profileError) {
            toast.error("Profil nije ažuriran, pokušajte ponovo.");
          }
        }

        toast.success("Uspešno ste se prijavili!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              restaurant_name: restaurantName,
              subscription_plan: selectedPlan,
            },
          },
        });
        if (error) throw error;

        toast.success("Proverite vaš email za potvrdu naloga!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
              <QrCode className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-2xl font-bold text-foreground">Digitalni Meni</span>
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isLogin ? "Prijavite se" : "Kreirajte nalog"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? "Pristupite vašem dashboard-u" : "Započnite sa digitalnim menijem"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <>
                {/* Plan Selection */}
                <div className="space-y-2">
                  <Label>Izaberite paket</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          selectedPlan === plan.id
                            ? "border-primary bg-accent shadow-card-hover"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        <p className="font-heading text-sm font-bold text-foreground">{plan.name}</p>
                        <p className="mt-1 font-heading text-xl font-bold text-primary">{plan.price} RSD<span className="text-xs font-normal text-muted-foreground">/mes</span></p>
                        <ul className="mt-2 space-y-1">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 shrink-0 text-primary" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant">Naziv restorana</Label>
                  <Input
                    id="restaurant"
                    placeholder="Moj restoran"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vaš@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimalno 6 karaktera"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? "Učitavanje..." : isLogin ? "Prijavite se" : "Kreirajte nalog"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Nemate nalog?" : "Već imate nalog?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Registrujte se" : "Prijavite se"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
