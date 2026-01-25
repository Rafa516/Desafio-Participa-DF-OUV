import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Loader2, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const { register } = useAuth();
  
  // ===========================================================================
  // ESTADOS DE CONTROLE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(false);
  const [erroSenha, setErroSenha] = useState(""); 
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    senha: "",
    confirmarSenha: ""
  });

  // ===========================================================================
  // MÁSCARAS DE FORMATAÇÃO (CPF e Telefone)
  // ===========================================================================
  const handleCpfChange = (value: string) => {
    value = value.replace(/\D/g, ""); 
    if (value.length > 11) value = value.slice(0, 11); 
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value;
  };

  const handlePhoneChange = (value: string) => {
    value = value.replace(/\D/g, ""); 
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2"); 
    value = value.replace(/(\d)(\d{4})$/, "$1-$2"); 
    return value;
  };

  // ===========================================================================
  // MANIPULAÇÃO DE INPUTS
  // ===========================================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { id, value } = e.target;
    
    if (id === "senha" || id === "confirmarSenha") setErroSenha(""); 

    if (id === "cpf") value = handleCpfChange(value);
    if (id === "telefone") value = handlePhoneChange(value);

    if (id === "nome") {
        value = value.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
    }

    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // ===========================================================================
  // ENVIO DO FORMULÁRIO (Submit)
  // ===========================================================================
  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setErroSenha(""); 

    // Validação básica local
    if (formData.senha !== formData.confirmarSenha) {
        setErroSenha("As senhas não coincidem.");
        return;
    }

    if (formData.senha.length < 8) {
        setErroSenha("A senha deve ter no mínimo 8 caracteres.");
        return;
    }

    setIsLoading(true);

    try {
      
     
      const params = new URLSearchParams();
      params.append("nome", formData.nome);
      params.append("email", formData.email);
      params.append("cpf", formData.cpf.replace(/\D/g, "")); // Envia apenas números
      params.append("telefone", formData.telefone);
      params.append("senha", formData.senha);

      // Chamamos a função do contexto passando os params formatados
      await register(params);
      
    } catch (error: any) {
        // --- PROTEÇÃO CONTRA ERRO DE "REACT CHILD" ---
        // Extraímos apenas o texto da mensagem para não quebrar a interface.
        const detail = error.response?.data?.detail;
        
        if (Array.isArray(detail)) {
            // Erro padrão do FastAPI (Pydantic)
            setErroSenha(detail[0].msg);
        } else if (typeof detail === "string") {
            // Erro manual (raise HTTPException)
            setErroSenha(detail);
        } else {
            setErroSenha("E-mail ou CPF já cadastrados ou senha inválida.");
        }
    } finally {
      setIsLoading(false);
    }
  }

  // ===========================================================================
  // INTERFACE (JSX)
  // ===========================================================================
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-lg shadow-xl border-0">
        
        <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
                <div className="flex items-center font-nunito font-bold text-3xl tracking-tight select-none">
                    <span className="text-[#21348e] mr-1">&lt;</span>
                    <span className="text-[#21348e]">ParticipaDF</span>
                    <span className="text-[#55bbf5]">-Ouvidoria</span>
                    <span className="text-[#55bbf5] ml-1">&gt;</span>
                </div>
            </div>
            <CardTitle className="text-xl text-slate-800">Crie sua conta</CardTitle>
            <CardDescription>
            Preencha os dados abaixo para se registrar
            </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <form onSubmit={onSubmit}>
            <div className="grid gap-4">
              
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input 
                  id="nome" 
                  placeholder="Ex: Maria da Silva" 
                  value={formData.nome}
                  onChange={handleChange}
                  required 
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input 
                    id="cpf" 
                    placeholder="000.000.000-00" 
                    value={formData.cpf}
                    onChange={handleChange}
                    maxLength={14}
                    required 
                    className="bg-white"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input 
                    id="telefone" 
                    placeholder="(61) 90000-0000" 
                    value={formData.telefone}
                    onChange={handleChange}
                    required 
                    className="bg-white"
                    />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="senha">Senha</Label>
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
                    id="senha" 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.senha}
                    onChange={handleChange}
                    required 
                    className={`bg-white ${erroSenha ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                    <Input 
                    id="confirmarSenha" 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    required 
                    className={`bg-white ${erroSenha ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                </div>
              </div>

              {/* MENSAGEM DE ERRO VISUAL (TRATADA) */}
              {erroSenha && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{erroSenha}</span>
                </div>
              )}

              <Button className="w-full bg-blue-700 hover:bg-blue-800 mt-2" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cadastrar
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-2">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium cursor-pointer">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}