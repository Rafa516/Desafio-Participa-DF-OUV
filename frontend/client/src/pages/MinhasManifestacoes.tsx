import { useState, useEffect } from "react";
import { Link } from "wouter";
import { manifestacaoService } from "@/services/manifestacaoService";
import { Manifestacao } from "@/lib/api"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, FileText, Calendar, Filter, Eye, 
  Paperclip, Tag, Lock, AlertTriangle, UserX 
} from "lucide-react"; 
import { toast } from "sonner";

// HELPERS
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    // Usando cores com transparência (/20) para funcionar bem no Dark Mode
    case "pendente": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
    case "recebida": return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
    case "em_processamento": return "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30";
    case "concluida": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    case "rejeitada": return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    pendente: "Pendente", recebida: "Recebida", em_processamento: "Em Análise",
    concluida: "Concluída", rejeitada: "Rejeitada"
  };
  return map[status?.toLowerCase()] || status;
};

const formatClassificacao = (tipo: string) => {
  if (!tipo) return "Não informado";
  const map: Record<string, string> = {
    reclamacao: "Reclamação", denuncia: "Denúncia", elogio: "Elogio",
    sugestao: "Sugestão", informacao: "Informação", solicitacao: "Solicitação"
  };
  return map[tipo.toLowerCase()] || tipo;
};

export default function MinhasManifestacoes() {
  const [manifestacoes, setManifestacoes] = useState<Manifestacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchManifestacoes(); }, []);

  const fetchManifestacoes = async () => {
    try {
      setLoading(true);
      const data = await manifestacaoService.listarMinhasManifestacoes();
      const lista = Array.isArray(data) ? data : (data as any).manifestacoes || [];
      setManifestacoes(lista);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar suas manifestações.");
    } finally {
      setLoading(false);
    }
  };

  const filteredManifestacoes = manifestacoes.filter(m => 
    m.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.assunto?.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
      
      {/* --- TOPO --- */}
      <div className="shrink-0 flex flex-col gap-4 pt-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Minhas Manifestações</h1>
            <p className="text-muted-foreground mt-1">Acompanhe o histórico e status dos seus protocolos.</p>
          </div>
          
          <Link href="/nova-manifestacao">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
              Nova Manifestação
            </Button>
          </Link>
        </div>

        {/* Barra de Busca (bg-card) */}
        <div className="bg-card p-4 rounded-2xl shadow-sm border border-border flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Buscar por protocolo ou assunto..." 
              className="pl-10 h-12 bg-background border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 w-12 px-0 rounded-xl border-border text-muted-foreground hover:bg-muted">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* --- LISTA --- */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-3xl shadow-sm flex flex-col overflow-hidden mb-2">
        
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
          <span className="font-semibold text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Lista de Protocolos
          </span>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
            {filteredManifestacoes.length} registros
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted/20 rounded-2xl border border-border p-6 animate-pulse" />
              ))}
            </div>
          ) : filteredManifestacoes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Você ainda não tem registros com esses critérios.
              </p>
            </div>
          ) : (
            filteredManifestacoes.map((item) => {
              const isAnonimo = item.anonimo;
              return (
                <div 
                  key={item.id} 
                  className={`group p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden
                    ${isAnonimo 
                      ? "bg-muted/10 border-border opacity-90" 
                      : "bg-card border-border hover:border-primary/50 hover:shadow-md"
                    }
                  `}
                >
                  {/* Linha colorida lateral */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAnonimo ? "bg-muted-foreground/30" : getStatusColor(item.status).split(' ')[0]}`}></div>

                  <div className="flex-1 space-y-2 pl-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isAnonimo ? "bg-muted text-muted-foreground border-border" : getStatusColor(item.status)}`}>
                        {formatStatus(item.status)}
                      </span>
                      
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.data_criacao)}
                      </span>

                      {isAnonimo && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-bold uppercase border border-border">
                          <UserX className="w-3 h-3" />
                          Anônimo
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className={`text-lg font-bold transition-colors line-clamp-1 ${isAnonimo ? "text-muted-foreground" : "text-foreground group-hover:text-primary"}`}>
                        {item.assunto?.nome || "Assunto não identificado"}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wide">
                        Protocolo: <span className="text-foreground font-bold select-all">{item.protocolo}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 rounded-lg border border-border">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground capitalize">
                          {formatClassificacao(item.classificacao)}
                        </span>
                      </div>
                    </div>
                    
                    {isAnonimo && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          <strong>Atenção:</strong> Manifestações anônimas não permitem acompanhamento.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 gap-3 min-w-[140px]">
                    {isAnonimo ? (
                      <Button variant="ghost" disabled className="text-muted-foreground w-full justify-start md:justify-end font-semibold cursor-not-allowed bg-muted/50">
                        Não disponível
                        <Lock className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Link href={`/manifestacao/${item.protocolo}`}>
                        <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/10 w-full justify-start md:justify-end font-semibold">
                          Ver Detalhes
                          <Eye className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}

                    {item.anexos && item.anexos.length > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-1 bg-muted/30 rounded-full border border-border">
                        <Paperclip className="w-3 h-3 text-muted-foreground" />
                        {item.anexos.length} anexo(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}