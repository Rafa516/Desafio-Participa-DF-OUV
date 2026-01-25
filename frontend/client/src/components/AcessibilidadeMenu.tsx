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

export default function AcessibilidadeMenu() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

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
        
        <DropdownMenuItem onClick={() => setFontSize(prev => Math.min(prev + 10, 150))}>
          <Type className="mr-2 h-4 w-4" />
          Aumentar Fonte (+A)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setFontSize(prev => Math.max(prev - 10, 80))}>
          <Type className="mr-2 h-4 w-4" />
          Diminuir Fonte (-A)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setFontSize(100)}>
          <Type className="mr-2 h-4 w-4" />
          Fonte Padrão
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          Alternar Tema
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={toggleHighContrast}>
          <Eye className="mr-2 h-4 w-4" />
          Alto Contraste
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
