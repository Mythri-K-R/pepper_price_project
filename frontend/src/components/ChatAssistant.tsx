import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "bot";
  content: string;
}

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "What's the latest price in Sirsi?",
    "How do I grow black pepper?",
    "Market outlook for next year?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage: Message = {
          role: "bot",
          content: data.response,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        toast.error(data.error || "Failed to get response");
      }
    } catch (err) {
      toast.error("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-card rounded-lg shadow-xl overflow-hidden">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            <Bot className="h-20 w-20 mx-auto mb-6 text-primary/60" />
            <h3 className="text-2xl font-bold mb-2 text-foreground">PepperBot AI Assistant</h3>
            <p className="text-lg mb-8">Ask me anything about black pepper cultivation and market trends!</p>
            
            {/* Suggested Prompts */}
            <div className="flex flex-col gap-3 max-w-md mx-auto">
              <p className="text-sm font-medium text-foreground/70 flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                Try asking:
              </p>
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary transition-colors"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "bot" && (
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-6 w-6 text-primary" />
              </div>
            )}
            <div
              className={`px-5 py-3 rounded-2xl max-w-[75%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
            </div>
            {message.role === "user" && (
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="px-5 py-3 rounded-2xl rounded-bl-sm bg-muted">
              <p className="text-muted-foreground">Bot is typing...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-6">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 h-12 text-base rounded-full px-6"
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={loading || !input.trim()}
            size="icon"
            className="h-12 w-12 rounded-full flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;