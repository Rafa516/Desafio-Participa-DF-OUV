import { api, Manifestacao, Assunto } from "@/lib/api";

export const manifestacaoService = {
  async listarAssuntos(): Promise<Assunto[]> {
    const response = await api.get<Assunto[]>("/assuntos");
    return response.data;
  },

  async criarManifestacao(data: FormData): Promise<Manifestacao> {
    // O endpoint espera multipart/form-data para uploads
    const response = await api.post<Manifestacao>("/manifestacoes", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async consultarPorProtocolo(protocolo: string): Promise<Manifestacao> {
    const response = await api.get<Manifestacao>(`/manifestacoes/${protocolo}`);
    return response.data;
  },

  async listarMinhasManifestacoes(): Promise<Manifestacao[]> {
    // TODO: Implementar filtro por usuário quando houver auth
    const response = await api.get<Manifestacao[]>("/manifestacoes");
    return response.data;
  }
};
