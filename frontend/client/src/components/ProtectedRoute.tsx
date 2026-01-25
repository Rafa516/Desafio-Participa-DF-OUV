import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Enquanto verifica se tem token salvo, mostra um "Carregando..."
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Verificando acesso...</div>;
  }

  // Se NÃO estiver logado, redireciona para /login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Se estiver logado, libera o acesso à página
  return <>{children}</>;
}