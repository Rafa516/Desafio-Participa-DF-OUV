import { Link, useLocation } from "wouter"; // Importa hook para saber em qual página estamos
import { Home, PlusCircle, List, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils"; // Utilitário para juntar classes CSS
import SkipLink from "./SkipLink";
import AcessibilidadeMenu from "./AcessibilidadeMenu";
import ChatbotAssistente from "./ChatbotAssistente";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  // 1. Identifica a página atual
  const [location] = useLocation();
  const { logout, isAuthenticated } = useAuth(); // Pega a função de logout

  // --- LÓGICA DE LAYOUT LIMPO ---
  // Verifica se estamos na página de Login OU Cadastro.
  // Se for uma dessas, retorna apenas o conteúdo centralizado (sem menus/cabeçalhos).
  if (location === "/login" || location === "/cadastro" || location === "/esqueci-senha" || location === "/redefinir-senha") {
    return (
      <main className="min-h-screen bg-slate-50 font-sans text-foreground">
        {/* Renderiza apenas o formulário (filho) */}
        {children}
      </main>
    );
  }

  // --- CONFIGURAÇÃO DO MENU (Para as outras páginas) ---
  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: List, label: "Minhas", path: "/manifestacoes" },
    { icon: PlusCircle, label: "Nova", path: "/nova-manifestacao", highlight: true },
    { icon: MessageSquare, label: "Chat", path: "/chat-ajuda" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ];

  // --- LAYOUT PADRÃO (Com Cabeçalho, Menu e Chatbot) ---
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Link de acessibilidade para leitores de tela */}
      <SkipLink />
      
      {/* --- CABEÇALHO (Desktop e Mobile) --- */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
           
           {/* LOGOTIPO NO CABEÇALHO */}
           <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center font-nunito font-bold text-2xl tracking-tight select-none">
                {/* Parte Esquerda (Escura) */}
                <span className="text-[#21348e] text-3xl mr-0.5">&lt;</span>
                <span className="text-[#21348e]">ParticipaDF</span>
                
                {/* Parte Direita (Clara) - Nome da aplicação */}
                <span className="text-[#55bbf5]">-Ouvidoria</span>
                <span className="text-[#55bbf5] text-3xl ml-0.5">&gt;</span>
              </div>
            </div>
          </div>
          
          {/* Menu de Acessibilidade (Direita) */}
        <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-muted-foreground">Ouvidoria Digital Acessível</span>
            <AcessibilidadeMenu />

            {/* --- BLOCO: Botão Sair --- */}
            {isAuthenticated && (
              <button 
                onClick={logout}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-red-100"
                title="Sair do sistema"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>

          
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main id="main-content" className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 focus:outline-none" tabIndex={-1}>
        {children}
      </main>

      {/* --- CHATBOT DORA --- */}
      {/* Só aparece aqui (fora do 'if' de login/cadastro) */}
      <ChatbotAssistente />

      {/* --- MENU INFERIOR (Apenas Celular/Mobile) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border/50 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            // Verifica qual botão está ativo
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-200 cursor-pointer",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    item.highlight && "relative -top-5" // Efeito de destaque para o botão do meio
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center transition-all duration-200",
                      // Estilo especial para o botão de destaque (Nova Manifestação)
                      item.highlight
                        ? "w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30"
                        : "w-8 h-8 rounded-xl",
                      isActive && !item.highlight && "bg-primary/10"
                    )}
                  >
                    <item.icon
                      size={item.highlight ? 28 : 22}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  <span className={cn("text-[10px] font-medium", item.highlight && "mt-1")}>
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