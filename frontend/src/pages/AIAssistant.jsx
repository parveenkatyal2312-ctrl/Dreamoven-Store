import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, Bot, User } from "lucide-react";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? "bg-blue-500" : "bg-slate-700"
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
        isUser 
          ? "bg-blue-500 text-white" 
          : "bg-slate-100 text-slate-800"
      }`}>
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        {message.timestamp && (
          <div className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-slate-400"}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat/history/${sessionId}`);
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
        }
      } catch (e) {
        // No history exists, that's fine
      }
    };
    loadHistory();
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg = { role: "user", content: userMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.post("/chat", {
        session_id: sessionId,
        message: userMessage,
      });

      // Update with full history from server
      setMessages(res.data.history);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to send message. Please try again.");
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete(`/chat/history/${sessionId}`);
      setMessages([]);
    } catch (e) {
      setError("Failed to clear history");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div data-testid="ai-assistant" className="h-[calc(100vh-12rem)]">
      <Card className="h-full rounded-2xl flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Assistant
              <span className="text-sm font-normal text-slate-500">(GPT-4o)</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-slate-500 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">Hello! I'm your FoodPay AI Assistant</p>
                  <p className="text-sm mt-2">
                    Ask me anything about your sales data, commissions, partner charges, or general business questions.
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-slate-400">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "What's my total commission this month?",
                        "Compare Swiggy vs Zomato charges",
                        "How does GST calculation work?",
                        "Show me sales breakdown by company",
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(q)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 text-xs transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Error Alert */}
          {error && (
            <div className="px-4 pb-2">
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Input Area */}
          <div className="flex-shrink-0 border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your FoodPay data..."
                disabled={loading}
                className="rounded-xl"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="rounded-xl px-4"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
