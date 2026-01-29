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
  const { currentField, isOpen, setIsOpen } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assuntosCache, setAssuntosCache] = useState<any[]>([]);
  const [pendingAssuntoId, setPendingAssuntoId] = useState<string | null>(null);

  // Trava para abrir apenas uma vez após o login
  const hasAutoOpenedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const isNovaManifestacaoPage = location === "/nova-manifestacao";
  const userName = user?.nome ? user.nome.split(' ')[0] : "Cidadão";

  const renderFormattedText = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => index % 2 === 1 ? <strong key={index} className="font-bold">{part}</strong> : part);
  };

  const fetchAssuntos = async () => {
    if (isNovaManifestacaoPage || user?.admin) return { text: "", options: [] };
    if (assuntosCache.length > 0) return { text: "Assuntos disponíveis:", options: assuntosCache.map(a => a.nome) };
    try {
      const response = await api.get("/assuntos/?apenas_ativos=true");
      const dados = response.data.assuntos || response.data || [];
      if (dados.length > 0) {
        setAssuntosCache(dados);
        return { text: "Assuntos disponíveis:", options: dados.map((a: any) => a.nome) };
      }
      return { text: "Sem assuntos.", options: [] };
    } catch { return { text: "Erro ao buscar assuntos.", options: [] }; }
  };

  // 1. LÓGICA DE LOGIN: Abre a Dora se houver notificações pendentes
  useEffect(() => {
    if (!user || hasAutoOpenedRef.current) return;

    const checarAberturaInicial = async () => {
        try {
            const res = await api.get(`/movimentacoes/notificacoes/novas?t=${Date.now()}`);
            const count = res.data.novas || 0;
            if (count > 0) {
                setMessages([{ 
                    id: Date.now(), 
                    text: `Olá ${userName}! Você possui **${count}** atualização(ões) não lida(s). Verifique o sino no topo para detalhes!`, 
                    sender: "bot",
                    options: ["Entendido"]
                }]);
                setIsOpen(true);
                hasAutoOpenedRef.current = true;
            }
        } catch (err) {}
    };
    checarAberturaInicial();
  }, [user, userName]);

  // 2. FLUXO NORMAL (GUIA vs GESTÃO vs ASSUNTOS)
  const startNormalFlow = async () => {
      // MODO GESTÃO
      if (user?.admin) {
          setMessages([{ 
            id: Date.now(), 
            text: `Olá Gestor ${userName}! Sou a Dora Gestão. Como posso ajudar no monitoramento hoje?`, 
            sender: "bot", 
            options: ["⏳ Prazos Legais", "🔍 Fluxo de Análise", "📊 Priorização"] 
          }]);
          return;
      }
      // MODO GUIA (Nova Manifestação)
      if (isNovaManifestacaoPage) {
        setMessages([{ 
            id: Date.now(), 
            text: `Olá ${userName}! Sou a Dora Assistente. Vou te orientar no preenchimento desta manifestação.`, 
            sender: "bot", 
            options: ["Sim, me guie", "Não, obrigado"] 
        }]);
        return;
      } 
      // MODO ASSUNTOS (Home)
      const data = await fetchAssuntos();
      setMessages([{ id: Date.now(), text: `Olá ${userName}! Sou a Dora Assistente. Como posso ajudar hoje?`, sender: "bot", options: data.options }]);
  };

  useEffect(() => { 
    if (user && !hasAutoOpenedRef.current) startNormalFlow(); 
  }, [user, location]);

  // 3. DICAS NO CLIQUE DOS CAMPOS (ABRE E MOSTRA)
  useEffect(() => {
    if (user?.admin || !currentField || !isNovaManifestacaoPage) return;
    let guideText = "";
    switch (currentField) {
      case "anonimo": guideText = "🕵️ **Anonimato**: Seus dados ficam em sigilo total."; break;
      case "classificacao": guideText = "🗂️ **Classificação**: Escolha o tipo (Denúncia, Reclamação, etc)."; break;
      case "assunto": guideText = "📌 **Assunto**: Selecione o tema principal."; break;
      case "descricao": guideText = "📝 **Descrição**: Detalhe o ocorrido com clareza."; break;
      case "arquivos": guideText = "📎 **Anexos**: Envie fotos ou documentos como prova."; break;
    }
    if (guideText) {
      setMessages(prev => [...prev, { id: Date.now(), text: guideText, sender: "bot" }]);
      setIsOpen(true);
    }
  }, [currentField, isNovaManifestacaoPage]);

  const handleBadgeClick = (optionName: string) => {
    if (["Entendido", "Não, obrigado", "Cancelar", "Voltar"].includes(optionName)) {
        setIsOpen(false);
        if (optionName === "Entendido") startNormalFlow(); // Carrega o menu após fechar a notificação
        return;
    }

    // TRAVA GESTÃO: Não abre manifestação para ADMIN
    if (optionName === "Sim, iniciar") {
        if (user?.admin) return;
        setIsOpen(false);
        const url = pendingAssuntoId ? `/nova-manifestacao?assunto_id=${pendingAssuntoId}` : "/nova-manifestacao";
        setLocation(url);
        return;
    }

    if (user?.admin) {
        const adminResponses: Record<string, string> = {
            "⏳ Prazos Legais": "Os prazos seguem a Lei 13.460/2017: 30 dias para resposta, prorrogáveis por mais 30.",
            "🔍 Fluxo de Análise": "O fluxo consiste em: Triagem -> Encaminhamento -> Análise -> Resposta Final.",
            "📊 Priorização": "Priorizamos Denúncias Graves e prazos críticos."
        };
        setMessages(prev => [...prev, { id: Date.now(), text: optionName, sender: "user" }, { id: Date.now() + 1, text: adminResponses[optionName] || "Como ajudo?", sender: "bot", options: ["Voltar"] }]);
        return;
    }

    // Fluxo Cidadão
    const userMsg: Message = { id: Date.now(), text: optionName, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    const assunto = assuntosCache.find(a => a.nome === optionName);
    if (assunto) setPendingAssuntoId(String(assunto.id));

    setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), text: `Deseja iniciar um registro sobre **${optionName}**?`, sender: "bot", options: ["Sim, iniciar", "Cancelar"] }]);
        setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [messages]);

  if (["/login", "/cadastro"].includes(location)) return null;

  return (
    <>
      <Button className={cn("fixed bottom-20 right-4 z-40 rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground transition-all duration-300", isOpen && "scale-0 opacity-0")} onClick={() => setIsOpen(true)}>
        <Bot size={28} />
      </Button>

      <div className={cn(
        "fixed bottom-20 right-4 z-50 w-[92vw] md:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 h-[320px]", 
        !isOpen && "scale-90 opacity-0 pointer-events-none h-0"
      )}>
        <div className="bg-primary p-3 flex justify-between items-center text-primary-foreground shrink-0">
          <div className="flex gap-2 items-center">
            <Bot size={20} className="text-white" />
            <h3 className="font-bold text-sm text-white">Dora - {user?.admin ? "Gestão" : "Assistente"}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white hover:bg-white/20"><X size={18}/></Button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-muted/10">
            <ScrollArea className="h-full w-full p-3">
              <div className="flex flex-col gap-3 pb-4">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex flex-col", msg.sender === "user" ? "items-end" : "items-start")}>
                    <div className={cn("max-w-[85%] p-2.5 rounded-2xl text-xs border shadow-sm", msg.sender === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card rounded-tl-none border-border/50")}>
                      {renderFormattedText(msg.text)}
                    </div>
                    {msg.options && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.options.map((opt, i) => (
                          <button key={i} onClick={() => handleBadgeClick(opt)} className="text-[10px] px-3 py-1.5 rounded-full border bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm font-medium border-primary/20">{opt}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
        </div>
      </div>
    </>
  );
}