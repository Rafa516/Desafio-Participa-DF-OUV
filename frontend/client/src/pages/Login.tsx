import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react"; 
import { Link } from "wouter";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

// ============================================================================
// COMPONENTE DE LOGIN
// ----------------------------------------------------------------------------
// Página responsável pela autenticação do usuário.
// Funcionalidades:
// 1. Entrada de CPF (com máscara automática).
// 2. Entrada de Senha.
// 3. Sistema de Captcha (aparece se houver erro no login).
// 4. Feedback de erro visual.
// ============================================================================
export default function Login() {
  const { login } = useAuth(); // Acessa a função de login do contexto global
  
  // --- Estados do Formulário ---
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Controla o spinner de carregamento
  
  // --- Estados do Captcha ---
  const [captchaInput, setCaptchaInput] = useState(""); // O que o usuário digitou no captcha
  const [showCaptcha, setShowCaptcha] = useState(false); // Controla visibilidade do captcha
  const [errorMessage, setErrorMessage] = useState(""); // Mensagem de erro para o usuário

  // ==========================================================================
  // EFEITO: INICIALIZAÇÃO DO CAPTCHA
  // Carrega a biblioteca gráfica do captcha quando o estado 'showCaptcha' ativa.
  // ==========================================================================
  useEffect(() => {
    if (showCaptcha) loadCaptchaEnginge(6); // Gera um código de 6 caracteres
  }, [showCaptcha]);

  // ==========================================================================
  // FUNÇÃO: RECARREGAR CAPTCHA
  // Gera uma nova imagem caso a atual esteja difícil de ler.
  // ==========================================================================
  const handleRefreshCaptcha = () => {
    setCaptchaInput("");
    loadCaptchaEnginge(6);
  };

  // ==========================================================================
  // FUNÇÃO: MÁSCARA DE CPF
  // Formata o input enquanto o usuário digita para o padrão 000.000.000-00.
  // ==========================================================================
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
    if (value.length > 11) value = value.slice(0, 11); // Trava em 11 números
    
    // Aplica a formatação visual (pontos e traço)
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    setCpf(value);
  };

  // ==========================================================================
  // FUNÇÃO: SUBMIT DO FORMULÁRIO
  // Tenta realizar o login ou valida o captcha se necessário.
  // ==========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recarregar a página
    setErrorMessage(""); // Limpa erros antigos
    
    if (!cpf || !password) return; // Validação básica

    // Se o captcha estiver visível, valida ele ANTES de tentar logar
    if (showCaptcha) {
        if (validateCaptcha(captchaInput) === false) {
            setErrorMessage("Código de segurança incorreto.");
            setCaptchaInput(""); 
            loadCaptchaEnginge(6); // Gera novo código
            return; 
        }
    }

    setLoading(true); // Ativa spinner
    try {
      // Remove a formatação do CPF para enviar apenas números para a API
      const cpfLimpo = cpf.replace(/\D/g, "");
      await login(cpfLimpo, password);
      // Se der certo, o AuthContext redireciona o usuário.
    } catch (error) {
       // Se der erro (senha/cpf inválidos), ativa o modo de segurança (Captcha)
       setErrorMessage("Tentativa de acesso inválida, por segurança preencha o código");
       if (!showCaptcha) setShowCaptcha(true);
       else { 
           // Se já estava mostrando captcha e errou de novo, reseta o captcha
           setCaptchaInput(""); 
           loadCaptchaEnginge(6); 
       }
    } finally {
      setLoading(false); // Desativa spinner
    }
  };

  // ==========================================================================
  // RENDERIZAÇÃO DA PÁGINA DE LOGIN
  // ==========================================================================
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans transition-colors duration-300">
      
      {/* CSS Injetado para forçar o canvas do Captcha a ser responsivo */}
      <style>{`
        .react-simple-captcha-container a { display: none !important; }
        .react-simple-captcha-container canvas { width: 100% !important; height: 100% !important; }
      `}</style>

      {/* Cartão Centralizado */}
      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        
        <CardHeader className="text-center space-y-2 pb-6">
            {/* ====================================================================
               CORREÇÃO DE LAYOUT DO LOGO:
               O container abaixo usa 'flex-wrap' para permitir que o texto quebre
               de linha caso a fonte aumente muito (acessibilidade), mantendo o
               conteúdo centralizado ('justify-center') e legível.
               ====================================================================
            */}
            <div className="flex justify-center mb-2">
                <div className="flex flex-wrap justify-center items-center gap-1 font-nunito font-bold text-3xl tracking-tight select-none">
                    <span className="text-[#21348e] dark:text-blue-400">&lt;</span>
                    <span className="text-[#21348e] dark:text-blue-400">ParticipaDF</span>
                    <span className="text-[#55bbf5]">-Ouvidoria</span>
                    <span className="text-[#55bbf5]">&gt;</span>
                </div>
            </div>
            
            <CardTitle className="text-xl text-foreground">Acesse sua conta</CardTitle>
            <CardDescription>Entre para solicitar ou acompanhar suas manifestações</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input de CPF */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CPF</label>
              <Input
                type="text" 
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange} 
                required
                className="bg-background border-input"
                maxLength={14} 
              />
            </div>

            {/* Input de Senha */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <Link href="/esqueci-senha" className="text-xs text-primary hover:underline cursor-pointer">
                  Esqueci minha senha
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-input"
              />
            </div>
            
            {/* Bloco de Captcha (Condicional) */}
            {showCaptcha && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                   <label className="text-sm font-medium text-foreground">Segurança</label>
                   <div className="flex gap-2">
                      {/* Área da Imagem */}
                      <div className="react-simple-captcha-container bg-muted rounded border border-border overflow-hidden flex items-center justify-center w-32 h-10 shrink-0">
                          <LoadCanvasTemplate reloadText="" /> 
                      </div>
                      {/* Botão de Refresh */}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 shrink-0 border-border text-muted-foreground hover:text-primary hover:bg-muted"
                        onClick={handleRefreshCaptcha}
                        title="Trocar imagem"
                      >
                        <RefreshCw size={18} />
                      </Button>
                      {/* Input do Código */}
                      <Input
                        placeholder="CÓDIGO"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        required
                        className="bg-background h-10 text-center font-bold tracking-widest border-input"
                        maxLength={6}
                      />
                   </div>
                </div>
            )}

            {/* Exibição de Erros */}
            {errorMessage && (
                <div className="text-sm text-destructive font-medium text-center">
                    {errorMessage}
                </div>
            )}

            {/* Botão de Entrar */}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-10 text-sm font-medium text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
          
          {/* Link para Cadastro */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-primary hover:underline font-medium cursor-pointer">
                Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}