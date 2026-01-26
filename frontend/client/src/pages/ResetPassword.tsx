import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock, ArrowLeft, Info, AlertCircle } from "lucide-react"; 
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function ResetPassword() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState("");
  
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenUrl = queryParams.get("token");
    if (tokenUrl) setToken(tokenUrl);
    else toast.error("Link inválido ou expirado.");
  }, []);

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erroSenha, setErroSenha] = useState(""); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha(""); 

    if (!token) { setErroSenha("Token inválido ou ausente."); return; }
    if (senha !== confirmar) { setErroSenha("As senhas não coincidem."); return; }
    if (senha.length < 8) { setErroSenha("A senha precisa ter no mínimo 8 caracteres."); return; }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("token", token);
      params.append("nova_senha", senha);
      await api.post("/auth/redefinir-senha", params);
      toast.success("Senha alterada com sucesso!");
      setLocation("/login"); 
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) setErroSenha(detail[0].msg);
      else if (typeof detail === "string") setErroSenha(detail);
      else setErroSenha("Erro ao redefinir. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans transition-colors duration-300">
      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        
        <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <Lock className="h-8 w-8 text-primary" />
                </div>
            </div>
            <CardTitle className="text-xl text-foreground">Nova Senha</CardTitle>
            <CardDescription className="text-muted-foreground">Crie uma nova senha segura para sua conta</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Nova Senha</label>
                  <div className="group relative flex items-center">
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                    <div className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <div className="bg-popover text-popover-foreground text-xs rounded-lg p-3 shadow-xl border border-border">
                        <p className="font-bold text-primary mb-1">Regras de Segurança:</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-90">
                          <li>Mínimo de 8 caracteres</li>
                          <li>Pelo menos uma letra (a-z)</li>
                          <li>Pelo menos um número ou símbolo</li>
                        </ul>
                      </div>
                    </div>
                  </div>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErroSenha(""); }}
                required
                className={`bg-background border-input ${erroSenha ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmar Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setErroSenha(""); }}
                required
                className={`bg-background border-input ${erroSenha ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
            </div>

            {erroSenha && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{erroSenha}</span>
                </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-10 text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Nova Senha"}
            </Button>
          </form>

           <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-primary flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft size={16} /> Cancelar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}