import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext"; 
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

interface Message {
  id: number;
  text: string;
  sender: "bot" | "user";
  options?: string[];
}

export default function ChatbotAssistente() {
  const { mode, currentField, isOpen, setIsOpen } = useChat();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assuntosCache, setAssuntosCache] = useState<any[]>([]);
  const [isGuideAccepted, setIsGuideAccepted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const renderFormattedText = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => index % 2 === 1 ? <strong key={index} className="font-bold">{part}</strong> : part);
  };

  const fetchAssuntos = async () => {
    if (assuntosCache.length > 0) return { text: "Assuntos disponíveis:", options: assuntosCache.map(a => a.nome) };
    try {
      const response = await api.get("/assuntos/");
      const dados = response.data.assuntos || response.data;
      if (Array.isArray(dados) && dados.length > 0) {
        setAssuntosCache(dados);
        return { text: "Assuntos disponíveis:", options: dados.map((a: any) => a.nome) };
      }
      return { text: "Sem assuntos.", options: [] };
    } catch { return { text: "Erro ao buscar assuntos.", options: [] }; }
  };

  // ==========================================================================
  // EFEITO 1: GERENCIAMENTO DE MODO + DELAY 5s (APENAS NO MODO GUIA)
  // ==========================================================================
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const initChat = async () => {
      // --- MODO GUIA (Entrou na Manifestação) ---
      if (mode === "guide") {
        setIsGuideAccepted(false);
        setMessages([
          { id: Date.now(), text: `Olá ${user?.nome || ""}! Notei que você vai registrar uma nova manifestação.`, sender: "bot" },
          { id: Date.now() + 1, text: "Quer que eu te guie explicando as regras da **IN 01/2017**?", sender: "bot", options: ["Sim, me guie", "Não, obrigado"] }
        ]);

        // Atraso de 5s para não atrapalhar o usuário logo de cara
        if (!isOpen) {
            timer = setTimeout(() => {
                setIsOpen(true);
            }, 5000);
        }
      } 
      // --- MODO GLOBAL (Fora da Manifestação) ---
      else {
        setIsGuideAccepted(false);
        if (timer) clearTimeout(timer); // Cancela qualquer timer pendente

        const data = await fetchAssuntos();
        setMessages([
          { id: Date.now(), text: `Olá ${user?.nome || ""}! Sou a Dora. Como posso ajudar?`, sender: "bot" },
          { id: Date.now() + 1, text: data.text, sender: "bot", options: data.options }
        ]);
        
        // No modo global, não forçamos a abertura automática (comportamento padrão)
      }
    };

    initChat();

    return () => {
        if (timer) clearTimeout(timer);
    };
  }, [mode, user]); // Removido isOpen das dependências para evitar loop

  // ==========================================================================
  // EFEITO 2: REAÇÃO AOS CAMPOS
  // ==========================================================================
  useEffect(() => {
    if (mode !== "guide" || !currentField || !isGuideAccepted) return;

    let guideText = "";
    switch (currentField) {
      case "anonimo": guideText = "🕵️ **Anonimato (Art. 14)**: Permitido apenas para Denúncias e Reclamações. Atenção: Sem dados de contato, você não poderá acompanhar o andamento."; break;
      case "classificacao": guideText = "🗂️ **Classificação**: Escolha corretamente entre Reclamação (insatisfação), Denúncia (ilícito), Elogio, Sugestão ou Solicitação."; break;
      case "assunto": guideText = "📌 **Assunto**: A escolha correta garante que sua manifestação vá direto para a área técnica responsável."; break;
      case "descricao": guideText = "📝 **Descrição**: Seja detalhista (Onde, Quando, Quem). Relatos ofensivos podem ser descartados (Art. 11, §4º)."; break;
      case "arquivos": guideText = "📎 **Anexos**: Fotos e documentos ajudam muito na apuração dos fatos. (Obs: Eles não são salvos no rascunho automático)."; break;
      default: if (currentField.startsWith("dinamico_")) guideText = `Este campo específico ajuda a detalhar o assunto escolhido.`; break;
    }

    if (guideText) {
      setMessages(prev => {
        if (prev[prev.length - 1]?.text === guideText) return prev;
        return [...prev, { id: Date.now(), text: guideText, sender: "bot" }];
      });
    }
  }, [currentField, mode, isGuideAccepted]); 

  // ==========================================================================
  // EFEITO 3: SCROLL AUTOMÁTICO
  // ==========================================================================
  useEffect(() => {
    if (scrollRef.current) {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 150);
    }
  }, [messages, isOpen]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleBadgeClick = (optionName: string) => {
    const userMsg: Message = { id: Date.now(), text: optionName, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const assunto = assuntosCache.find(a => a.nome === optionName);
    
    setTimeout(() => {
        const botText = assunto?.descricao 
            ? `📌 **${optionName}**: ${assunto.descricao}` 
            : `Você escolheu **${optionName}**.`;
            
        setMessages(prev => [
            ...prev, 
            { id: Date.now() + 1, text: botText, sender: "bot" },
            { id: Date.now() + 2, text: "Deseja ir para o formulário?", sender: "bot", options: ["Sim, criar nova", "Não, ver outros assuntos"] }
        ]);
        setIsLoading(false);
    }, 600);
  };

  const handleSend = async (manualText?: string) => {
    const text = manualText || inputValue;
    if (!text.trim()) return;

    if (text === "Sim, me guie") {
        setIsGuideAccepted(true);
        setMessages(p => [...p, { id: Date.now(), text, sender: "user" }, { id: Date.now()+1, text: "Combinado! Vou ficar de olho no seu preenchimento.", sender: "bot" }]);
        return;
    }
    if (text === "Não, obrigado") {
        setIsGuideAccepted(false);
        setMessages(p => [...p, { id: Date.now(), text, sender: "user" }, { id: Date.now()+1, text: "Tudo bem. Se precisar, estou aqui.", sender: "bot" }]);
        return;
    }
    if (text === "Sim, criar nova") {
        setMessages(p => [...p, { id: Date.now(), text, sender: "user" }]);
        setLocation("/nova-manifestacao");
        return;
    }
    if (text === "Não, ver outros assuntos") {
        handleClear();
        return;
    }

    setMessages(p => [...p, { id: Date.now(), text, sender: "user" }]);
    setInputValue("");
    setIsLoading(true);
    
    setTimeout(async () => {
        let response = "Entendi. Posso te ajudar com os assuntos ou com o preenchimento.";
        let opts: string[] | undefined = undefined;

        if (text.toLowerCase().includes("ajuda") || text.toLowerCase().includes("assunto")) {
            const data = await fetchAssuntos();
            response = data.text;
            opts = data.options;
        }
        
        setMessages(p => [...p, { id: Date.now()+1, text: response, sender: "bot", options: opts }]);
        setIsLoading(false);
    }, 800);
  };

  const handleClear = async () => {
    setIsLoading(true);
    if (mode === "guide") {
        setMessages([{ id: 1, text: "Reiniciando guia... Gostaria de ajuda?", sender: "bot", options: ["Sim, me guie", "Não, obrigado"] }]);
        setIsGuideAccepted(false);
    } else {
        const data = await fetchAssuntos();
        setMessages([{ id: 1, text: `Olá ${user?.nome || ""}! Como posso ajudar?`, sender: "bot" }, { id: 2, text: data.text, sender: "bot", options: data.options }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Button className={cn("fixed bottom-20 right-4 z-40 rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground transition-all duration-300", isOpen && "scale-0 opacity-0")} onClick={() => setIsOpen(true)}>
        <Bot size={28} />
      </Button>

      <div className={cn("fixed bottom-20 right-4 z-40 w-[90vw] md:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-sans", isOpen ? "scale-100 opacity-100 translate-y-0 h-[550px]" : "scale-90 opacity-0 translate-y-10 h-0 pointer-events-none")}>
        
        <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
          <div className="flex gap-2 items-center"><div className="bg-white/20 p-1.5 rounded-full"><Bot size={20} /></div><div><h3 className="font-bold text-sm">Dora - {mode === "guide" ? "Modo Guia" : "Assistente"}</h3><p className="text-xs opacity-80">Online</p></div></div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleClear} className="hover:bg-white/20 rounded-full"><Trash2 size={18}/></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full"><X size={18}/></Button>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-muted/30 p-4 min-h-0">
          <div className="space-y-4 pb-2">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex flex-col w-full animate-in slide-in-from-bottom-2", msg.sender === "user" ? "items-end" : "items-start")}>
                <div className={cn("max-w-[85%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap", msg.sender === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card text-card-foreground border rounded-tl-none")}>
                  {renderFormattedText(msg.text)}
                </div>
                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => ["Sim, me guie", "Não, obrigado", "Sim, criar nova", "Não, ver outros assuntos"].includes(opt) ? handleSend(opt) : handleBadgeClick(opt)} 
                        className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors border border-primary/20 font-medium"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className="text-xs text-muted-foreground animate-pulse pl-2">Dora está digitando...</div>}
            
            <div ref={scrollRef} className="h-1 w-full" />
          </div>
        </ScrollArea>

        <div className="p-3 bg-card border-t flex gap-2">
          <Input placeholder="Digite..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} className="bg-background" />
          <Button size="icon" onClick={() => handleSend()}><Send size={18} /></Button>
        </div>
      </div>
    </>
  );
}