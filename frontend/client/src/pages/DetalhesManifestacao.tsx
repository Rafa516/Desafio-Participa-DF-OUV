import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { manifestacaoService } from "@/services/manifestacaoService";
import { Manifestacao, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, Calendar, FileText, Paperclip, 
  Clock, CheckCircle2, AlertCircle, 
  Download, File as FileIcon, Tag,
  FileVideo, FileAudio,
  MessageSquare, ShieldCheck, Lock, UserCircle2, Mail, Phone, Fingerprint, MapPin
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "http://localhost:8000";

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

const getStatusStep = (status: string) => {
  const s = status?.toLowerCase() || "";
  const steps = ["pendente", "recebida", "em_processamento", "concluida"];
  if (s === "rejeitada") return -1;
  return steps.indexOf(s);
};

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase() || "";
  switch (s) {
    case "pendente": return "text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-200 dark:border-amber-500/30";
    case "recebida": return "text-blue-700 dark:text-blue-400 bg-blue-500/15 border-blue-200 dark:border-blue-500/30";
    case "em_processamento": return "text-purple-700 dark:text-purple-400 bg-purple-500/15 border-purple-200 dark:border-purple-500/30";
    case "concluida": return "text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30";
    case "rejeitada": return "text-red-700 dark:text-red-400 bg-red-500/15 border-red-200 dark:border-red-500/30";
    default: return "text-muted-foreground bg-muted border-border";
  }
};

const formatStatus = (status: string) => {
  const s = status?.toLowerCase() || "";
  const map: Record<string, string> = {
    pendente: "Pendente", 
    recebida: "Recebida", 
    em_processamento: "Em Análise",
    concluida: "Concluída", 
    rejeitada: "Rejeitada"
  };
  return map[s] || status;
};

export default function DetalhesManifestacao() {
  const [, params] = useRoute("/manifestacao/:protocolo");
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  const [manifestacao, setManifestacao] = useState<Manifestacao | null>(null);
  const [historico, setHistorico] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Estados do Formulário Admin
  const [adminTexto, setAdminTexto] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminInterno, setAdminInterno] = useState(false);
  const [sendingMov, setSendingMov] = useState(false);

  useEffect(() => {
    if (params?.protocolo) loadData(params.protocolo);
  }, [params?.protocolo]);

  // --- FUNÇÃO PARA ATUALIZAR STATUS AUTOMATICAMENTE ---
  const autoReceberManifestacao = async (id: string, currentStatus: string) => {
      if (user?.admin && currentStatus === 'pendente') {
          try {
              const formData = new FormData();
              formData.append("texto", "Sua manifestação foi recebida pela Ouvidoria e será analisada.");
              formData.append("interno", "true");
              formData.append("novo_status", "recebida");

              const token = localStorage.getItem("token");
              await api.post(`/movimentacoes/${id}`, formData, {
                  headers: { "Authorization": `Bearer ${token}` }
              });
              const data = await manifestacaoService.consultarPorProtocolo(params?.protocolo || "");
              setManifestacao(data);
              setAdminStatus("recebida");
              toast.info("Protocolo marcado como RECEBIDO automaticamente.");
          } catch (e) {
              console.error("Erro ao auto-receber", e);
          }
      }
  };

  const loadData = async (protocolo: string) => {
    try {
      setLoading(true);
      const data = await manifestacaoService.consultarPorProtocolo(protocolo);
      setManifestacao(data);
      
      if(data) {
          const statusLower = data.status?.toLowerCase();
          setAdminStatus(statusLower); 
          
          try {
            const token = localStorage.getItem("token");
            const resHist = await api.get(`/movimentacoes/${data.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setHistorico(resHist.data);
          } catch (err) {
            console.error("Erro ao carregar histórico", err);
          }

          if (user?.admin && statusLower === 'pendente') {
             await autoReceberManifestacao(data.id, statusLower);
          }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar detalhes.");
      setLocation("/manifestacoes");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async () => {
    if (!manifestacao) return;
    if (!adminTexto.trim()) return toast.error("Escreva um despacho ou resposta.");

    try {
        setSendingMov(true);
        const formData = new FormData();
        formData.append("texto", adminTexto);
        formData.append("interno", String(adminInterno));
        
        const currentStatusLower = manifestacao.status?.toLowerCase();
        if (adminStatus && adminStatus !== currentStatusLower) {
            formData.append("novo_status", adminStatus); 
        }

        const token = localStorage.getItem("token");
        await api.post(`/movimentacoes/${manifestacao.id}`, formData, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        toast.success("Movimentação registrada com sucesso!");
        
        setAdminTexto("");
        setAdminInterno(false);
        loadData(manifestacao.protocolo); 

    } catch (error) {
        console.error(error);
        toast.error("Erro ao registrar movimentação.");
    } finally {
        setSendingMov(false);
    }
  };

  // --- LÓGICA DE OPÇÕES DO SELECT (REGRAS DE NEGÓCIO) ---
  const getAvailableStatuses = () => {
      if (!manifestacao) return [];
      const current = manifestacao.status?.toLowerCase();

      if (current === 'pendente') {
          return [
              { value: 'recebida', label: 'Recebida (Iniciar Triagem)' },
              { value: 'rejeitada', label: 'Rejeitada (Encerrar)' }
          ];
      }
      
      if (current === 'recebida') {
          return [
              { value: 'em_processamento', label: 'Em Análise (Encaminhar)' },
              { value: 'rejeitada', label: 'Rejeitada (Encerrar)' }
          ];
      }

      if (current === 'em_processamento') {
          return [
              { value: 'concluida', label: 'Concluída (Finalizar)' }
          ];
      }

      return [];
  };

  const renderFileIcon = (mimeType: string, url: string) => {
    const type = mimeType.toLowerCase();
    if (type.startsWith("image/")) {
      return (
        <img 
          src={url} 
          alt="Preview" 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement?.classList.add("flex", "items-center", "justify-center"); }} 
        />
      );
    }
    let Icon = FileIcon;
    let colorClass = "text-muted-foreground";
    if (type.includes("pdf")) { Icon = FileText; colorClass = "text-red-500"; }
    else if (type.startsWith("video/")) { Icon = FileVideo; colorClass = "text-purple-500"; }
    else if (type.startsWith("audio/")) { Icon = FileAudio; colorClass = "text-green-500"; }
    return <Icon className={`w-8 h-8 ${colorClass}`} />;
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!manifestacao) return null;

  const currentStep = getStatusStep(manifestacao.status);
  const showManifestanteData = user?.admin && !manifestacao.anonimo && manifestacao.usuario;
  const statusOptions = getAvailableStatuses();

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
      
      {/* HEADER */}
      <div className="shrink-0 flex items-center justify-between border-b border-border pb-4 pt-2">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" size="icon" onClick={() => setLocation("/manifestacoes")}
            className="rounded-xl border-border hover:bg-muted text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Detalhes do Protocolo</h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(manifestacao.status)}`}>
                {formatStatus(manifestacao.status)}
              </span>
            </div>
            {/* PROTOCOLO AJUSTADO PARA 2XL */}
            <p className="text-foreground font-mono text-1xl font-bold mt-2 tracking-tight">
                #{manifestacao.protocolo}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          
          {/* === COLUNA PRINCIPAL (ESQUERDA) === */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. TIMELINE VISUAL */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-8 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Andamento
              </h3>
              
              <div className="relative flex justify-between items-center w-full px-4 md:px-10">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-border -z-0"></div>
                <div className="absolute left-0 top-1/2 h-1 bg-primary -z-0 transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, currentStep) * 33}%` }}></div>

                {["Enviada", "Recebida", "Em Análise", "Concluída"].map((label, index) => {
                  const isActive = index <= currentStep;
                  const isCurrent = index === currentStep;
                  return (
                    <div key={index} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isActive ? "bg-primary border-background text-primary-foreground shadow-lg" : "bg-card border-border text-muted-foreground"}`}>
                        {isActive ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-3 h-3 bg-muted rounded-full" />}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. ÁREA SUPERIOR: DADOS E INFORMAÇÕES (LAYOUT AJUSTÁVEL) */}
            <div className={showManifestanteData ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
                
                {/* --- DADOS DO MANIFESTANTE (SÓ APARECE SE VISÍVEL) --- */}
                {showManifestanteData && (
                    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col h-full">
                        <h3 className="font-semibold text-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
                            <UserCircle2 className="w-5 h-5 text-primary" />
                            Dados do Manifestante
                        </h3>
                        <div className="space-y-5 flex-1">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Nome Completo</span>
                                <span className="text-sm font-medium text-foreground">{manifestacao.usuario?.nome}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">CPF</span>
                                    <span className="text-sm font-medium text-foreground">{manifestacao.usuario?.cpf || "-"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Telefone</span>
                                    <span className="text-sm font-medium text-foreground">{manifestacao.usuario?.telefone || "-"}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">E-mail</span>
                                <span className="text-sm font-medium text-foreground break-all">{manifestacao.usuario?.email}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- INFORMAÇÕES GERAIS --- */}
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col h-full">
                    <h3 className="font-semibold text-foreground border-b border-border pb-3 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        Informações Gerais
                    </h3>
                    <div className="space-y-6 flex-1">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assunto Principal</label>
                            <p className="text-lg font-medium text-foreground leading-tight">{manifestacao.assunto?.nome || "Não informado"}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Classificação</label>
                                <span className="text-sm text-foreground capitalize font-medium px-2 py-1 bg-muted rounded-md w-fit">
                                    {manifestacao.classificacao?.toLowerCase()}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Abertura</label>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    {formatDate(manifestacao.data_criacao.toString())}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. RELATO ORIGINAL */}
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-primary" />
               <h3 className="font-semibold text-foreground text-lg">
                {user?.admin ? "Relato do Cidadão" : "Relato"}
              </h3>
              </div>
              <div className="p-6 bg-muted/30 rounded-2xl border border-border text-foreground leading-relaxed whitespace-pre-wrap font-sans text-base">
                {manifestacao.relato}
              </div>
            </div>

            {/* 4. ANEXOS */}
            {manifestacao.anexos && manifestacao.anexos.length > 0 && (
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Paperclip className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground text-lg">Arquivos ({manifestacao.anexos.length})</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {manifestacao.anexos.map((anexo) => {
                    const fullUrl = anexo.arquivo_url.startsWith("http") ? anexo.arquivo_url : `${API_BASE_URL}/${anexo.arquivo_url}`;
                    return (
                      <div key={anexo.id} className="group relative flex items-center p-3 bg-muted/20 border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all">
                        <div className="w-16 h-16 bg-card rounded-lg border border-border flex items-center justify-center overflow-hidden shrink-0">
                          {renderFileIcon(anexo.tipo_arquivo, fullUrl)}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate" title={anexo.arquivo_url}>{anexo.arquivo_url.split('/').pop()?.split('_').slice(1).join('_') || "Arquivo"}</p>
                          <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold">{anexo.tipo_arquivo.split('/')[1] || "ARQUIVO"} • {formatDate(anexo.data_upload.toString())}</p>
                        </div>
                        <a href={fullUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. HISTÓRICO */}
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-lg">Histórico de Tramitação</h3>
                </div>

                {historico.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-border">
                        <p className="text-muted-foreground">Nenhuma movimentação registrada até o momento.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {historico.map((mov) => (
                            <div key={mov.id} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${mov.interno ? "bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/50" : ""}`}>
                                <div className="shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                                        <UserCircle2 className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground text-sm">{mov.autor_nome || "Sistema"}</span>
                                            {mov.autor_admin && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">OUVIDORIA</span>}
                                            {mov.interno && <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold border border-amber-200"><Lock size={10} /> NOTA INTERNA</span>}
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock size={12} /> {formatDate(mov.data_criacao)}
                                        </span>
                                    </div>
                                    <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap pt-1">
                                        {mov.texto}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

          </div>

          {/* === COLUNA LATERAL (DIREITA) === */}
          <div className="space-y-6">
            
            {/* PAINEL DO ADMINISTRADOR (REGRAS APLICADAS) */}
            {user?.admin && (
                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 shadow-sm space-y-6 animate-in slide-in-from-right-4">
                    <h3 className="font-bold text-primary border-b border-primary/20 pb-3 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        Área do Ouvidor
                    </h3>
                    
                    <div className="space-y-3">
                        <Label>Tramitação (Próxima Fase)</Label>
                        <Select value={adminStatus} onValueChange={setAdminStatus}>
                            <SelectTrigger className="w-full bg-background border-primary/20">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Exibe apenas opções válidas conforme a regra de negócio */}
                                {statusOptions.length > 0 ? (
                                    statusOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="disabled" disabled>Nenhuma ação disponível</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Despacho / Resposta</Label>
                        <Textarea 
                            placeholder="Escreva a resposta ao cidadão ou nota técnica interna..." 
                            className="bg-background border-primary/20 min-h-[120px]"
                            value={adminTexto}
                            onChange={e => setAdminTexto(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-primary/20">
                        <div className="space-y-0.5">
                            <Label className="cursor-pointer text-sm font-medium">Nota Interna?</Label>
                            <p className="text-[10px] text-muted-foreground">O cidadão não verá isso.</p>
                        </div>
                        <Switch checked={adminInterno} onCheckedChange={setAdminInterno} />
                    </div>

                    <Button onClick={handleAdminAction} disabled={sendingMov || statusOptions.length === 0} className="w-full font-bold shadow-md">
                        {sendingMov ? "Processando..." : "Registrar Movimentação"}
                    </Button>
                </div>
            )}

            {/* DADOS ESPECÍFICOS (VOLTOU PARA O CANTO DIREITO) */}
            {manifestacao.dados_complementares && Object.keys(manifestacao.dados_complementares).length > 0 && (
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
                <h3 className="font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Dados Específicos</h3>
                <div className="space-y-5">
                  {Object.entries(manifestacao.dados_complementares).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase break-words tracking-wider">{key.replace(/_/g, " ")}</span>
                        <span className="text-sm text-foreground font-medium break-words mt-1 bg-muted/50 p-2 rounded-lg border border-border/50">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AVISO DE PRIVACIDADE */}
            <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 flex gap-4 items-start">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Privacidade Garantida</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">LGPD: Seus dados estão seguros.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}