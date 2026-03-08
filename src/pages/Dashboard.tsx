import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Rocket, DollarSign, Compass, Lightbulb, TrendingUp,
  MessageSquare, Bookmark, ArrowRight, Plus, Sparkles, BarChart3,
} from "lucide-react";

interface IdeaRow {
  id: string; title: string; sector: string; ai_score: number;
  risk_score: number; created_at: string; status: string;
}

interface MessageRow {
  id: string; content: string; created_at: string; read: boolean;
  sender_id: string; receiver_id: string;
  sender_profile?: { full_name: string } | null;
  receiver_profile?: { full_name: string } | null;
}

interface SavedRow {
  id: string; idea_id: string;
  ideas: { id: string; title: string; sector: string; ai_score: number } | null;
}

export default function Dashboard() {
  const { user, loading, userRole } = useAuth();
  const { t } = useLanguage();
  const [myIdeas, setMyIdeas] = useState<IdeaRow[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedRow[]>([]);
  const [recentMessages, setRecentMessages] = useState<MessageRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const promises: Promise<void>[] = [];

      // My ideas (for entrepreneurs)
      if (userRole === "entrepreneur") {
        promises.push(
          supabase.from("ideas").select("id, title, sector, ai_score, risk_score, created_at, status")
            .eq("founder_id", user.id).order("created_at", { ascending: false })
            .then(({ data }) => { setMyIdeas((data as IdeaRow[]) || []); }) as unknown as Promise<void>
        );
      }

      // Saved ideas (for investor/explorer)
      if (userRole === "investor" || userRole === "explorer") {
        promises.push(
          supabase.from("saved_ideas").select("id, idea_id, ideas(id, title, sector, ai_score)")
            .eq("user_id", user.id).order("created_at", { ascending: false })
            .then(({ data }) => { setSavedIdeas((data as unknown as SavedRow[]) || []); }) as unknown as Promise<void>
        );
      }

      // Messages
      promises.push(
        supabase.from("messages").select("id, content, created_at, read, sender_id, receiver_id")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false }).limit(10)
          .then(({ data }) => { setRecentMessages((data as unknown as MessageRow[]) || []); }) as unknown as Promise<void>
      );

      await Promise.all(promises);
      setDataLoading(false);
    };
    load();
  }, [user, userRole]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const roleIcon = userRole === "entrepreneur" ? Rocket : userRole === "investor" ? DollarSign : Compass;
  const roleLabel = userRole === "entrepreneur" ? t.auth.entrepreneur : userRole === "investor" ? t.auth.investor : t.auth.explorer;
  const Icon = roleIcon;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Header */}
      <div className="glass rounded-2xl p-6 shadow-glass mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
              <Icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t.nav.dashboard}</h1>
              <p className="text-muted-foreground text-sm">{roleLabel} • {user.email}</p>
            </div>
          </div>
          {userRole === "entrepreneur" && (
            <Link to="/submit">
              <Button className="gradient-primary border-0 text-primary-foreground">
                <Plus className="h-4 w-4 me-1" />{t.dashboard.newIdea}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue={userRole === "entrepreneur" ? "ideas" : "saved"} className="glass rounded-2xl shadow-glass overflow-hidden">
          <TabsList className="w-full justify-start bg-muted/50 rounded-none border-b border-border/50 px-4">
            {userRole === "entrepreneur" && (
              <TabsTrigger value="ideas"><Lightbulb className="h-4 w-4 me-1" />{t.dashboard.myIdeas}</TabsTrigger>
            )}
            {(userRole === "investor" || userRole === "explorer") && (
              <TabsTrigger value="saved"><Bookmark className="h-4 w-4 me-1" />{t.dashboard.savedIdeas}</TabsTrigger>
            )}
            <TabsTrigger value="messages"><MessageSquare className="h-4 w-4 me-1" />{t.dashboard.messages}</TabsTrigger>
          </TabsList>

          {/* Entrepreneur: My Ideas */}
          {userRole === "entrepreneur" && (
            <TabsContent value="ideas" className="p-6">
              {myIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">{t.dashboard.noIdeas}</p>
                  <Link to="/submit"><Button className="gradient-primary border-0 text-primary-foreground">{t.dashboard.newIdea}</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myIdeas.map(idea => (
                    <Link key={idea.id} to={`/idea/${idea.id}`}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium text-foreground">{idea.title}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-xs">{idea.sector}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(idea.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{idea.ai_score}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{t.marketplace.aiScore}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Investor/Explorer: Saved Ideas */}
          {(userRole === "investor" || userRole === "explorer") && (
            <TabsContent value="saved" className="p-6">
              {savedIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">{t.dashboard.noSaved}</p>
                  <Link to="/marketplace"><Button className="gradient-primary border-0 text-primary-foreground">{t.dashboard.browseIdeas}</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedIdeas.map(s => s.ideas && (
                    <Link key={s.id} to={`/idea/${s.ideas.id}`}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium text-foreground">{s.ideas.title}</span>
                          <Badge variant="secondary" className="text-xs ms-2">{s.ideas.sector}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-sm">{s.ideas.ai_score}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Messages */}
          <TabsContent value="messages" className="p-6">
            {recentMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.dashboard.noMessages}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                    <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{msg.content}</p>
                      <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    {!msg.read && msg.receiver_id === user.id && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
