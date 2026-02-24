import { motion } from "framer-motion";
import { QrCode, LayoutDashboard, ShoppingCart, Smartphone } from "lucide-react";

const steps = [
  {
    icon: LayoutDashboard,
    title: "Kreirajte meni",
    description: "Dodajte kategorije, proizvode, cene i slike. Koristite gotove templejte ili prilagodite dizajn.",
  },
  {
    icon: QrCode,
    title: "Generišite QR kodove",
    description: "Sistem automatski generiše jedinstven QR kod za svaki sto u vašem restoranu.",
  },
  {
    icon: Smartphone,
    title: "Mušterije skeniraju i naručuju",
    description: "Gosti skeniraju QR kod, pregledaju meni, dodaju u korpu i biraju način plaćanja.",
  },
  {
    icon: ShoppingCart,
    title: "Primajte porudžbine uživo",
    description: "Sve porudžbine stižu u vaš dashboard u realnom vremenu. Brzo, jednostavno, efikasno.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const HowItWorksSection = () => {
  return (
    <section id="kako-funkcionise" className="bg-secondary/50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Kako <span className="text-gradient">funkcioniše</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Četiri jednostavna koraka do potpuno digitalizovanog menija i online porudžbina.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={itemVariants}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover"
            >
              <span className="absolute -top-3 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-hero font-heading text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <step.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
