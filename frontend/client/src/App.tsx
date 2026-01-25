import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register"; 
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Rota Pública: Home */}
        <Route path="/" component={Home} />

        {/* Rotas de Autenticação */}
        <Route path="/login" component={Login} />
        {/* Rota para a tela de cadastro */}
        <Route path="/cadastro" component={Register} />
        {/* Rota para recuperação de senha */}
        <Route path="/esqueci-senha" component={ForgotPassword} />
        {/* Rota para redefinição de senha */}
        <Route path="/redefinir-senha" component={ResetPassword} />

        {/* --- ROTAS PROTEGIDAS (Requer autenticação) --- */}

        {/* Minhas Manifestações */}
        <Route path="/manifestacoes">
          <ProtectedRoute>
            <div className="p-4 text-center text-muted-foreground">Minhas Manifestações (Área Restrita)</div>
          </ProtectedRoute>
        </Route>

        {/* Nova Manifestação */}
        <Route path="/nova-manifestacao">
          <ProtectedRoute>
            <div className="p-4 text-center text-muted-foreground">Nova Manifestação (Em breve)</div>
          </ProtectedRoute>
        </Route>

        {/* Perfil */}
        <Route path="/perfil">
          <ProtectedRoute>
            <div className="p-4 text-center text-muted-foreground">Meu Perfil (Área Restrita)</div>
          </ProtectedRoute>
        </Route>

        {/* --- FIM ROTAS PROTEGIDAS --- */}

        <Route path="/chat-ajuda" component={() => <div className="p-4 text-center text-muted-foreground">Chat de Ajuda (Em breve)</div>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-center" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;