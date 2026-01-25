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
  
  // ==========================================================================
  // BUSCA DO TOKEN NA URL
  // ==========================================================================
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenUrl = queryParams.get("token");
    if (tokenUrl) {
        setToken(tokenUrl);
    } else {
        toast.error("Link inválido ou expirado.");
    }
  }, []);

  // ==========================================================================
  // ESTADOS DO COMPONENTE
  // ==========================================================================
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erroSenha, setErroSenha] = useState(""); 

  // ==========================================================================
  // FUNÇÃO DE ENVIO (SUBMIT)
  // ==========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha(""); // Limpa erros anteriores

    // Validações Básicas antes de enviar ao Back
    if (!token) {
        setErroSenha("Token inválido ou ausente.");
        return;
    }

    if (senha !== confirmar) {
        setErroSenha("As senhas não coincidem.");
        return;
    }

    if (senha.length < 8) {
        setErroSenha("A senha precisa ter no mínimo 8 caracteres.");
        return;
    }

    setLoading(true);
    try {
      // Como o backend usa Form(...), enviamos via URLSearchParams
      const params = new URLSearchParams();
      params.append("token", token);
      params.append("nova_senha", senha);

      // Enviamos os params. O Axios, com a correção do api.ts, 
      // identificará isso como formulário automaticamente.
      await api.post("/auth/redefinir-senha", params);
      
      toast.success("Senha alterada com sucesso!");
      setLocation("/login"); 
    } catch (error: any) {
      console.error("Erro detalhado do backend:", error);

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
          // Erro padrão do FastAPI (ex: erro de validação do Pydantic)
          setErroSenha(detail[0].msg);
      } else if (typeof detail === "string") {
          // Erro personalizado do seu raise HTTPException(detail="...")
          setErroSenha(detail);
      } else {
          setErroSenha("Erro ao redefinir. O link pode ter expirado ou a senha é muito simples.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-0">
        
        {/* CABEÇALHO */}
        <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-4">
                <div className="bg-blue-50 p-3 rounded-full">
                    <Lock className="h-8 w-8 text-blue-600" />
                </div>
            </div>
            <CardTitle className="text-xl text-slate-800">Nova Senha</CardTitle>
            <CardDescription>Crie uma nova senha segura para sua conta</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CAMPO NOVA SENHA COM TOOLTIP DE REGRAS */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">Nova Senha</label>
                  
                  {/* BADGE COM TOOLTIP (Mantive sua lógica idêntica) */}
                  <div className="group relative flex items-center">
                    <Info className="h-4 w-4 text-slate-400 cursor-help hover:text-blue-600 transition-colors" />
                    <div className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <div className="bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700">
                        <p className="font-bold text-blue-400 mb-1">Regras de Segurança:</p>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300">
                          <li>Mínimo de 8 caracteres</li>
                          <li>Pelo menos uma letra (a-z)</li>
                          <li>Pelo menos um número ou símbolo</li>
                        </ul>
                        <div className="absolute top-full left-1/2 -mt-1 -ml-1 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  </div>
              </div>

              <Input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => {
                    setSenha(e.target.value);
                    setErroSenha(""); 
                }}
                required
                className={`bg-white ${erroSenha ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>

            {/* CAMPO CONFIRMAR SENHA */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Confirmar Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmar}
                onChange={(e) => {
                    setConfirmar(e.target.value);
                    setErroSenha("");
                }}
                required
                className={`bg-white ${erroSenha ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>

            {/* MENSAGEM DE ERRO VISUAL (Tratada para ser apenas string) */}
            {erroSenha && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{erroSenha}</span>
                </div>
            )}

            {/* BOTÃO DE AÇÃO */}
            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 h-10" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Nova Senha"}
            </Button>
          </form>

          {/* LINK DE VOLTAR */}
           <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft size={16} /> Cancelar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}