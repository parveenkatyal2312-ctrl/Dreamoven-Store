import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, X, MessageCircle, Bot, User, Trash2 } from "lucide-react";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        isUser ? "bg-blue-500" : "bg-slate-700"
      }`}>
        {isUser ? (
          <User className="w-3 h-3 text-white" />
        ) : (
          <Bot className="w-3 h-3 text-white" />
        )}
      </div>
      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
        isUser 
          ? "bg-blue-500 text-white" 
          : "bg-slate-100 text-slate-800"
      }`}>
        <div className="whitespace-pre-wrap text-xs">{message.content}</div>
      </div>
    </div>
  );
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `floating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const tempUserMsg = { role: "user", content: userMessage };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.post("/chat", {
        session_id: sessionId,
        message: userMessage,
      });
      setMessages(res.data.history);
    } catch (e) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete(`/chat/history/${sessionId}`);
      setMessages([]);
    } catch (e) {
      // Ignore
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? "bg-slate-600 hover:bg-slate-700" 
            : "bg-blue-500 hover:bg-blue-600 animate-pulse"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium">AI Assistant</span>
            </div>
            <button
              onClick={clearHistory}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 py-4 text-xs">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Hi! Ask me anything about your FoodPay data.</p>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-xl px-3 py-2">
                    <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex-shrink-0 border-t p-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                disabled={loading}
                className="rounded-xl text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                size="sm"
                className="rounded-xl px-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
