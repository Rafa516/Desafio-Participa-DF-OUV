import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Definição do que o nosso Contexto oferece para o resto do app
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (dados: any) => Promise<void>; // <--- NOVA FUNÇÃO: Registro
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Verifica se já tem token ao abrir o site
useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);   
      // Decodifica o token para pegar o nome
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        // Salva o nome no estado 'user'
        // Verifica se o backend manda como 'nome', 'name' ou 'sub'
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

  // --- FUNÇÃO DE LOGIN ---
  const login = async (username: string, password: string) => {
    try {
      // 1. Faz a requisição para o Backend
      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("username", username);
      params.append("password", password);

      const response = await api.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token } = response.data;
      
      // 2. Salva o token no navegador
      localStorage.setItem("token", access_token);
      
      try {
        const base64Url = access_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        // Atualiza a memória do app COM O NOME imediatamente
        setUser({ 
            nome: payload.nome || payload.sub, 
            ...payload 
        });
        
      } catch (e) {
        console.error("Erro ao decodificar token no login:", e);
      }

      // 3. Libera o acesso e redireciona
      setIsAuthenticated(true);
      toast.success("Login realizado com sucesso!");
      setLocation("/"); 

    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("CPF ou senha incorretos.");
      throw error;
    }
  };

  // --- FUNÇÃO: REGISTRAR ---
  const register = async (dados: any) => {
    try {
      // Faz o POST para o endpoint de criação de usuário
      // O backend espera um JSON com { nome, email, cpf, senha, telefone }
      await api.post("/auth/registrar", dados);
      
      // Se der certo, avisa o usuário
      toast.success("Conta criada com sucesso! Faça login.");
      
      // Redireciona para a tela de login para ele entrar com a nova senha
      setLocation("/login"); 
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      
      // Tenta pegar a mensagem de erro específica do Backend (ex: "CPF já cadastrado")
      // Se não tiver mensagem, usa uma genérica
      const msg = error.response?.data?.detail || "Erro ao criar conta. Verifique os dados.";
      
      toast.error(msg);
      throw error; // Repassa o erro para o formulário parar o loading
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