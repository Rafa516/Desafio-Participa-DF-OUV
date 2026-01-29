import { useState, useEffect } from "react";
import { Link } from "wouter";
import { api, Manifestacao } from "@/lib/api"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, FileText, Calendar, Eye, 
  Paperclip, Tag, XCircle, ShieldCheck, User, UserX 
} from "lucide-react"; 
import { toast } from "sonner";

// --- HELPERS ---
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pendente": return "bg-amber-500/15 text-amber-700 border-amber-200";
    case "recebida": return "bg-blue-500/15 text-blue-700 border-blue-200";
    case "em_processamento": return "bg-purple-500/15 text-purple-700 border-purple-200";
    case "concluida": return "bg-emerald-500/15 text-emerald-700 border-emerald-200";
    case "rejeitada": return "bg-red-500/15 text-red-700 border-red-200";
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

export default function TodasManifestacoes() {
  const [manifestacoes, setManifestacoes] = useState<Manifestacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [anonimoFilter, setAnonimoFilter] = useState("todos"); // NOVO FILTRO

  useEffect(() => { fetchTodas(); }, []);

  const fetchTodas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // Chama a rota específica de Admin que criamos antes
      const res = await api.get("/manifestacoes/admin/todas?limit=100", {
          headers: { "Authorization": `Bearer ${token}` }
      });
      const lista = res.data.manifestacoes || [];
      setManifestacoes(lista);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lista completa.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRAGEM ---
  const filteredManifestacoes = manifestacoes.filter(m => {
    const searchLower = searchTerm.toLowerCase();
    
    // Busca: Protocolo, Assunto ou Nome do Usuário
    const matchesSearch = 
      m.protocolo.toLowerCase().includes(searchLower) ||
      (m.assunto?.nome || "").toLowerCase().includes(searchLower) ||
      (m.usuario?.nome || "").toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "todos" || m.status?.toLowerCase() === statusFilter;
    const matchesType = typeFilter === "todos" || m.classificacao === typeFilter;
    
    // Filtro Anônimo
    const matchesAnonimo = anonimoFilter === "todos" 
      ? true 
      : anonimoFilter === "sim" ? m.anonimo === true 
      : m.anonimo === false;

    return matchesSearch && matchesStatus && matchesType && matchesAnonimo;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setTypeFilter("todos");
    setAnonimoFilter("todos");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "todos" || typeFilter !== "todos" || anonimoFilter !== "todos";

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
      
      {/* --- TOPO --- */}
      <div className="shrink-0 flex flex-col gap-4 pt-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="text-primary" /> Painel de Ouvidoria
            </h1>
            <p className="text-muted-foreground mt-1">Gestão de todas as manifestações do sistema.</p>
          </div>
        </div>

        {/* ÁREA DE BUSCA E FILTROS */}
        <div className="bg-card p-4 rounded-2xl shadow-sm border border-border flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Buscar por protocolo, assunto ou nome do cidadão..." 
              className="pl-10 h-12 bg-background w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recebida">Recebida</SelectItem>
                <SelectItem value="em_processamento">Em Análise</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Classificação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Classificações</SelectItem>
                <SelectItem value="reclamacao">Reclamação</SelectItem>
                <SelectItem value="denuncia">Denúncia</SelectItem>
                <SelectItem value="solicitacao">Solicitação</SelectItem>
                <SelectItem value="informacao">Informação</SelectItem>
                <SelectItem value="elogio">Elogio</SelectItem>
                <SelectItem value="sugestao">Sugestão</SelectItem>
              </SelectContent>
            </Select>

            <Select value={anonimoFilter} onValueChange={setAnonimoFilter}>
              <SelectTrigger className="h-10 bg-background">
                <SelectValue placeholder="Identificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas (Ident. e Anônimas)</SelectItem>
                <SelectItem value="nao">Identificadas</SelectItem>
                <SelectItem value="sim">Anônimas</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-10 text-destructive hover:bg-destructive/10">
                  <XCircle className="w-4 h-4 mr-2" /> Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* --- LISTA (LAYOUT IGUAL AO DO USUÁRIO) --- */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-3xl shadow-sm flex flex-col overflow-hidden mb-2">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
          <span className="font-semibold text-muted-foreground text-sm">Protocolos Recentes</span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
            Total: {filteredManifestacoes.length}
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
            <div className="text-center py-10 text-muted-foreground">Nenhum protocolo encontrado.</div>
          ) : (
            filteredManifestacoes.map((item) => {
              const isAnonimo = item.anonimo;
              return (
                <div 
                  key={item.id} 
                  className="group p-5 rounded-2xl border bg-card border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden"
                >
                  {/* Linha colorida lateral */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(item.status).split(' ')[0]}`}></div>

                  <div className="flex-1 space-y-2 pl-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                        {formatStatus(item.status)}
                      </span>
                      
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.data_criacao)}
                      </span>

                      {isAnonimo ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-bold uppercase border border-border">
                          <UserX className="w-3 h-3" /> Anônimo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase border border-blue-100">
                          <User className="w-3 h-3" /> {item.usuario?.nome}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
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
                  </div>

                  {/* BOTÃO VER DETALHES */}
                  <div className="flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 gap-3 min-w-[140px]">
                      <Link href={`/manifestacao/${item.protocolo}`}>
                        <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/10 w-full justify-start md:justify-end font-semibold">
                          Ver Detalhes
                          <Eye className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>

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