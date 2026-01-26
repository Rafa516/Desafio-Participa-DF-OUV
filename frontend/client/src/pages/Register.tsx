import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Loader2, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [erroSenha, setErroSenha] = useState(""); 
  
  const [formData, setFormData] = useState({
    nome: "", email: "", cpf: "", telefone: "", senha: "", confirmarSenha: ""
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { id, value } = e.target;
    if (id === "senha" || id === "confirmarSenha") setErroSenha(""); 
    if (id === "cpf") value = handleCpfChange(value);
    if (id === "telefone") value = handlePhoneChange(value);
    if (id === "nome") value = value.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setErroSenha(""); 

    if (formData.senha !== formData.confirmarSenha) { setErroSenha("As senhas não coincidem."); return; }
    if (formData.senha.length < 8) { setErroSenha("A senha deve ter no mínimo 8 caracteres."); return; }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("nome", formData.nome);
      params.append("email", formData.email);
      params.append("cpf", formData.cpf.replace(/\D/g, ""));
      params.append("telefone", formData.telefone);
      params.append("senha", formData.senha);
      await register(params);
    } catch (error: any) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) setErroSenha(detail[0].msg);
        else if (typeof detail === "string") setErroSenha(detail);
        else setErroSenha("E-mail ou CPF já cadastrados ou senha inválida.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 font-sans transition-colors duration-300">
      <Card className="w-full max-w-lg shadow-xl border-border bg-card">
        
        <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
                <div className="flex items-center font-nunito font-bold text-3xl tracking-tight select-none">
                    <span className="text-[#21348e] dark:text-blue-400 mr-1">&lt;</span>
                    <span className="text-[#21348e] dark:text-blue-400">ParticipaDF</span>
                    <span className="text-[#55bbf5]">-Ouvidoria</span>
                    <span className="text-[#55bbf5] ml-1">&gt;</span>
                </div>
            </div>
            <CardTitle className="text-xl text-foreground">Crie sua conta</CardTitle>
            <CardDescription>Preencha os dados abaixo para se registrar</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <form onSubmit={onSubmit}>
            <div className="grid gap-4">
              
              <div className="grid gap-2">
                <Label htmlFor="nome" className="text-foreground">Nome Completo</Label>
                <Input id="nome" placeholder="Ex: Maria da Silva" value={formData.nome} onChange={handleChange} required className="bg-background border-input" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="cpf" className="text-foreground">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} maxLength={14} required className="bg-background border-input" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="telefone" className="text-foreground">Telefone</Label>
                    <Input id="telefone" placeholder="(61) 90000-0000" value={formData.telefone} onChange={handleChange} required className="bg-background border-input" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-foreground">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={handleChange} required className="bg-background border-input" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="senha" className="text-foreground">Senha</Label>
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
                    <Input id="senha" type="password" placeholder="••••••••" value={formData.senha} onChange={handleChange} required className={`bg-background border-input ${erroSenha ? "border-destructive focus-visible:ring-destructive" : ""}`} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="confirmarSenha" className="text-foreground">Confirmar Senha</Label>
                    <Input id="confirmarSenha" type="password" placeholder="••••••••" value={formData.confirmarSenha} onChange={handleChange} required className={`bg-background border-input ${erroSenha ? "border-destructive focus-visible:ring-destructive" : ""}`} />
                </div>
              </div>

              {erroSenha && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{erroSenha}</span>
                </div>
              )}

              <Button className="w-full bg-primary hover:bg-primary/90 mt-2 text-primary-foreground" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-2">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium cursor-pointer">Faça login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}