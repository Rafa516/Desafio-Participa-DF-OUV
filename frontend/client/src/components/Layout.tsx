import { Link, useLocation } from "wouter";
import { Home, PlusCircle, List, User, MessageSquare, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import SkipLink from "./SkipLink";
import AcessibilidadeMenu from "./AcessibilidadeMenu";
import ChatbotAssistente from "./ChatbotAssistente";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated } = useAuth();

  // --- LÓGICA DE LAYOUT LIMPO (Login/Cadastro) ---
  if (["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha"].includes(location)) {
    return (
      <main className="min-h-screen bg-background font-sans text-foreground relative">
        {/* Botão de Acessibilidade Flutuante */}
        <div className="absolute top-4 right-4 z-50">
          <AcessibilidadeMenu />
        </div>
        {children}
      </main>
    );
  }

  // --- LAYOUT PADRÃO ---
  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: List, label: "Minhas Manifestações", path: "/manifestacoes" },
    { icon: PlusCircle, label: "Nova Manifestação", path: "/nova-manifestacao" },
    { icon: MessageSquare, label: "Chat de Ajuda", path: "/chat-ajuda" },
    { icon: User, label: "Meu Perfil", path: "/perfil" },
  ];

  return (
    <div className="h-screen bg-background flex flex-col font-sans text-foreground overflow-hidden transition-colors duration-300">
      <SkipLink />
      
      <header className="h-16 bg-card border-b border-border shadow-sm shrink-0 z-50 relative transition-colors duration-300">
        <div className="w-full h-full px-6 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="flex items-center font-nunito font-bold text-2xl tracking-tight select-none">
                <span className="text-[#21348e] dark:text-blue-400 text-3xl mr-0.5 transition-colors">&lt;</span>
                <span className="text-[#21348e] dark:text-blue-400 transition-colors">ParticipaDF</span>
                <span className="text-[#55bbf5]">-Ouvidoria</span>
                <span className="text-[#55bbf5] text-3xl ml-0.5">&gt;</span>
              </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-muted-foreground">Ouvidoria Digital Acessível</span>
            <AcessibilidadeMenu />
            {isAuthenticated && (
              <button 
                onClick={logout}
                className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border shrink-0 h-full overflow-y-auto transition-colors duration-300">
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
      <ChatbotAssistente />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50 transition-colors duration-300">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={cn("flex flex-col items-center justify-center w-16 h-full gap-1 cursor-pointer", isActive ? "text-primary" : "text-muted-foreground")}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}