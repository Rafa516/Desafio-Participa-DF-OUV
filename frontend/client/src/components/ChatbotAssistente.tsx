import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasCheckedAutoOpen = useRef(false);

  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const scrollToBottom = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const renderFormattedText = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => index % 2 === 1 ? <strong key={index} className="font-bold">{part}</strong> : part);
  };

  const fetchAssuntos = async () => {
    if (assuntosCache.length > 0) return { text: "Assuntos disponíveis:", options: assuntosCache.map(a => a.nome) };
    try {
      const response = await api.get("/assuntos/?apenas_ativos=true");
      let dados = [];
      if (response.data && Array.isArray(response.data.assuntos)) {
          dados = response.data.assuntos;
      } else if (Array.isArray(response.data)) {
          dados = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
          dados = response.data.data;
      }

      if (dados.length > 0) {
        setAssuntosCache(dados);
        return { text: "Assuntos disponíveis:", options: dados.map((a: any) => a.nome) };
      }
      return { text: "Sem assuntos.", options: [] };
    } catch { return { text: "Erro ao buscar assuntos.", options: [] }; }
  };

  const loadStandardMenu = async () => {
      // TRAVA DE SEGURANÇA: Se estiver na Nova Manifestação, NÃO carrega menu padrão
      if (!user || location === "/nova-manifestacao") return;

      if (user.admin) {
          setMessages([
            { id: Date.now(), text: `Olá Gestor(a) ${user.nome.split(' ')[0]}! Sou a Dora.`, sender: "bot" },
            { 
                id: Date.now() + 1, 
                text: "Como posso ajudar na gestão?", 
                sender: "bot", 
                options: ["⏳ Prazos Legais", "🔍 Fluxo de Análise", "📊 Priorização", "📝 Modelos de Resposta"] 
            }
          ]);
          return;
      }

      const data = await fetchAssuntos();
      setMessages([
          { id: Date.now(), text: `Olá ${user.nome.split(' ')[0]}! Sou a Dora.`, sender: "bot" },
          { id: Date.now() + 1, text: data.text, sender: "bot", options: data.options }
      ]);
  };

  // EFEITO 1: NOTIFICAÇÃO (TRAVADA SE ESTIVER NA NOVA MANIFESTAÇÃO)
  useEffect(() => {
    // Se estiver na rota de criar manifestação, NÃO faz nada de notificação
    if (!user || hasCheckedAutoOpen.current || mode === "guide" || location === "/nova-manifestacao") return;

    const checkNotifications = async () => {
        const jaAbriuNaSessao = sessionStorage.getItem("dora_auto_opened");
        
        if (jaAbriuNaSessao) {
            loadStandardMenu(); 
            hasCheckedAutoOpen.current = true;
            return;
        }

        try {
            const res = await api.get(`/movimentacoes/notificacoes/novas?t=${Date.now()}`);
            const novas = res.data.novas || 0;
            
            if (novas > 0) {
                setMessages([{
                    id: Date.now(),
                    text: `🔔 **Olá ${user.nome.split(' ')[0]}!**\n\nVocê tem **${novas}** notificação(ões) não lidas.`,
                    sender: 'bot',
                    options: ["OK"]
                }]);
                setIsOpen(true);
            } else {
                loadStandardMenu();
            }
            sessionStorage.setItem("dora_auto_opened", "true");
            hasCheckedAutoOpen.current = true;

        } catch (e) { console.error("Erro dora init", e); }
    };

    checkNotifications();
  }, [user, location]); // Adicionei location para reagir se mudar de rota

  // EFEITO 2: MODO GUIA (DICAS) - SÓ ATIVO QUANDO CURRENT FIELD MUDA
  useEffect(() => {
    // Só funciona se estiver no modo guia E tiver um campo selecionado
    if (user?.admin || mode !== "guide" || !currentField) return;

    // Limpa mensagens anteriores se for a primeira vez no guia
    if (messages.length > 0 && messages[0].text.includes("Olá")) {
        setMessages([]);
    }

    let guideText = "";
    const tips: Record<string, string> = {
        "step1_inicio": "📜 **Dica Legal (IN 01/2017):**\n\n• **Denúncia/Reclamação:** Se quiser sigilo, ative o modo Anônimo.\n• **Solicitação:** Para pedir serviços (tapa-buraco, poda).\n• **Elogio:** Para reconhecer um bom serviço.",
        "step2_Servidor Público": "📝 **Servidor Público:**\nRelate a conduta (incompetência, negligência). Se souber, informe o nome do servidor e horário aproximado.",
        "step2_Serviço Público": "📝 **Serviço Público:**\nDescreva a falha no atendimento. Foi demora? Falta de informação? Seja detalhista.",
        "step2_Educação": "📝 **Educação:**\nInforme qual escola/creche e o problema (infraestrutura, falta de professor).",
        "step2_Saúde": "📝 **Saúde:**\nInforme o nome do Hospital/UBS. O problema foi falta de médico? Remédio? Atendimento?",
        "step2_Segurança Pública": "📝 **Segurança:**\nCite a corporação (PMDF/PCDF) e o local exato da ocorrência.",
        "step2_Infraestrutura e Mobilidade": "📝 **Infraestrutura:**\nPara buracos ou iluminação, pontos de referência ajudam muito a equipe a localizar.",
        "step2_generico": "📝 **Descrição:**\nSeja claro e objetivo (O Que, Quando, Onde e Quem). Isso agiliza a análise.",
        "step3_Servidor Público": "📌 **Campos Necessários:**\nInforme o **Nome do Servidor** e o **Órgão** onde ele atua. Isso é vital para a apuração.",
        "step3_Serviço Público": "📌 **Campos Necessários:**\nInforme o **Nome do Serviço** e o **Órgão Responsável**.",
        "step3_Educação": "📌 **Campos Necessários:**\nPrecisamos do nome da **Instituição de Ensino** e o **Nível** (Infantil, Fundamental, etc).",
        "step3_Saúde": "📌 **Campos Necessários:**\nIndique o **Estabelecimento de Saúde** e o **Tipo de Problema** (Medicamento, Atendimento).",
        "step3_Segurança Pública": "📌 **Campos Necessários:**\nSelecione o **Órgão** (PMDF, Bombeiros) e o **Local do Fato**.",
        "step3_Infraestrutura e Mobilidade": "📌 **Campos Necessários:**\nInforme o **Endereço/Local** exato e o tipo (Rua, Estacionamento).",
        "step3_Meio Ambiente": "📌 **Campos Necessários:**\nIndique o **Local** e se é Poluição ou Descarte irregular.",
        "step3_generico": "📌 **Dados Extras:**\nPreencha os campos complementares para ajudar na identificação do problema.",
        "step4_arquivos": "📎 **Provas (Art. 11):**\nFotos e vídeos são essenciais para comprovar buracos, infraestrutura ou situações visíveis.",
        "step5_confirmacao": "✅ **Quase lá!**\nConfira todos os dados. Ao confirmar, um **Protocolo** será gerado para você acompanhar."
    };

    guideText = tips[currentField] || tips[`step${currentField.charAt(4)}_generico`] || "";

    if (guideText) {
      setMessages([{ id: Date.now(), text: guideText, sender: "bot" }]);
    }
  }, [currentField, mode, user]); 

  const handleSend = async (manualText?: string) => {
    const text = manualText || inputValue;
    if (!text.trim()) return;

    // Se estiver no modo guia, o 'OK' fecha o guia ou limpa
    if (mode === "guide") {
        setMessages(p => [...p, { id: Date.now(), text, sender: "user" }]);
        setInputValue("");
        setTimeout(() => {
             setMessages(p => [...p, { id: Date.now(), text: "Estou acompanhando seu preenchimento. Continue.", sender: "bot" }]);
        }, 500);
        return;
    }

    if (text === "OK" || text === "Agora não") {
        setMessages(p => [...p, { id: Date.now(), text: "OK", sender: "user" }]);
        loadStandardMenu();
        return;
    }

    setMessages(p => [...p, { id: Date.now(), text, sender: "user" }]);
    setInputValue("");
    setIsLoading(true);

    if (user?.admin) {
        setTimeout(() => {
            let reply = "";
            if (text.includes("Prazos")) {
                reply = "⏳ **Prazos Legais (Lei 4.860/2012):**\n\n• Resposta Preliminar: 10 dias\n• Resposta Final: 20 dias (prorrogáveis por +20)\n• Recurso: 10 dias";
            } else if (text.includes("Fluxo")) {
                reply = "🔍 **Fluxo de Análise:**\n\n1. Triagem (Ouvidoria)\n2. Encaminhamento (Área Técnica)\n3. Análise e Resposta\n4. Revisão (Ouvidor)\n5. Envio ao Cidadão";
            } else if (text.includes("Priorização")) {
                reply = "📊 **Critérios de Prioridade:**\n\n• Idosos (+60 anos)\n• Pessoas com Deficiência\n• Saúde/Risco de Vida\n• Denúncias Graves";
            } else if (text.includes("Modelos")) {
                reply = "📝 **Modelos Disponíveis:**\n\n• Pedido de Prorrogação\n• Resposta Padrão (Falta de Dados)\n• Resposta Conclusiva";
            } else {
                reply = "Não entendi. Tente usar os botões abaixo.";
            }

            setMessages(p => [...p, { id: Date.now(), text: reply, sender: "bot" }]);
            setMessages(p => [...p, { id: Date.now() + 1, text: "Algo mais?", sender: "bot", options: ["Voltar ao Menu"] }]);
            
            if (text === "Voltar ao Menu") loadStandardMenu();
            setIsLoading(false);
        }, 800);
        return;
    }

    const assuntoEncontrado = assuntosCache.find(a => a.nome === text);

    if (assuntoEncontrado) {
        setTimeout(() => {
            const desc = assuntoEncontrado.descricao || "Este assunto requer atenção especial e preenchimento de dados complementares.";
            setMessages(p => [...p, { 
                id: Date.now(), 
                text: `📌 **Sobre ${assuntoEncontrado.nome}:**\n\n${desc}`, 
                sender: "bot" 
            }]);
            
            setMessages(p => [...p, { 
                id: Date.now() + 1, 
                text: "Deseja ver outros assuntos?", 
                sender: "bot", 
                options: ["Sim, mostrar lista", "Não, obrigado"] 
            }]);
            setIsLoading(false);
        }, 800);
    } else if (text === "Sim, mostrar lista" || text === "Voltar ao Menu") {
        await loadStandardMenu();
        setIsLoading(false);
    } else if (text === "Não, obrigado") {
        setTimeout(() => {
            setMessages(p => [...p, { id: Date.now(), text: "Tudo bem! Se precisar, estou aqui.", sender: "bot" }]);
            setIsLoading(false);
        }, 500);
    } else {
        setTimeout(() => {
            setMessages(p => [...p, { id: Date.now(), text: "Desculpe, não entendi. Selecione um assunto da lista.", sender: "bot" }]);
            loadStandardMenu();
            setIsLoading(false);
        }, 1000);
    }
  };
  
  const handleClear = async () => {
    setIsLoading(true);
    await loadStandardMenu(); 
    setIsLoading(false);
  };

  const rotasEscondidas = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha"];
  if (rotasEscondidas.includes(location)) return null;

  return (
    <>
      <Button 
        className={cn("fixed bottom-20 right-4 z-40 rounded-full w-12 h-12 shadow-lg bg-primary text-primary-foreground transition-all duration-300", isOpen && "scale-0 opacity-0")} 
        onClick={() => setIsOpen(true)}
      >
        <Bot size={24} /> 
      </Button>

      <div className={cn(
        "fixed bottom-20 right-4 z-40 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-sans",
        "w-[80vw] md:w-80",
        isOpen ? "scale-100 opacity-100 translate-y-0 h-[45vh] md:h-[450px]" : "scale-90 opacity-0 translate-y-10 h-0 pointer-events-none"
      )}>
        
        <div className="bg-primary p-3 flex justify-between items-center text-primary-foreground flex-none">
          <div className="flex gap-2 items-center">
              <div className="bg-white/20 p-1 rounded-full">
                  {user?.admin ? <ShieldCheck size={18} /> : <Bot size={18} />}
              </div>
              <div>
                  <h3 className="font-bold text-xs">Dora - {user?.admin ? "Gestão" : (mode === "guide" ? "Guia" : "Ajuda")}</h3>
                  <p className="text-[10px] opacity-80">Online</p>
              </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleClear} className="hover:bg-white/20 rounded-full w-7 h-7"><Trash2 size={14}/></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full w-7 h-7"><X size={14}/></Button>
          </div>
        </div>

        <div className="flex-1 bg-muted/30 p-3 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="space-y-3 pb-2">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex flex-col w-full animate-in slide-in-from-bottom-2", msg.sender === "user" ? "items-end" : "items-start")}>
                <div className={cn("max-w-[90%] p-2.5 rounded-2xl text-xs shadow-sm whitespace-pre-wrap", 
                    msg.sender === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card text-card-foreground border rounded-tl-none"
                )}>
                  {renderFormattedText(msg.text)}
                </div>
                {msg.options && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {msg.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(opt)} 
                        className="text-[10px] px-2.5 py-1 rounded-full transition-colors border font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} className="h-1 w-full" />
          </div>
        </div>

        <div className="p-2 bg-card border-t flex gap-2 flex-none">
          <Input placeholder="Digite..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} className="bg-background h-8 text-xs" />
          <Button size="icon" className="h-8 w-8" onClick={() => handleSend()}><Send size={14} /></Button>
        </div>
      </div>
    </>
  );
}