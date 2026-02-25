import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { QrCode, ShoppingCart, Smartphone } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <QrCode className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Digitalni Meni
          </span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#kako-funkcionise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Kako funkcioniše
          </a>
          <a href="#paketi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Paketi
          </a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
          <Button variant="hero" size="sm" asChild>
            <Link to="/auth">Započni besplatno</Link>
          </Button>
        </div>
        <Button variant="hero" size="sm" className="md:hidden" asChild>
          <Link to="/auth">Započni</Link>
        </Button>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-12 md:px-12 md:pt-20 lg:px-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              Digitalizujte vaš restoran
            </div>
            <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Kreirajte svoj meni{" "}
              <span className="text-gradient">na brz i lak način</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Kreirajte digitalni meni, generišite QR kodove za svaki sto i primajte porudžbine u realnom vremenu. Sve na jednom mestu.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="hero" size="lg" className="text-base" asChild>
                <Link to="/auth">
                  <ShoppingCart className="mr-1 h-5 w-5" />
                  Kreirajte meni besplatno
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base" asChild>
                <a href="#paketi">Pogledajte pakete</a>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-hero" />
                Bez ugovora
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-hero" />
                Probni period 14 dana
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl shadow-card-hover">
              <img
                src={heroImage}
                alt="Digitalni meni na mobilnom telefonu sa QR kodom"
                className="h-auto w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <ShoppingCart className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">+248 porudžbina</p>
                  <p className="text-xs text-muted-foreground">Danas</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
