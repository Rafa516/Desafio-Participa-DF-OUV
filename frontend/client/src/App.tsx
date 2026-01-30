import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext"; 

import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register"; 
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MinhasManifestacoes from "./pages/MinhasManifestacoes";
import DetalhesManifestacao from "./pages/DetalhesManifestacao";
import MeuPerfil from "./pages/MeuPerfil";
import NovaManifestacao from "./pages/NovaManifestacao"; 
import GerenciarAssuntos from "@/pages/admin/GerenciarAssuntos";
import TodasManifestacoes from "@/pages/admin/TodasManifestacoes";

// REMOVI O IMPORT DO CHATBOT DAQUI POIS ELE JÁ ESTÁ NO LAYOUT

function Router() {
  const { user } = useAuth();

  return (
    <Layout>
      <Switch>
        {/* LOGIN É A HOME (RAIZ) */}
        <Route path="/" component={Login} />
        
        <Route path="/inicio" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Register} />
        <Route path="/esqueci-senha" component={ForgotPassword} />
        <Route path="/redefinir-senha" component={ResetPassword} />

        {user?.admin ? (
           <Route path="/manifestacoes">
             <ProtectedRoute>
               <TodasManifestacoes />
             </ProtectedRoute>
           </Route>
        ) : (
           <Route path="/manifestacoes">
             <ProtectedRoute>
               <MinhasManifestacoes />
             </ProtectedRoute>
           </Route>
        )}

        {user?.admin && (
          <Route path="/admin/assuntos" component={GerenciarAssuntos} />
        )}

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
            <MeuPerfil/>
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
          <ChatProvider>
            <TooltipProvider>
             
              <Toaster 
                position="top-center" 
                toastOptions={{
                  style: { 
                    marginTop: '10px', 
                    zIndex: 99999,
                  },
                  classNames: {
                    toast: "!bg-blue-600 !text-white !border-blue-500 shadow-xl font-semibold",
                    title: "!text-white",
                    description: "!text-blue-100",
                    actionButton: "!bg-white !text-blue-600",
                    cancelButton: "!bg-blue-700 !text-white",
                    error: "!bg-red-600 !text-white !border-red-500",
                    success: "!bg-green-600 !text-white !border-green-500",
                    warning: "!bg-amber-500 !text-white !border-amber-400",
                    info: "!bg-blue-600 !text-white !border-blue-500"
                  }
                }}
              />
              <Router />
             
            </TooltipProvider>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;