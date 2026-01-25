import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { api } from "@/lib/api"; // Importamos a API direto para essa chamada específica
import { toast } from "sonner"; // Para avisos de sucesso/erro

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      
      // Criamos um objeto de formulário em vez de enviar JSON puro
      const formData = new URLSearchParams();
      formData.append("email", email);

      // Enviamos o formData. O Axios cuidará de configurar o Content-Type correto.
      await api.post("/auth/esqueci-senha", formData);
      
      setEnviado(true);
      toast.success("Solicitação enviada! Verifique seu e-mail.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-0">
        
        {/* CABEÇALHO */}
        <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                    <Mail className="h-8 w-8 text-blue-600" />
                </div>
            </div>
            <CardTitle className="text-xl text-slate-800">Recuperar Senha</CardTitle>
            <CardDescription>
                {!enviado 
                  ? "Digite seu e-mail para receber o link de redefinição" 
                  : "Verifique sua caixa de entrada"
                }
            </CardDescription>
        </CardHeader>

        <CardContent>
          {!enviado ? (
            // --- FORMULÁRIO DE ENVIO ---
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">E-mail cadastrado</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Link"}
              </Button>
            </form>
          ) : (
            // --- MENSAGEM DE SUCESSO ---
            <div className="text-center space-y-4 animate-in fade-in">
                <p className="text-sm text-slate-600">
                    Enviamos um link de recuperação para <strong>{email}</strong>. 
                    <br/>
                    (Verifique também sua caixa de spam).
                </p>
                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setEnviado(false)}
                >
                    Tentar outro e-mail
                </Button>
            </div>
          )}

          {/* LINK VOLTAR */}
          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}