import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (dados: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);   
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        setUser({ 
            nome: payload.nome || payload.name || payload.sub,
            ...payload 
        });
      } catch (e) {
        console.error("Erro ao ler dados do usuário:", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("username", username);
      params.append("password", password);

      const response = await api.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      
      let userData = null;

      try {
        const base64Url = access_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        userData = JSON.parse(jsonPayload);
        
        setUser({ 
            nome: userData.nome || userData.sub, 
            ...userData 
        });
        
      } catch (e) {
        console.error("Erro ao decodificar token no login:", e);
      }

      setIsAuthenticated(true);
      toast.success("Login realizado com sucesso!");
      
      // --- CORREÇÃO: REDIRECIONAMENTO DE ADMIN ---
      // Agora ambos vão para /inicio (Onde fica o Dashboard do Admin e a Home do Cidadão)
      if (userData?.admin) {
          setLocation("/inicio"); 
      } else {
          setLocation("/inicio"); 
      }

    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("CPF ou senha incorretos.");
      throw error;
    }
  };

  const register = async (dados: any) => {
    try {
      await api.post("/auth/registrar", dados);
      toast.success("Conta criada com sucesso! Faça login.");
      setLocation("/login"); 
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      const msg = error.response?.data?.detail || "Erro ao criar conta. Verifique os dados.";
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setLocation("/login"); 
    toast.info("Você saiu do sistema.");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);