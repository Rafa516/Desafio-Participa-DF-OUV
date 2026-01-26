import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react"; 
import { Link } from "wouter";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

export default function Login() {
  const { login } = useAuth();
  
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (showCaptcha) loadCaptchaEnginge(6); 
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
       setErrorMessage("Tentativa de acesso inválida, por segurança preencha o código");
       if (!showCaptcha) setShowCaptcha(true);
       else { setCaptchaInput(""); loadCaptchaEnginge(6); }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans transition-colors duration-300">
      
      <style>{`
        .react-simple-captcha-container a { display: none !important; }
        .react-simple-captcha-container canvas { width: 100% !important; height: 100% !important; }
      `}</style>

      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-2">
                <div className="flex items-center font-nunito font-bold text-3xl tracking-tight select-none">
                    <span className="text-[#21348e] dark:text-blue-400 mr-1">&lt;</span>
                    <span className="text-[#21348e] dark:text-blue-400">ParticipaDF</span>
                    <span className="text-[#55bbf5]">-Ouvidoria</span>
                    <span className="text-[#55bbf5] ml-1">&gt;</span>
                </div>
            </div>
            <CardTitle className="text-xl text-foreground">Acesse sua conta</CardTitle>
            <CardDescription>Entre para solicitar ou acompanhar suas manifestações</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
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
            
            {showCaptcha && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                   <label className="text-sm font-medium text-foreground">Segurança</label>
                   <div className="flex gap-2">
                      <div className="react-simple-captcha-container bg-muted rounded border border-border overflow-hidden flex items-center justify-center w-32 h-10 shrink-0">
                          <LoadCanvasTemplate reloadText="" /> 
                      </div>
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

            {errorMessage && (
                <div className="text-sm text-destructive font-medium text-center">
                    {errorMessage}
                </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-10 text-sm font-medium text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
          
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