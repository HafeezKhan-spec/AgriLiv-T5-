import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

type Msg = {
  _id: string;
  messageType: "user" | "ai" | "system";
  content: {
    text?: string | null;
    attachments?: Array<{
      fileUrl?: string;
      originalName?: string;
    }>;
  };
  createdAt: string;
};

const Chat = () => {
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const fetchHistory = async (sid: string) => {
    if (!token) return;
    try {
      const resp = await fetch(`/api/chat/history/${sid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        setMessages(json.data.messages || []);
      }
    } catch {}
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!token) {
      toast({ title: "Login required", description: "Please login to chat", variant: "destructive" });
      return;
    }
    const text = input.trim();
    if (!text) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/chat/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageType: "user",
          content: { text },
          sessionId,
          context: { conversationTopic: "general" },
        }),
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        const sid = json.data.sessionId as string;
        setSessionId(sid);
        await fetchHistory(sid);
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => fetchHistory(sid), 1500);
        setInput("");
      } else {
        toast({ title: "Failed to send", description: json.message || "Please try again", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to send", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="floating-card">
        <CardHeader>
          <CardTitle>{t("profile.activityHistory") || "Chat Assistant"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] p-2 border rounded-md">
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m._id} className={`p-3 rounded-md ${m.messageType === "ai" ? "bg-muted" : "bg-secondary"}`}>
                  {m.content?.text && <p className="text-sm">{m.content.text}</p>}
                  {Array.isArray(m.content?.attachments) && m.content.attachments.length > 0 && (
                    <div className="mt-2">
                      {m.content.attachments.map((a, idx) => (
                        <div key={idx} className="mt-1">
                          {a.fileUrl && (
                            <img src={a.fileUrl} alt={a.originalName || "attachment"} className="max-h-64 rounded" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a plant, animal, fish or request an image"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <Button onClick={sendMessage} disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;
