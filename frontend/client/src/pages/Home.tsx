import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mic, Video, Image as ImageIcon, FileText, ArrowRight, ShieldCheck, Clock,
  LayoutDashboard, AlertCircle, Timer, CheckCircle2, FileStack, TrendingUp, Activity,
  ThumbsUp, Lightbulb, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { manifestacaoService } from "@/services/manifestacaoService";

const timeAgo = (dateStr: string) => {
    if (!dateStr) return "-";
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `há ${hours} h`;
    return "agora";
};

const capitalize = (s: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ");
};

// Helper para formatar o texto da classificação corretamente
const formatClassificacao = (tipo: string) => {
    if (!tipo) return "Outro";
    const map: Record<string, string> = {
        RECLAMACAO: "Reclamação",
        DENUNCIA: "Denúncia",
        ELOGIO: "Elogio",
        SUGESTAO: "Sugestão",
        SOLICITACAO: "Solicitação",
        INFORMACAO: "Informação"
    };
    return map[tipo.toUpperCase()] || capitalize(tipo);
};

// Helper para estilizar os badges
const getClassificacaoStyle = (type: string) => {
    const t = type?.toUpperCase();
    if (t === 'ELOGIO') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (t === 'DENUNCIA') return 'bg-red-100 text-red-700 border-red-200';
    if (t === 'RECLAMACAO') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (t === 'SOLICITACAO') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (t === 'SUGESTAO') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (t === 'INFORMACAO') return 'bg-sky-100 text-sky-700 border-sky-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
};

const getIconByType = (type: string) => {
    const t = type?.toUpperCase();
    if (t === 'ELOGIO') return <ThumbsUp className="w-5 h-5 text-emerald-500" />;
    if (t === 'DENUNCIA') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (t === 'SUGESTAO') return <Lightbulb className="w-5 h-5 text-amber-500" />;
    if (t === 'SOLICITACAO') return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-muted-foreground" />;
};

export default function Home() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    total: 0,
    pendente: 0,
    em_analise: 0,
    concluida: 0,
    recentes: [] as any[],
    tipos: { reclamacao: 0, denuncia: 0, elogio: 0, sugestao: 0, informacao: 0 }
  });

  useEffect(() => {
    if (user?.admin) {
        manifestacaoService.listarMinhasManifestacoes()
            .then((res: any) => {
                const list = Array.isArray(res) ? res : res.manifestacoes || [];
                
                const total = list.length;
                const pendente = list.filter((m: any) => m.status?.toUpperCase() === 'PENDENTE').length;
                const em_analise = list.filter((m: any) => ['RECEBIDA', 'EM_PROCESSAMENTO'].includes(m.status?.toUpperCase())).length;
                const concluida = list.filter((m: any) => ['CONCLUIDA', 'REJEITADA'].includes(m.status?.toUpperCase())).length;
                
                const recentes = list.slice(0, 5);

                const tipos = {
                    reclamacao: list.filter((m: any) => m.classificacao?.toLowerCase() === 'reclamacao').length,
                    denuncia: list.filter((m: any) => m.classificacao?.toLowerCase() === 'denuncia').length,
                    elogio: list.filter((m: any) => m.classificacao?.toLowerCase() === 'elogio').length,
                    sugestao: list.filter((m: any) => m.classificacao?.toLowerCase() === 'sugestao').length,
                    informacao: list.filter((m: any) => m.classificacao?.toLowerCase() === 'informacao').length,
                };
                
                setStats({ total, pendente, em_analise, concluida, recentes, tipos });
            })
            .catch(err => console.error("Erro ao carregar estatísticas", err));
    }
  }, [user]);

  // --- VISÃO 1: DASHBOARD DO ADMINISTRADOR ---
  if (user?.admin) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        
        <section className="flex flex-col md:flex-row justify-between items-center py-6 border-b border-border gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">Painel de Gestão</h2>
              <p className="text-muted-foreground text-center md:text-left">Visão estratégica da Ouvidoria</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex justify-center md:justify-end">
            <p className="text-xs font-medium text-muted-foreground/80 px-3 py-1 bg-muted/30 rounded-full border border-border/50">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</CardTitle>
               <FileStack className="h-4 w-4 text-blue-500" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats.total}</div>
             </CardContent>
           </Card>

           <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/50 shadow-sm relative overflow-hidden">
             <div className="absolute right-0 top-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-2 -mt-2"></div>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider">Pendentes</CardTitle>
               <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.pendente}</div>
               <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70 font-medium mt-1">Requer atenção</p>
             </CardContent>
           </Card>

           <Card className="bg-card border-border shadow-sm">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Em Análise</CardTitle>
               <Timer className="h-4 w-4 text-purple-500" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{stats.em_analise}</div>
             </CardContent>
           </Card>

           <Card className="bg-card border-border shadow-sm">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Finalizadas</CardTitle>
               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.concluida}</div>
             </CardContent>
           </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Últimos Protocolos
                    </h3>
                    <Link href="/manifestacoes">
                        <Button variant="link" className="text-xs h-auto p-0">Ver todos</Button>
                    </Link>
                </div>
                
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    {stats.recentes.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">Nenhum protocolo registrado.</div>
                    ) : (
                        stats.recentes.map((item, idx) => (
                            <Link key={item.id} href={`/manifestacao/${item.protocolo}`}>
                                <div className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border bg-background shrink-0 ${item.anonimo ? 'border-dashed border-muted-foreground/30' : 'border-border'}`}>
                                            {getIconByType(item.classificacao)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {capitalize(item.assunto?.nome) || "Assunto não informado"}
                                                </p>
                                                
                                                {/* --- CORREÇÃO DE BADGES AQUI --- */}
                                                {item.classificacao && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getClassificacaoStyle(item.classificacao)}`}>
                                                        {formatClassificacao(item.classificacao)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-mono">#{item.protocolo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                                            item.status?.toUpperCase() === 'PENDENTE' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                            item.status?.toUpperCase() === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                            'bg-muted text-muted-foreground border-border'
                                        }`}>
                                            {capitalize(item.status)}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(item.data_criacao)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <Card className="bg-card border-border shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Classificação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        {[
                            { label: "Denúncias", val: stats.tipos.denuncia, color: "bg-red-500" },
                            { label: "Reclamações", val: stats.tipos.reclamacao, color: "bg-orange-500" },
                            { label: "Solicitações", val: stats.tipos.solicitacao, color: "bg-blue-500" },
                            { label: "Elogios", val: stats.tipos.elogio, color: "bg-emerald-500" },
                        ].map((t) => (
                            <div key={t.label} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium text-foreground">{t.label}</span>
                                    <span className="text-muted-foreground">{t.val}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${t.color}`} 
                                        style={{ width: `${stats.total > 0 ? (t.val / stats.total) * 100 : 0}%` }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    );
  }

  // --- VISÃO 2: CIDADÃO ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="relative py-6 border-b border-border">
        <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Sua voz transforma <br />
            <span className="text-primary">o Distrito Federal</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-lg">
            Registre reclamações, denúncias ou elogios de forma rápida, acessível e segura.
            </p>
        </div>

        <div className="w-full flex justify-center mt-4 md:mt-0 md:w-auto md:absolute md:right-0 md:bottom-6">
            <p className="text-xs font-medium text-muted-foreground/80 px-3 py-1 bg-muted/30 rounded-full border border-border/50 whitespace-nowrap">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/nova-manifestacao?type=texto">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-primary/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Texto</span>
          </div>
        </Link>
        <Link href="/nova-manifestacao?type=audio">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-purple-500/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Mic size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Áudio</span>
          </div>
        </Link>
        <Link href="/nova-manifestacao?type=video">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-red-500/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Video size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Vídeo</span>
          </div>
        </Link>
        <Link href="/nova-manifestacao?type=imagem">
          <div className="bg-card border border-border shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 h-32 w-full cursor-pointer hover:scale-[1.02] hover:border-green-500/50 transition-all hover:shadow-md group">
            <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <ImageIcon size={24} />
            </div>
            <span className="text-sm font-bold text-foreground">Imagem</span>
          </div>
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-foreground">Destaques</h3>
        </div>
        
        <Card className="bg-card border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <ShieldCheck className="text-primary" size={20} />
              Denúncia Anônima
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Você pode registrar manifestações sem se identificar. Garantimos total sigilo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/nova-manifestacao?anonimo=true">
              <Button variant="outline" className="w-full justify-between group border-border text-foreground hover:bg-muted hover:text-foreground">
                Iniciar Denúncia Anônima
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Clock className="text-blue-500 dark:text-blue-400" size={20} />
              Acompanhamento em Tempo Real
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Receba atualizações sobre o andamento da sua manifestação diretamente no app.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}