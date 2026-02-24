import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Osnovni",
    price: "29",
    description: "Sve što vam treba da digitalizujete meni i primite prve porudžbine.",
    features: [
      "Kreiranje digitalnog menija",
      "Gotovi templejti",
      "Kategorije i proizvodi",
      "QR kod za svaki sto",
      "Online porudžbine",
      "Dashboard u realnom vremenu",
    ],
    popular: false,
  },
  {
    name: "Premium",
    price: "59",
    description: "Za restorane koji žele potpunu kontrolu nad dizajnom i iskustvom.",
    features: [
      "Sve iz Osnovnog paketa",
      "Različite teme za meni",
      "Personalizacija dizajna",
      "Brending sa logom",
      "Prioritetna podrška",
      "Analitika porudžbina",
    ],
    popular: true,
  },
];

const PricingSection = () => {
  return (
    <section id="paketi" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Jednostavne i <span className="text-gradient">transparentne</span> cene
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Izaberite paket koji odgovara vašem restoranu. Bez skrivenih troškova.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`relative rounded-2xl border p-8 transition-all ${
                plan.popular
                  ? "border-primary bg-card shadow-card-hover"
                  : "border-border bg-card shadow-card hover:shadow-card-hover"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-hero px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Najpopularniji
                </span>
              )}
              <h3 className="font-heading text-2xl font-bold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-bold text-foreground">
                  €{plan.price}
                </span>
                <span className="text-muted-foreground">/mesečno</span>
              </div>
              <Button
                variant={plan.popular ? "hero" : "hero-outline"}
                className="mt-6 w-full"
                size="lg"
                asChild
              >
                <Link to="/auth">Započni sa {plan.name}</Link>
              </Button>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
