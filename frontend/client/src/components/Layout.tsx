import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Home, PlusCircle, List, User, LogOut, ShieldCheck, Bell, ExternalLink, MoreVertical, X, Info } from "lucide-react"; 
import { cn } from "@/lib/utils";
import SkipLink from "./SkipLink";
import AcessibilidadeMenu from "./AcessibilidadeMenu";
import ChatbotAssistente from "./ChatbotAssistente";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api"; 
import { toast } from "sonner"; // OBRIGATÓRIO: Importar o toast

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { logout, isAuthenticated, user } = useAuth();
  
  const [notificacoesCount, setNotificacoesCount] = useState(0);
  const [notificacoesList, setNotificacoesList] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Guarda o último número para saber se aumentou
  const lastCountRef = useRef(0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
          const target = event.target as Element;
          const toggleBtn = document.getElementById('mobile-menu-toggle');
          const isPortal = target.closest('[data-radix-portal]') || target.closest('[role="menu"]');
          if (!toggleBtn?.contains(target) && !isPortal) {
            setIsMobileMenuOpen(false);
          }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
      setIsMobileMenuOpen(false);
  }, [location]);

  // =========================================================
  // LÓGICA DO SININHO (15 SEGUNDOS)
  // =========================================================
  useEffect(() => {
    // Função para tocar som (opcional)
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3'); // Se tiver um arquivo, ou remove essa linha
            // Como fallback, apenas loga
            console.log("🔔 Trim trim!"); 
        } catch (e) { }
    };

    const fetchNotificacoes = async () => {
        if (!isAuthenticated) return;
        try {
            // Timestamp para evitar cache
            const response = await api.get(`/movimentacoes/notificacoes/novas?t=${Date.now()}`);
            const novas = response.data.novas || 0;
            const itens = response.data.itens || [];

            // SE TIVER NOVAS E FOR MAIOR QUE ANTES -> AVISA!
            if (novas > 0 && novas > lastCountRef.current) {
                // Toca alerta visual (Toast Azul)
                toast.info(`🔔 Você tem ${novas} nova(s) notificação(ões)!`, {
                    description: "Clique no sino para visualizar.",
                    duration: 6000, // Fica 6 segundos
                    action: {
                        label: "Ver",
                        onClick: () => setShowNotifMenu(true)
                    }
                });
                playNotificationSound();
            }
            
            // Atualiza a referência e o estado
            lastCountRef.current = novas;
            setNotificacoesCount(novas);
            setNotificacoesList(itens);

        } catch (error) {
            console.error("Erro polling layout:", error);
        }
    };

    if (isAuthenticated) {
        fetchNotificacoes(); // Busca ao carregar a página
        const interval = setInterval(fetchNotificacoes, 15000); // Repete a cada 15s
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]); 

  const handleMarkAsRead = async () => {
    try {
        await api.post("/auth/marcar-lido");
        setNotificacoesCount(0);
        lastCountRef.current = 0;
        setShowNotifMenu(false);
    } catch (error) {
        console.error("Erro ao limpar", error);
    }
  };

  if (["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha"].includes(location)) {
    return (
      <main className="min-h-screen bg-background font-sans text-foreground relative">
        <div className="absolute top-4 right-4 z-50">
          <AcessibilidadeMenu />
        </div>
        {children}
      </main>
    );
  }

  const allNavItems = [
    { icon: Home, label: "Início", path: "/" },
   { 
      icon: List, 
      label: user?.admin ? "Painel Ouvidoria" : "Minhas Manifestações", 
      path: "/manifestacoes" 
    },
    { icon: PlusCircle, label: "Nova Manifestação", path: "/nova-manifestacao" },
    { icon: User, label: "Meu Perfil", path: "/perfil" },
    { icon: Info, label: "Gestão de Assuntos", path: "/admin/assuntos" },
  ];

  const navItems = allNavItems.filter(item => {
      if (user?.admin && item.path === "/nova-manifestacao") return false;
      if (!user?.admin && item.path === "/admin/assuntos") return false;
      return true;
  });

  const showChatbot = !!user;

  // --- RENDER DO SINO ---
  const NotificationBell = ({ isMobile = false }) => (
    <div className={cn("relative", isMobile ? "w-full flex justify-end" : "")} ref={notifRef}>
        <button 
            onClick={(e) => { e.stopPropagation(); setShowNotifMenu(!showNotifMenu); }}
            className="relative p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all outline-none"
        >
            <Bell size={isMobile ? 18 : 20} className={notificacoesCount > 0 ? "text-primary animate-pulse" : ""} />
            {notificacoesCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in duration-300">
                {notificacoesCount}
                </span>
            )}
        </button>

        {showNotifMenu && (
            <div className={cn(
                "bg-card dark:bg-zinc-900 border border-border rounded-xl shadow-xl z-[70] animate-in fade-in slide-in-from-top-2 overflow-hidden",
                isMobile 
                    ? "fixed top-20 left-4 right-4 w-auto mx-auto max-w-sm" 
                    : "absolute mt-2 w-80 right-0" 
            )}>
                <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                    <span className="font-bold text-sm">Notificações</span>
                    {notificacoesCount > 0 && (
                        <button onClick={handleMarkAsRead} className="text-xs text-primary hover:underline">
                            Marcar como lidas
                        </button>
                    )}
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notificacoesList.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            Nenhuma nova notificação.
                        </div>
                    ) : (
                        notificacoesList.map((notif, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => { setLocation(`/manifestacao/${notif.protocolo}`); setShowNotifMenu(false); setIsMobileMenuOpen(false); }}
                                className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-0 transition-colors text-left"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">#{notif.protocolo}</span>
                                    <span className="text-[10px] text-muted-foreground">{new Date(notif.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-sm text-foreground line-clamp-2 leading-snug">
                                    {notif.resumo}
                                </p>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-2 border-t border-border bg-muted/10 text-center">
                    <Link href="/manifestacoes" onClick={() => { setIsMobileMenuOpen(false); setShowNotifMenu(false); }}>
                        <span className="text-xs font-medium text-muted-foreground hover:text-primary cursor-pointer flex items-center justify-center gap-1">
                            Ver todas <ExternalLink size={10} />
                        </span>
                    </Link>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col font-sans text-foreground overflow-hidden transition-colors duration-300">
      <SkipLink />
      
      <header className="h-16 bg-card border-b border-border shadow-sm shrink-0 z-50 relative transition-colors duration-300">
        <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">
           
           <div className="flex flex-col md:flex-row items-start md:items-center gap-0.5 md:gap-2">
              {user?.admin && (
                <div className="md:hidden self-start px-1.5 py-[2px] bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-[4px] text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider leading-none mb-0.5">
                    MODO ADMIN
                </div>
              )}

              <div className="flex items-center font-nunito font-bold text-xl md:text-2xl tracking-tight select-none truncate">
                <span className="text-[#21348e] dark:text-blue-400 text-2xl md:text-3xl mr-0.5 transition-colors">&lt;</span>
                <span className="text-[#21348e] dark:text-blue-400 transition-colors">ParticipaDF</span>
                <span className="text-[#55bbf5]">-Ouvidoria</span>
                <span className="text-[#55bbf5] text-2xl md:text-3xl ml-0.5">&gt;</span>
              </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Ouvidoria Digital Acessível</span>
                <AcessibilidadeMenu />
                {isAuthenticated && (
                  <>
                    <NotificationBell />
                    <button 
                      onClick={logout}
                      className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                    >
                      <LogOut size={18} />
                      <span>Sair</span>
                    </button>
                  </>
                )}
            </div>

            <button
                id="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-full outline-none"
            >
                {isMobileMenuOpen ? <X size={24} /> : <MoreVertical size={24} />}
            </button>

            {isMobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden absolute top-[50px] right-2 w-52 bg-card dark:bg-zinc-900 border border-border shadow-2xl rounded-lg flex flex-col z-50 animate-in fade-in slide-in-from-top-2 origin-top-right overflow-hidden">
                    {isAuthenticated && (
                        <>
                           <div className="flex items-center justify-between h-9 px-3 hover:bg-muted/50 cursor-pointer border-b border-border/40" onClick={(e) => { e.stopPropagation(); setShowNotifMenu(!showNotifMenu) }}>
                                <span className="text-sm font-medium text-foreground">Notificações</span>
                                <NotificationBell isMobile={true} />
                           </div>
                           <div className="h-px bg-border my-0.5 opacity-50"></div>
                        </>
                    )}
                    <div 
                        className="flex items-center justify-between h-9 px-3 hover:bg-muted/50 cursor-pointer border-b border-border/40"
                        onClick={(e) => {
                            e.stopPropagation();
                        }} 
                    >
                        <span className="text-sm font-medium text-foreground">Acessibilidade</span>
                        <div className="flex justify-end">
                            <AcessibilidadeMenu />
                        </div>
                    </div>
                    {isAuthenticated && (
                        <>
                           <div className="h-px bg-border my-0.5 opacity-50"></div>
                           <button 
                             onClick={logout}
                             className="flex items-center justify-between w-full h-9 px-3 text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
                           >
                             <span>Sair da conta</span>
                             <LogOut size={18} />
                           </button>
                        </>
                    )}
                </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border shrink-0 h-full overflow-y-auto transition-colors duration-300">
          {user?.admin && (
            <div className="mx-4 mt-6 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-left-2 shadow-sm">
              <div className="p-2 bg-red-500/20 rounded-full shrink-0">
                <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Modo Admin</span>
                <span className="text-[10px] text-red-600/80 dark:text-red-400/80 font-medium">Gestão Completa</span>
              </div>
            </div>
          )}

          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer font-medium text-sm", isActive ? "bg-primary/10 text-primary border-l-4 border-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}> 
                    <item.icon size={20} className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">© 2026 Desafio ParticipaDF<br/>Governo do Distrito Federal</p>
          </div>
        </aside>

        <main id="main-content" className="flex-1 overflow-y-auto p-6 pb-24 md:p-10 relative w-full">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {showChatbot && <ChatbotAssistente />}
      
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card dark:bg-zinc-900 border-t border-border pb-safe z-50 transition-colors duration-300">
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={cn("flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer p-1 w-full", isActive ? "text-primary" : "text-muted-foreground")}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium text-center leading-3 w-full break-words max-w-[85px]">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}