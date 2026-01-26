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
import MinhasManifestacoes from "./pages/MinhasManifestacoes";
import DetalhesManifestacao from "./pages/DetalhesManifestacao";
// Importação do componente real
import NovaManifestacao from "./pages/NovaManifestacao"; 

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Rota Pública */}
        <Route path="/" component={Home} />

        {/* Rotas de Autenticação */}
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Register} />
        <Route path="/esqueci-senha" component={ForgotPassword} />
        <Route path="/redefinir-senha" component={ResetPassword} />

        {/* --- ROTAS PROTEGIDAS --- */}

        <Route path="/manifestacoes">
          <ProtectedRoute>
            <MinhasManifestacoes />
          </ProtectedRoute>
        </Route>

        <Route path="/manifestacao/:protocolo">
        <ProtectedRoute>
          <DetalhesManifestacao />
        </ProtectedRoute>
      </Route>

       
        <Route path="/nova-manifestacao">
          <ProtectedRoute>
            <NovaManifestacao />
          </ProtectedRoute>
        </Route>

        

        <Route path="/perfil">
          <ProtectedRoute>
            <div className="p-4 text-center text-muted-foreground">Meu Perfil</div>
          </ProtectedRoute>
        </Route>

        <Route path="/chat-ajuda" component={() => <div className="p-4 text-center text-muted-foreground">Chat de Ajuda</div>} />
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