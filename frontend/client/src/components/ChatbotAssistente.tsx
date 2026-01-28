import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Trash2, ShieldCheck } from "lucide-react";
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
  const [location, setLocation] = useLocation();
 

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
  // EFEITO 1: INICIALIZAÇÃO BLINDADA (CIDADÃO vs ADMIN)
  // ==========================================================================
  useEffect(() => {
    let active = true; // Impede sobreposição de estados (Race Condition)
    let timer: NodeJS.Timeout;

    const initChat = async () => {
      // Se não tem usuário ainda, não faz nada (espera carregar)
      if (!user) return;

      // --- CENÁRIO 1: MODO ADMIN (Gestão) ---
      if (user.admin) {
          setIsGuideAccepted(false);
          if (active) {
            setMessages([
                { id: Date.now(), text: `Olá Gestor(a) ${user.nome.split(' ')[0]}! Sou a Dora, sua assistente de Ouvidoria.`, sender: "bot" },
                { 
                    id: Date.now() + 1, 
                    text: "Como posso ajudar na gestão hoje?", 
                    sender: "bot", 
                    options: ["⏳ Prazos Legais", "🔍 Fluxo de Análise", "📊 Priorização", "📝 Modelos de Resposta"] 
                }
            ]);
          }
          return;
      }

      // --- CENÁRIO 2: MODO CIDADÃO - GUIA ---
      if (mode === "guide") {
        setIsGuideAccepted(false);
        if (active) {
            setMessages([
            { id: Date.now(), text: `Olá ${user.nome.split(' ')[0]}! Notei que você vai registrar uma nova manifestação.`, sender: "bot" },
            { id: Date.now() + 1, text: "Quer que eu te guie explicando as regras da **IN 01/2017**?", sender: "bot", options: ["Sim, me guie", "Não, obrigado"] }
            ]);
        }

        if (!isOpen) {
            timer = setTimeout(() => { if(active) setIsOpen(true); }, 5000);
        }
      } 
      // --- CENÁRIO 3: MODO CIDADÃO - GLOBAL ---
      else {
        setIsGuideAccepted(false);
        if (timer) clearTimeout(timer);

        const data = await fetchAssuntos();
        if (active) {
            setMessages([
            { id: Date.now(), text: `Olá ${user.nome.split(' ')[0]}! Sou a Dora. Como posso ajudar?`, sender: "bot" },
            { id: Date.now() + 1, text: data.text, sender: "bot", options: data.options }
            ]);
        }
      }
    };

    initChat();

    return () => { 
        active = false; // Cancela atualizações se o usuário mudar (ex: logar como admin)
        if (timer) clearTimeout(timer); 
    };
  }, [mode, user]); // Recarrega se o usuário mudar

  // ==========================================================================
  // EFEITO 2: REAÇÃO AOS CAMPOS (Só para Cidadão no modo Guia)
  // ==========================================================================
  useEffect(() => {
    if (user?.admin) return; // Admin não precisa de guia
    if (mode !== "guide" || !currentField || !isGuideAccepted) return;

    let guideText = "";
    switch (currentField) {
      case "anonimo": guideText = "🕵️ **Anonimato (Art. 14)**: Permitido apenas para Denúncias e Reclamações."; break;
      case "classificacao": guideText = "🗂️ **Classificação**: Escolha corretamente entre Reclamação, Denúncia, Elogio, Sugestão ou Solicitação."; break;
      case "assunto": guideText = "📌 **Assunto**: A escolha correta garante o direcionamento rápido."; break;
      case "descricao": guideText = "📝 **Descrição**: Seja detalhista (Onde, Quando, Quem)."; break;
      case "arquivos": guideText = "📎 **Anexos**: Fotos e documentos ajudam muito."; break;
    }

    if (guideText) {
      setMessages(prev => {
        if (prev[prev.length - 1]?.text === guideText) return prev;
        return [...prev, { id: Date.now(), text: guideText, sender: "bot" }];
      });
    }
  }, [currentField, mode, isGuideAccepted, user]); 

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  
  // --- LÓGICA DO ADMIN ---
  const handleAdminOption = (option: string) => {
      let responseText = "";
      
      switch(option) {
          case "⏳ Prazos Legais":
              responseText = "🕒 **Prazos (Lei 13.460/2017):**\n\n• **Resposta:** 30 dias.\n• **Prorrogação:** +30 dias.\n• **Total Máximo:** 60 dias.";
              break;
          case "🔍 Fluxo de Análise":
              responseText = "1. **Triagem:** Competência do órgão?\n2. **Análise:** Precisa de área técnica?\n3. **Resposta:** Linguagem clara e cidadã.";
              break;
          case "📊 Priorização":
              responseText = "⚠️ **Priorize:**\nManifestações Pendentes antigas e Denúncias graves.";
              break;
          case "📝 Modelos de Resposta":
              responseText = "Padronize: *\"Prezado(a), informamos que sua solicitação foi atendida conforme processo nº...\"*";
              break;
          default:
              responseText = "Desculpe, não tenho informações sobre esse tópico.";
      }

      setMessages(prev => [
          ...prev,
          { id: Date.now(), text: option, sender: "user" },
          { id: Date.now() + 1, text: responseText, sender: "bot", options: ["Voltar ao Menu"] }
      ]);
  };

  const handleBadgeClick = (optionName: string) => {
    // Se for Admin, usa lógica de Admin
    if (user?.admin) {
        if (optionName === "Voltar ao Menu") {
            setMessages(prev => [...prev, { id: Date.now(), text: "Voltar", sender: "user" }, { id: Date.now()+1, text: "Menu Principal:", sender: "bot", options: ["⏳ Prazos Legais", "🔍 Fluxo de Análise", "📊 Priorização", "📝 Modelos de Resposta"] }]);
            return;
        }
        handleAdminOption(optionName);
        return;
    }

    // Se for Cidadão
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
            { id: Date.now() + 2, text: "Ir para o formulário?", sender: "bot", options: ["Sim, criar nova", "Não, ver outros"] }
        ]);
        setIsLoading(false);
    }, 600);
  };

  const handleSend = async (manualText?: string) => {
    const text = manualText || inputValue;
    if (!text.trim()) return;

    // Comandos de navegação rápida
    if (text === "Sim, me guie") {
        setIsGuideAccepted(true);
        setMessages(p => [...p, { id: Date.now(), text, sender: "user" }, { id: Date.now()+1, text: "Combinado! Vou te acompanhar.", sender: "bot" }]);
        return;
    }
    if (text === "Não, obrigado") {
        setIsGuideAccepted(false);
        setMessages(p => [...p, { id: Date.now(), text, sender: "user" }, { id: Date.now()+1, text: "Ok. Se precisar, chame.", sender: "bot" }]);
        return;
    }
    if (text === "Sim, criar nova") {
        setMessages(p => [...p, { id: Date.now(), text, sender: "user" }]);
        setLocation("/nova-manifestacao");
        return;
    }
    if (text === "Não, ver outros") {
        handleClear();
        return;
    }

    setMessages(p => [...p, { id: Date.now(), text, sender: "user" }]);
    setInputValue("");
    setIsLoading(true);
    
    setTimeout(async () => {
        let response = "Não entendi. Pode reformular?";
        let opts: string[] | undefined = undefined;

        if (user?.admin) {
             response = "Sou focada em gestão. Selecione uma opção:";
             opts = ["⏳ Prazos Legais", "🔍 Fluxo de Análise", "📊 Priorização"];
        } else {
            // Lógica simples de resposta para cidadão
            if (text.toLowerCase().includes("ajuda") || text.toLowerCase().includes("ola")) {
                 const data = await fetchAssuntos();
                 response = "Posso te ajudar a escolher o assunto:";
                 opts = data.options;
            } else {
                 response = "Ainda estou aprendendo. Tente escolher um dos assuntos abaixo:";
                 const data = await fetchAssuntos();
                 opts = data.options;
            }
        }
        
        setMessages(p => [...p, { id: Date.now()+1, text: response, sender: "bot", options: opts }]);
        setIsLoading(false);
    }, 800);
  };

  const handleClear = async () => {
    setIsLoading(true);
    if (user?.admin) {
        setMessages([{ id: 1, text: `Olá Gestor(a)! Menu de Gestão:`, sender: "bot", options: ["⏳ Prazos Legais", "🔍 Fluxo de Análise", "📊 Priorização", "📝 Modelos de Resposta"] }]);
    } else if (mode === "guide") {
        setMessages([{ id: 1, text: "Reiniciando guia...", sender: "bot", options: ["Sim, me guie", "Não, obrigado"] }]);
        setIsGuideAccepted(false);
    } else {
        const data = await fetchAssuntos();
        setMessages([{ id: 1, text: `Olá ${user?.nome.split(' ')[0]}! Como posso ajudar?`, sender: "bot" }, { id: 2, text: data.text, sender: "bot", options: data.options }]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
        setTimeout(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, 150);
    }
  }, [messages, isOpen]);

  const rotasEscondidas = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha"];
  if (rotasEscondidas.includes(location)) return null;

  return (
    <>
      <Button className={cn("fixed bottom-20 right-4 z-40 rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground transition-all duration-300", isOpen && "scale-0 opacity-0")} onClick={() => setIsOpen(true)}>
        <Bot size={28} />
      </Button>

      <div className={cn("fixed bottom-20 right-4 z-40 w-[90vw] md:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-sans", isOpen ? "scale-100 opacity-100 translate-y-0 h-[550px]" : "scale-90 opacity-0 translate-y-10 h-0 pointer-events-none")}>
        
        {/* CORREÇÃO DO LAYOUT: Mantendo o padrão Azul (Primary) para Admin também */}
        <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
          <div className="flex gap-2 items-center">
              <div className="bg-white/20 p-1.5 rounded-full">
                  {/* Ícone Diferente para Admin para identificar, mas cor igual */}
                  {user?.admin ? <ShieldCheck size={20} /> : <Bot size={20} />}
              </div>
              <div>
                  <h3 className="font-bold text-sm">Dora - {user?.admin ? "Gestão" : (mode === "guide" ? "Modo Guia" : "Assistente")}</h3>
                  <p className="text-xs opacity-80">Online</p>
              </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleClear} className="hover:bg-white/20 rounded-full"><Trash2 size={18}/></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full"><X size={18}/></Button>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-muted/30 p-4 min-h-0">
          <div className="space-y-4 pb-2">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex flex-col w-full animate-in slide-in-from-bottom-2", msg.sender === "user" ? "items-end" : "items-start")}>
                <div className={cn("max-w-[85%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap", 
                    msg.sender === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" // Usuário sempre Azul
                        : "bg-card text-card-foreground border rounded-tl-none" // Dora sempre branca/card
                )}>
                  {renderFormattedText(msg.text)}
                </div>
                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => ["Sim, me guie", "Não, obrigado", "Sim, criar nova", "Não, ver outros", "Voltar ao Menu"].includes(opt) ? handleSend(opt) : handleBadgeClick(opt)} 
                        className="text-xs px-3 py-1.5 rounded-full transition-colors border font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
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