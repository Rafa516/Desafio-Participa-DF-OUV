import { useState, useRef, useEffect } from "react";
import { X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { api } from "@/lib/api";

interface Message {
  id: number;
  text: string;
  sender: "bot" | "user";
  options?: string[];
}

export default function ChatbotAssistente() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Olá! Sou a Dora, sua assistente da ouvidoria.", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.nome) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[0] = { 
          ...newMessages[0],
          text: `Olá ${user.nome}! Sou a Dora, sua assistente da ouvidoria.` 
        };
        return newMessages;
      });
    }
  }, [user]);

  const fetchAssuntos = async (): Promise<{ text: string; options: string[] }> => {
    try {
      const response = await api.get("/assuntos/");
      const dados = response.data.assuntos || response.data;

      if (Array.isArray(dados) && dados.length > 0) {
        const badges = dados.map((a: any) => a.nome);
        return {
          text: "Atualmente, você pode registrar manifestações sobre os seguintes assuntos. Clique em um deles ou descreva seu problema:",
          options: badges
        };
      } else {
        return { text: "No momento não encontrei assuntos cadastrados.", options: [] };
      }
    } catch (error) {
      console.error("Erro ao buscar assuntos:", error);
      return { text: "Tive um problema ao consultar os assuntos. Tente novamente mais tarde.", options: [] };
    }
  };

  useEffect(() => {
    if (!hasAutoOpened) {
      const timer = setTimeout(async () => {
        setIsOpen(true);
        setIsLoading(true);
        const responseData = await fetchAssuntos();
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            text: responseData.text, 
            sender: "bot",
            options: responseData.options 
          }
        ]);
        setIsLoading(false);
        setHasAutoOpened(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasAutoOpened]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isLoading, isOpen]);

  const handleBadgeClick = (option: string) => {
    setInputValue(`Gostaria de falar sobre ${option}`);
  };

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || inputValue;
    if (!textToSend.trim()) return;

    const userMsg: Message = { id: Date.now(), text: textToSend, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const lowerInput = textToSend.toLowerCase();
      let botResponse = "Desculpe, não entendi. Pode reformular?";
      let botOptions: string[] | undefined = undefined;

      if (lowerInput.includes("assunto") || lowerInput.includes("sobre o que")) {
        const data = await fetchAssuntos();
        botResponse = data.text;
        botOptions = data.options;
      } 
      else if (lowerInput.includes("denúncia") || lowerInput.includes("reclamação")) {
        botResponse = "Para fazer uma denúncia ou reclamação, clique no botão 'Nova' no menu inferior ou me diga sobre o que é o problema.";
      } else if (lowerInput.includes("acompanhar") || lowerInput.includes("protocolo")) {
        botResponse = "Você pode acompanhar suas manifestações na aba 'Minhas' ou digitando o número do protocolo aqui.";
      } else if (lowerInput.includes("sim") || lowerInput.includes("quero")) {
        setLocation("/nova-manifestacao");
        botResponse = "Ótimo! Redirecionando você para criar uma nova manifestação...";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: "bot", options: botOptions }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Desculpe, tive um erro de conexão.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className={cn(
          "fixed bottom-20 right-4 z-40 rounded-full w-14 h-14 shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
        onClick={() => setIsOpen(true)}
      >
        <Bot size={28} />
      </Button>

      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 w-[90vw] md:w-96 bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right flex flex-col overflow-hidden font-sans",
          isOpen 
            ? "scale-100 opacity-100 translate-y-0 h-[550px]" 
            : "scale-90 opacity-0 translate-y-10 h-0 pointer-events-none"
        )}
      >
        {/* HEADER: bg-primary (Azul) */}
        <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm font-nunito">Dora - Assistente Virtual</h3>
              <p className="text-xs opacity-80 font-lato">Online agora</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        {/* ÁREA DE MENSAGENS: bg-muted/30 (Fundo levemente cinza/escuro) */}
        <ScrollArea className="flex-1 p-4 bg-muted/30 min-h-0">
          <div className="space-y-6 pb-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col w-full animate-in slide-in-from-bottom-2 fade-in",
                  msg.sender === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm font-lato mb-1",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none" // Usuário: Azul
                      : "bg-card text-card-foreground border border-border rounded-tl-none" // Bot: Cartão (Branco/Cinza Escuro)
                  )}
                >
                  {msg.text}
                </div>

                {msg.sender === "bot" && msg.options && (
                  <div className="flex flex-wrap gap-2 max-w-[90%] mt-1 animate-in fade-in slide-in-from-bottom-2">
                    {msg.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleBadgeClick(option)}
                        className="text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-colors px-3 py-1.5 rounded-full font-medium"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                 <div className="bg-card p-3 rounded-2xl rounded-tl-none border border-border shadow-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                 </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* INPUT: bg-card (Fundo do input) */}
        <div className="p-3 bg-card border-t border-border flex gap-2 shrink-0">
          <Input
            placeholder="Digite sua dúvida..."
            className="bg-background border-input text-foreground focus-visible:ring-1 font-lato"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button 
            size="icon" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shrink-0"
            onClick={() => handleSend()}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </>
  );
}