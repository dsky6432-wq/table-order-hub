import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QrCode } from "lucide-react";

const FooterSection = () => {
  return (
    <>
      {/* CTA Banner */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-gradient-dark p-10 text-center md:p-16"
          >
            <h2 className="font-heading text-3xl font-bold text-primary-foreground md:text-4xl">
              Spremni da digitalizujete vaš restoran?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/70">
              Započnite besplatno danas i primite prvu porudžbinu za manje od 10 minuta.
            </p>
            <Button variant="hero" size="lg" className="mt-8 text-base">
              Kreirajte nalog besplatno
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-12 lg:px-20">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">
              Digitalni Meni
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Digitalni Meni. Sva prava zadržana.
          </p>
        </div>
      </footer>
    </>
  );
};

export default FooterSection;
