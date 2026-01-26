import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { api } from "@/lib/api"; 
import { toast } from "sonner"; 

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("email", email);
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
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 font-sans transition-colors duration-300">
      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        
        <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <Mail className="h-8 w-8 text-primary" />
                </div>
            </div>
            <CardTitle className="text-xl text-foreground">Recuperar Senha</CardTitle>
            <CardDescription className="text-muted-foreground">
                {!enviado ? "Digite seu e-mail para receber o link" : "Verifique sua caixa de entrada"}
            </CardDescription>
        </CardHeader>

        <CardContent>
          {!enviado ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">E-mail cadastrado</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 animate-in fade-in">
                <p className="text-sm text-muted-foreground">
                    Enviamos um link de recuperação para <strong>{email}</strong>. 
                    <br/>(Verifique também sua caixa de spam).
                </p>
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted" onClick={() => setEnviado(false)}>
                    Tentar outro e-mail
                </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-primary flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}