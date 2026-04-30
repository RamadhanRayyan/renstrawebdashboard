import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { role: string } | null;
}

export function ChatSystem({ isGuest = false }: { isGuest?: boolean }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        profiles (
          role
        )
      `)
      .order("created_at", { ascending: true })
      .limit(50);
      
    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      // Supabase join syntax sometimes returns an array or object, depending on the relation.
      // Assuming 1-to-1 here for profiles.
      setMessages(data as any || []);
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("messages_db_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (isGuest) {
      toast.error("Tamu tidak diizinkan mengirim pesan.");
      return;
    }

    const { error } = await supabase
      .from("messages")
      .insert([{ user_id: user.id, content: newMessage.trim() }]);

    if (error) {
      toast.error("Gagal mengirim pesan: " + error.message);
    } else {
      setNewMessage("");
    }
  };

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Diskusi Laporan
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const role = Array.isArray(msg.profiles) ? msg.profiles[0]?.role : msg.profiles?.role;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className="text-[10px] text-muted-foreground mb-1 uppercase">
                  {role || "user"}
                </div>
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        {!isGuest && (
          <div className="p-3 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 text-sm"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
