import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MessageThread from "@/components/MessageThread";
import AccessGate from "@/components/AccessGate";
import NdaGate from "@/components/NdaGate";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChatWithFounder() {
  const { user, loading } = useAuth();
  const { founderId } = useParams<{ founderId: string }>();
  const [searchParams] = useSearchParams();
  const founderName = searchParams.get("name") || "—";
  const ideaId = searchParams.get("ideaId") || undefined;
  const navigate = useNavigate();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!founderId) return <Navigate to="/marketplace" replace />;

  return (
    <AccessGate feature="chat">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="glass rounded-2xl shadow-glass overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          <NdaGate ideaId={ideaId} otherUserId={founderId}>
            <MessageThread
              otherUserId={founderId}
              otherUserName={founderName}
              ideaId={ideaId}
              onBack={() => navigate(-1)}
            />
          </NdaGate>
        </div>
      </div>
    </AccessGate>
  );
}
