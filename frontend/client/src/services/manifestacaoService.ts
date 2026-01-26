// ==========================================
// BLOCO 1: IMPORTAÇÕES
// ==========================================
import { api, Manifestacao, Assunto } from "@/lib/api";

export const manifestacaoService = {
  
  // ==========================================
  // BLOCO 2: LISTAGEM DE ASSUNTOS
  // ==========================================
  async listarAssuntos(): Promise<Assunto[]> {
    const response = await api.get<Assunto[]>("/assuntos");
    return response.data;
  },

  // ==========================================
  // BLOCO 3: CRIAÇÃO DE MANIFESTAÇÃO 
  // ==========================================
  async criarManifestacao(data: FormData): Promise<Manifestacao> {
    // 1. Recupera o token atualizado do armazenamento
    const token = localStorage.getItem("token"); 

    // 2. Trava de segurança: Se não tiver token, nem tenta enviar
    if (!token) {
      // Isso força o usuário a perceber que caiu a sessão
      window.location.href = "/login"; 
      throw new Error("Sessão expirada.");
    }

    // 3. Envia com a barra "/" no final para evitar Redirect 307
    const response = await api.post<Manifestacao>("/manifestacoes/", data, {
      headers: {
        // Força o envio do Token no padrão Bearer
        "Authorization": `Bearer ${token}`
      }
    });
    return response.data;
  },

  // ==========================================
  // BLOCO 4: CONSULTA POR PROTOCOLO
  // ==========================================
  async consultarPorProtocolo(protocolo: string): Promise<Manifestacao> {
    const response = await api.get<Manifestacao>(`/manifestacoes/${protocolo}`);
    return response.data;
  },

  // ==========================================
  // BLOCO 5: LISTAGEM DE MANIFESTAÇÕES
  // ==========================================
  async listarMinhasManifestacoes(): Promise<Manifestacao[]> {
    const response = await api.get<Manifestacao[]>("/manifestacoes");
    return response.data;
  }
};