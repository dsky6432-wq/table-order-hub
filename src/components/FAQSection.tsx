import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "Da li mogu da probam platformu besplatno?",
    a: "Da! Nudimo besplatan probni period od 14 dana za oba paketa, bez potrebe za kreditnom karticom.",
  },
  {
    q: "Kako mušterije naručuju putem QR koda?",
    a: "Svaki sto dobija jedinstven QR kod. Gost ga skenira telefonom, otvara se digitalni meni, dodaje proizvode u korpu, bira plaćanje karticom ili gotovinom i šalje porudžbinu direktno na vaš dashboard.",
  },
  {
    q: "Da li mogu da menjam meni u realnom vremenu?",
    a: "Apsolutno. Sve promene koje napravite u dashboardu odmah se prikazuju na digitalnom meniju. Možete dodavati, uklanjati ili menjati cene proizvoda u bilo kom trenutku.",
  },
  {
    q: "Koja je razlika između Osnovnog i Premium paketa?",
    a: "Osnovni paket uključuje sve za funkcionalan digitalni meni. Premium dodaje mogućnost izbora različitih tema, personalizaciju dizajna, brending i analitiku porudžbina.",
  },
  {
    q: "Da li je potrebna posebna oprema?",
    a: "Ne. Sve što vam treba je internet konekcija. QR kodove možete odštampati na bilo kom štampaču.",
  },
  {
    q: "Mogu li da otkažem pretplatu?",
    a: "Da, možete otkazati u bilo kom trenutku. Nema dugoročnih ugovora niti skrivenih troškova.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="bg-secondary/50 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Česta <span className="text-gradient">pitanja</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sve što treba da znate o Digitalnom Meniju.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-12"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl border border-border bg-card px-6 shadow-card"
              >
                <AccordionTrigger className="font-heading text-base font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
