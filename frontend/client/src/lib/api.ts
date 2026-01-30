import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- CORREÇÃO: REDIRECIONAMENTO 401 ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Sessão expirada.");
      localStorage.removeItem("token");
      // AGORA VAI PARA /LOGIN
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface Manifestacao {
  protocolo: string;
  tipo: string;
  assunto_id: number;
  descricao: string;
  status: string;
  anonimo: boolean;
  created_at: string;
  anexos?: Anexo[];
  movimentacoes?: Movimentacao[];
  usuario?: { nome: string }; // Adicionado para evitar erro de tipo no Painel Admin
  assunto?: { nome: string }; // Adicionado para evitar erro de tipo
  classificacao?: string;     // Adicionado para compatibilidade
  data_criacao?: string;      // Adicionado para compatibilidade de data
}

export interface Anexo {
  id: number;
  tipo: string;
  arquivo_url: string;
}

export interface Movimentacao {
  id: number;
  tipo: string;
  conteudo: string;
  created_at: string;
  autor?: string;
}

export interface Assunto {
  id: number;
  nome: string;
  campos_extra: any;
}