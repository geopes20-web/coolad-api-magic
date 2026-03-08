import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Brain, ShieldCheck, TrendingUp, Users, Sparkles, ArrowRight, Zap, Target } from "lucide-react";

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Landing() {
  const { t } = useLanguage();

  const features = [
    { icon: Brain, title: t.features.aiEval, desc: t.features.aiEvalDesc },
    { icon: Users, title: t.features.marketplace, desc: t.features.marketplaceDesc },
    { icon: Sparkles, title: t.features.mentor, desc: t.features.mentorDesc },
    { icon: ShieldCheck, title: t.features.risk, desc: t.features.riskDesc },
  ];

  const stats = [
    { value: "2,400+", label: t.stats.ideas, icon: Zap },
    { value: "580+", label: t.stats.investors, icon: Target },
    { value: "120+", label: t.stats.funded, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="absolute top-20 start-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 end-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />

        <motion.div
          className="relative container mx-auto px-4 py-24 md:py-36 text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            {t.hero.badge}
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight tracking-tight">
            {t.hero.title1}
            <br />
            <span className="gradient-text">{t.hero.title2}</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t.hero.subtitle}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gradient-primary border-0 text-primary-foreground text-base px-8 h-12 shadow-glow">
              <Link to="/submit">
                {t.hero.cta1}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-12">
              <Link to="/marketplace">{t.hero.cta2}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.features.title}</h2>
          <p className="text-muted-foreground text-lg">{t.features.subtitle}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="glass glass-hover rounded-2xl p-6 shadow-glass"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.03 }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <motion.div className="glass rounded-3xl p-10 shadow-glass" initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.4 }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-foreground mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
