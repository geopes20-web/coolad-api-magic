import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Sparkles } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Collada</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">{t.footer.description}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">{t.footer.product}</h4>
            <div className="space-y-2">
              <Link to="/marketplace" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.marketplace}</Link>
              <Link to="/submit" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.submit}</Link>
              <Link to="/chat" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.chat}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">{t.footer.company}</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t.footer.about}</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t.footer.blog}</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t.footer.contact}</a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Collada. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
