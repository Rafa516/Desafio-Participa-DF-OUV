import { useState, useEffect } from "react";
import { Type, Sun, Moon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

// ============================================================================
// MENU DE ACESSIBILIDADE
// ----------------------------------------------------------------------------
// Controla o tamanho da fonte global e o tema (Claro/Escuro).
// O padrão deve ser SEMPRE 100% (Fonte Pequena/Normal) ao carregar.
// ============================================================================
export default function AcessibilidadeMenu() {
  const { theme, setTheme } = useTheme();
  
  // ESTADO: Tamanho da Fonte
  // Inicia estritamente em 100 (100% = 16px padrão do navegador)
  const [fontSize, setFontSize] = useState(100);

  // ==========================================================================
  // EFEITO: APLICAR TAMANHO DA FONTE
  // Toda vez que o usuário mudar o valor (fontSize), aplicamos na tag <html>.
  // Isso garante que todo o site (que usa 'rem') escale proporcionalmente.
  // ==========================================================================
  useEffect(() => {
    // Aplica o estilo inline no HTML (ex: style="font-size: 100%")
    // Isso sobrescreve qualquer CSS global que estivesse aumentando a fonte.
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  // ==========================================================================
  // FUNÇÃO: ALTO CONTRASTE
  // Alterna uma classe CSS global para modos de alto contraste (se houver CSS para isso).
  // ==========================================================================
  const toggleHighContrast = () => {
    document.documentElement.classList.toggle("high-contrast");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Opções de Acessibilidade">
          <Eye size={20} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acessibilidade</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* OPÇÃO: AUMENTAR FONTE */}
        {/* Limitei o máximo a 150% para não quebrar o layout drasticamente */}
        <DropdownMenuItem onClick={() => setFontSize(prev => Math.min(prev + 10, 150))}>
          <Type className="mr-2 h-4 w-4" />
          Aumentar Fonte (+A)
        </DropdownMenuItem>

        {/* OPÇÃO: DIMINUIR FONTE */}
        {/* Limitei o mínimo a 80% para quem precisa de fonte bem pequena */}
        <DropdownMenuItem onClick={() => setFontSize(prev => Math.max(prev - 10, 80))}>
          <Type className="mr-2 h-4 w-4" />
          Diminuir Fonte (-A)
        </DropdownMenuItem>

        {/* OPÇÃO: RESETAR PARA PADRÃO */}
        {/* Volta para 100% (O padrão "Pequeno/Normal") */}
        <DropdownMenuItem onClick={() => setFontSize(100)}>
          <Type className="mr-2 h-4 w-4" />
          Fonte Padrão (Normal)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* OPÇÃO: ALTERNAR TEMA (CLARO/ESCURO) */}
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          Alternar Tema
        </DropdownMenuItem>
        
        {/* OPÇÃO: ALTO CONTRASTE */}
        <DropdownMenuItem onClick={toggleHighContrast}>
          <Eye className="mr-2 h-4 w-4" />
          Alto Contraste
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}