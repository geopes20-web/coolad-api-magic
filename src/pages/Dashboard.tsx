import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigate } from "react-router-dom";
import { Loader2, Rocket, DollarSign, Compass } from "lucide-react";

export default function Dashboard() {
  const { user, loading, userRole } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const roleIcon = userRole === "entrepreneur" ? Rocket : userRole === "investor" ? DollarSign : Compass;
  const roleLabel = userRole === "entrepreneur" ? t.auth.entrepreneur : userRole === "investor" ? t.auth.investor : t.auth.explorer;
  const Icon = roleIcon;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="glass rounded-2xl p-8 shadow-glass max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
            <Icon className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.nav.dashboard}
            </h1>
            <p className="text-muted-foreground text-sm">{roleLabel} • {user.email}</p>
          </div>
        </div>
        <p className="text-muted-foreground">
          {/* Placeholder - will be expanded in Phase 3 */}
          Welcome to your dashboard. More features coming soon.
        </p>
      </div>
    </div>
  );
}
