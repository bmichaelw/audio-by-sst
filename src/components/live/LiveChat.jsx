import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LiveChat({ sessionId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to new messages
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create' && event.data.session_id === sessionId) {
        setMessages(prev => [...prev, event.data]);
      }
    });

    return unsubscribe;
  }, [sessionId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.ChatMessage.filter(
        { session_id: sessionId },
        '-created_date',
        100
      );
      setMessages(msgs.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await base44.entities.ChatMessage.create({
        session_id: sessionId,
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        message: newMessage.trim(),
        is_admin: user.role === 'admin',
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <h3 className="font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
          Live Chat
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={msg.is_admin ? 'bg-purple-50/50 rounded-lg p-3' : ''}>
              <div className="flex items-baseline gap-2">
                <span 
                  className="font-medium text-sm"
                  style={{ color: msg.is_admin ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
                >
                  {msg.user_name}
                  {msg.is_admin && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'white' }}>
                      Host
                    </span>
                  )}
                </span>
                <span className="text-xs" style={{ color: 'hsl(var(--text-subtle))' }}>
                  {format(new Date(msg.created_date), 'h:mm a')}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-body))' }}>
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            disabled={isSending}
            style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}