import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react"; 
import { Link } from "wouter";

// Import da lib de Captcha
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

export default function Login() {
  const { login } = useAuth();
  
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");

  // Controla a visibilidade do captcha
  const [showCaptcha, setShowCaptcha] = useState(false);
  // Controla a mensagem de erro
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (showCaptcha) {
      loadCaptchaEnginge(6); 
    }
  }, [showCaptcha]);

  const handleRefreshCaptcha = () => {
    setCaptchaInput("");
    loadCaptchaEnginge(6);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); 
    if (value.length > 11) value = value.slice(0, 11); 

    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setCpf(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setErrorMessage(""); 
    
    if (!cpf || !password) return;

    // Se o captcha estiver visível, obriga a validação
    if (showCaptcha) {
        if (validateCaptcha(captchaInput) === false) {
            setErrorMessage("Código de segurança incorreto.");
            setCaptchaInput(""); 
            loadCaptchaEnginge(6); 
            return; 
        }
    }

    setLoading(true); 
    try {
      const cpfLimpo = cpf.replace(/\D/g, "");
      await login(cpfLimpo, password);
    } catch (error) {
       // Mensagem padrão de erro
       setErrorMessage("Tentativa de acesso inválida, por segurança preencha o código");
       
       if (!showCaptcha) {
           // Ativa o captcha na primeira falha
           setShowCaptcha(true);
       } else {
           // Se já falhou antes, reseta a imagem
           setCaptchaInput("");
           loadCaptchaEnginge(6); 
       }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
      
      {/* CSS para ajustar o Canvas */}
      <style>{`
        .react-simple-captcha-container a { display: none !important; }
        .react-simple-captcha-container canvas { width: 100% !important; height: 100% !important; }
      `}</style>

      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-2">
                <div className="flex items-center font-nunito font-bold text-3xl tracking-tight select-none">
                    <span className="text-[#21348e] mr-1">&lt;</span>
                    <span className="text-[#21348e]">ParticipaDF</span>
                    <span className="text-[#55bbf5]">-Ouvidoria</span>
                    <span className="text-[#55bbf5] ml-1">&gt;</span>
                </div>
            </div>
            <CardTitle className="text-xl text-slate-800">Acesse sua conta</CardTitle>
            <CardDescription>Entre para solicitar ou acompanhar suas manifestações</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">CPF</label>
              <Input
                type="text" 
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange} 
                required
                className="bg-white"
                maxLength={14} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Senha</label>
                {/* Link de Esqueci Senha */}
                <Link href="/esqueci-senha" className="text-xs text-blue-600 hover:underline cursor-pointer">
                  Esqueci minha senha
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            
            {/* Bloco Condicional de Segurança */}
            {showCaptcha && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                   <label className="text-sm font-medium text-slate-700">Segurança</label>
                   
                   {/* Layout Separado: Imagem | Botão | Input */}
                   <div className="flex gap-2">
                      
                      {/* Imagem (Caixa Cinza) */}
                      <div className="react-simple-captcha-container bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center w-32 h-10 shrink-0">
                          <LoadCanvasTemplate reloadText="" /> 
                      </div>

                      {/* Botão Refresh (Quadrado) */}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 shrink-0 bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={handleRefreshCaptcha}
                        title="Trocar imagem"
                      >
                        <RefreshCw size={18} />
                      </Button>

                      {/* Input (Caixa Branca Padrão) */}
                      <Input
                        placeholder="CÓDIGO"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        required
                        className="bg-white h-10 text-center font-bold uppercase tracking-widest"
                        maxLength={6}
                      />
                   </div>
                </div>
            )}

            {/* Mensagem de Erro Simples (Vermelha) */}
            {errorMessage && (
                <div className="text-sm text-red-500 font-medium text-center">
                    {errorMessage}
                </div>
            )}

            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 h-10 text-sm font-medium" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-blue-600 hover:underline font-medium cursor-pointer">
                Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}