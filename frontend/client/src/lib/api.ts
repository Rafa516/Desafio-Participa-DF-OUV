import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// --- INSTÂNCIA CORRIGIDA ---
export const api = axios.create({
  baseURL: API_URL,

});

// --- INTERCEPTOR DE REQUISIÇÃO ---
// Antes de qualquer requisição sair do front-end, este código é executado.
api.interceptors.request.use((config) => {
  // 1. Tenta recuperar o token salvo no navegador
  const token = localStorage.getItem("token");
  
  // 2. Se o token existir, adiciona no cabeçalho "Authorization"
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- INTERCEPTOR DE RESPOSTA ---
// Toda vez que o back-end responde, este código verifica se houve erro.
api.interceptors.response.use(
  (response) => response, // Se deu certo, só passa pra frente
  (error) => {
    // Se o erro for 401 (Não Autorizado), significa que o token venceu ou é inválido
    if (error.response?.status === 401) {
      console.warn("Sessão expirada ou token inválido.");
      // Aqui poderíamos forçar um logout automático se quiséssemos:
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// --- TIPAGENS (Interfaces Typescript) ---
// Mantive as interfaces que você já tinha para garantir compatibilidade
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