import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Phone, Edit2, Save, X, FileText, Fingerprint, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

const formatData = (dataString: string | undefined) => {
  if (!dataString) return "Primeiro acesso";
  try {
    const date = new Date(dataString);
    if (isNaN(date.getTime())) return "Data inválida";
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "Data inválida";
  }
};

export default function MeuPerfil() {
  // ==========================================================================
  // HOOKS E ESTADOS
  // ==========================================================================
  
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: ""
  });

  // ==========================================================================
  // EFEITOS
  // ==========================================================================
  
  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || "",
        email: user.email || "",
        cpf: user.cpf || "",
        telefone: user.telefone || "" 
      });
    }
  }, [user]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // CORREÇÃO AQUI: O nome da chave no seu AuthContext é apenas "token"
      let token = localStorage.getItem("token"); 
      
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      // Previne erros se o localStorage tiver salvo com aspas extras
      token = token.replace(/"/g, ''); 

      // Envia para a rota de atualização
      await axios.put("http://localhost:8000/api/auth/atualizar-perfil", {
        telefone: formData.telefone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Telefone atualizado com sucesso!");
      setIsEditing(false);
      
      toast.info("Para ver o novo telefone no menu lateral, faça login novamente.");
      
    } catch (error: any) {
      console.error("Erro update:", error);
      
      if (error.response?.status === 401) {
        toast.error("Erro 401: Token inválido. Tente sair e entrar novamente.");
        logout(); 
      } else {
        toast.error("Erro ao atualizar perfil.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(prev => ({ ...prev, telefone: user?.telefone || "" }));
    setIsEditing(false);
  };

  // ==========================================================================
  // RENDERIZAÇÃO
  // ==========================================================================

  return (
    <div className="w-full h-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Cartão Esquerda */}
          <Card className="md:col-span-1 border-border shadow-sm h-fit">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-32 h-32 relative mb-4">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                    {user?.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-background" title="Ativo"></div>
              </div>
              <CardTitle className="text-xl font-bold truncate">{user?.nome}</CardTitle>
              
              <div className="flex flex-col items-center gap-1 mt-2">
                <CardDescription className="flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3 text-primary" />
                  {user?.admin ? 'Administrador' : 'Cidadão'}
                </CardDescription>
                
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full mt-1">
                  <CalendarClock className="w-3 h-3" />
                  <span>Acesso: {formatData(user?.ultimo_acesso)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-muted/30 p-4 rounded-lg text-center text-sm text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Histórico disponível em "Minhas Manifestações"</p>
              </div>
            </CardContent>
          </Card>

          {/* Cartão Direita (Formulário) */}
          <Card className="md:col-span-2 border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <div>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Informações registradas no sistema.</CardDescription>
              </div>
              
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit2 className="w-4 h-4" /> Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isLoading}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave} disabled={isLoading} className="gap-2">
                    {isLoading ? "Salvando..." : <><Save className="w-4 h-4" /> Salvar</>}
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" /> Nome Completo
                  </Label>
                  <Input 
                    value={formData.nome} 
                    disabled={true} 
                    className="bg-muted border-border font-medium text-foreground cursor-not-allowed opacity-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" /> E-mail
                  </Label>
                  <Input 
                    value={formData.email} 
                    disabled={true} 
                    className="bg-muted border-border font-medium text-foreground cursor-not-allowed opacity-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Fingerprint className="w-4 h-4" /> CPF
                  </Label>
                  <Input 
                    value={formData.cpf} 
                    disabled={true} 
                    className="bg-muted border-border font-medium text-foreground cursor-not-allowed opacity-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" /> Telefone
                  </Label>
                  <Input 
                    value={formData.telefone} 
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    disabled={!isEditing} 
                    placeholder="(00) 00000-0000"
                    className={`border-border font-medium text-base text-foreground ${!isEditing ? 'bg-muted cursor-not-allowed opacity-100' : 'bg-background'}`}
                  />
                </div>

              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" /> Segurança
                </h3>
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">Para alterar sua senha, faça logout e utilize a opção "Esqueci minha senha".</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}