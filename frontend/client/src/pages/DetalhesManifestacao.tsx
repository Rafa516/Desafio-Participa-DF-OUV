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
  MessageSquare, ShieldCheck, Lock, UserCircle2, MapPin
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

  const [adminTexto, setAdminTexto] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminInterno, setAdminInterno] = useState(false);
  const [sendingMov, setSendingMov] = useState(false);

  useEffect(() => {
    if (params?.protocolo) {
        loadData(params.protocolo);
    }
  }, [params?.protocolo, user]); 

  const autoReceberManifestacao = async (id: string, currentStatus: string) => {
      if (user?.admin && currentStatus === 'pendente') {
          try {
              const formData = new FormData();
              formData.append("texto", "Sua manifestação foi recebida pela Ouvidoria e será analisada.");
              formData.append("interno", "false"); 
              formData.append("novo_status", "recebida"); 

              const token = localStorage.getItem("token");
              await api.post(`/movimentacoes/${id}`, formData, {
                  headers: { "Authorization": `Bearer ${token}` }
              });
              
              const data = await manifestacaoService.consultarPorProtocolo(params?.protocolo || "");
              setManifestacao(data);
              setAdminStatus("recebida");
              toast.success("Protocolo recebido automaticamente!");
              
              const resHist = await api.get(`/movimentacoes/${id}`, {
                  headers: { "Authorization": `Bearer ${token}` }
              });
              setHistorico(resHist.data);
          } catch (e) { console.error("Erro ao auto-receber", e); }
      }
  };

  const loadData = async (protocolo: string) => {
    try {
      if (!manifestacao) setLoading(true);
      const data = await manifestacaoService.consultarPorProtocolo(protocolo);
      setManifestacao(data);
      if(data) {
          const statusLower = data.status?.toLowerCase();
          setAdminStatus(statusLower); 
          const token = localStorage.getItem("token");
          const resHist = await api.get(`/movimentacoes/${data.id}`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          setHistorico(resHist.data);
          if (user?.admin && statusLower === 'pendente') {
             await autoReceberManifestacao(data.id, statusLower);
          }
      }
    } catch (error) {
      toast.error("Erro ao carregar detalhes.");
      setLocation("/manifestacoes");
    } finally { setLoading(false); }
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

        toast.success(adminInterno ? "Nota interna registrada (Status atualizado)" : "Resposta registrada e notificada!");
        setAdminTexto("");
        setAdminInterno(false);
        loadData(manifestacao.protocolo); 
    } catch (error) {
        toast.error("Erro ao registrar movimentação.");
    } finally { setSendingMov(false); }
  };

  const getAvailableStatuses = () => {
      if (!manifestacao) return [];
      const current = manifestacao.status?.toLowerCase();
      if (current === 'pendente') return [{ value: 'recebida', label: 'Recebida' }, { value: 'rejeitada', label: 'Rejeitada' }];
      if (current === 'recebida') return [{ value: 'em_processamento', label: 'Em Análise' }, { value: 'rejeitada', label: 'Rejeitada' }];
      if (current === 'em_processamento') return [{ value: 'concluida', label: 'Concluída' }];
      return [];
  };

  const renderFileIcon = (mimeType: string, url: string) => {
    const type = mimeType.toLowerCase();
    if (type.startsWith("image/")) return <img src={url} alt="Preview" className="w-full h-full object-cover" />;
    let Icon = FileIcon;
    if (type.includes("pdf")) Icon = FileText;
    else if (type.startsWith("video/")) Icon = FileVideo;
    else if (type.startsWith("audio/")) Icon = FileAudio;
    return <Icon className="w-8 h-8 text-muted-foreground" />;
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!manifestacao) return null;

  const currentStep = getStatusStep(manifestacao.status);
  const showManifestanteData = user?.admin && !manifestacao.anonimo && manifestacao.usuario;
  const statusOptions = getAvailableStatuses();

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
      <div className="shrink-0 flex items-center justify-between border-b border-border pb-4 pt-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/manifestacoes")} className="rounded-xl border-border hover:bg-muted text-foreground"><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Detalhes do Protocolo</h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(manifestacao.status)}`}>{formatStatus(manifestacao.status)}</span>
            </div>
            <p className="text-foreground font-mono text-1xl font-bold mt-2 tracking-tight">#{manifestacao.protocolo}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 space-y-8">
            {/* TIMELINE */}
            <div className="bg-card p-4 md:p-6 rounded-3xl border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-8 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Andamento</h3>
              <div className="relative flex justify-between items-center w-full px-4 md:px-10">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-border -z-0"></div>
                <div className="absolute left-0 top-1/2 h-1 bg-primary -z-0 transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, currentStep) * 33}%` }}></div>
                {["Enviada", "Recebida", "Em Análise", "Concluída"].map((label, index) => {
                  const isActive = index <= currentStep;
                  const isCurrent = index === currentStep;
                  return (
                    <div key={index} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isActive ? "bg-primary border-background text-primary-foreground shadow-lg" : "bg-card border-border text-muted-foreground"}`}>{isActive ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-3 h-3 bg-muted rounded-full" />}</div>
                      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INFO CARDS */}
            <div className={showManifestanteData ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
                {showManifestanteData && (
                    <div className="bg-card p-4 md:p-6 rounded-3xl border border-border shadow-sm">
                        <h3 className="font-semibold text-foreground border-b border-border pb-3 mb-4 flex items-center gap-2"><UserCircle2 className="w-5 h-5 text-primary" />Dados do Manifestante</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col"><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Nome Completo</span><span className="text-sm font-medium text-foreground">{manifestacao.usuario?.nome}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">E-mail</span><span className="text-sm font-medium text-foreground">{manifestacao.usuario?.email}</span></div>
                        </div>
                    </div>
                )}
                <div className="bg-card p-4 md:p-6 rounded-3xl border border-border shadow-sm">
                    <h3 className="font-semibold text-foreground border-b border-border pb-3 mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-primary" />Informações Gerais</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assunto Principal</span><p className="text-sm font-medium text-foreground">{manifestacao.assunto?.nome}</p></div>
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Abertura</span><span className="text-sm font-medium text-foreground">{formatDate(manifestacao.data_criacao.toString())}</span></div>
                    </div>
                </div>
            </div>

            {/* RELATO (CORREÇÃO DE VAZAMENTO) */}
            <div className="bg-card p-4 md:p-8 rounded-3xl border border-border shadow-sm">
              <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Relato
              </h3>
              <div className="p-4 md:p-6 bg-muted/30 rounded-2xl border border-border text-foreground leading-relaxed whitespace-pre-wrap break-words max-w-full overflow-hidden font-sans text-base">
                {manifestacao.relato}
              </div>
            </div>

            {/* HISTÓRICO */}
            <div className="bg-card p-4 md:p-8 rounded-3xl border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-4"><MessageSquare className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground text-lg">Histórico de Tramitação</h3></div>
                {historico.length === 0 ? (<div className="text-center py-8"><p className="text-muted-foreground">Nenhuma movimentação.</p></div>) : (
                    <div className="space-y-6">
                        {historico.map((mov) => (
                            <div key={mov.id} className={`flex gap-4 ${mov.interno ? "bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200/50" : ""}`}>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="font-bold text-sm text-foreground">{mov.autor_nome || "Sistema"}</span>{mov.interno && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200"><Lock size={10} /> NOTA INTERNA</span>}</div><span className="text-xs text-muted-foreground">{formatDate(mov.data_criacao)}</span></div>
                                    <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">{mov.texto}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-6">
            {/* PAINEL ADMIN */}
            {user?.admin && (
                <div className="bg-primary/5 p-4 md:p-6 rounded-3xl border border-primary/20 shadow-sm space-y-6">
                    <h3 className="font-bold text-primary flex items-center gap-2"><ShieldCheck className="w-5 h-5" />Área do Ouvidor</h3>
                    <div className="space-y-3"><Label>Próxima Fase</Label><Select value={adminStatus} onValueChange={setAdminStatus}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-3"><Label>Despacho / Resposta</Label><Textarea placeholder="Escreva aqui..." className="bg-background min-h-[120px] w-full" value={adminTexto} onChange={e => setAdminTexto(e.target.value)} /></div>
                    <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-primary/20">
                        <div className="space-y-0.5"><Label className="text-sm font-medium">Nota Interna?</Label><p className="text-[10px] text-muted-foreground">Cidadão recebe alerta de status, mas não vê o texto.</p></div>
                        <Switch checked={adminInterno} onCheckedChange={setAdminInterno} />
                    </div>
                    <Button onClick={handleAdminAction} disabled={sendingMov || statusOptions.length === 0} className="w-full font-bold shadow-md">{sendingMov ? "Processando..." : "Registrar Ação"}</Button>
                </div>
            )}
            <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 flex gap-4 items-start"><AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" /><div><h4 className="font-bold text-blue-800 text-sm">Privacidade Garantida</h4><p className="text-xs text-blue-600">LGPD: Seus dados estão seguros.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}