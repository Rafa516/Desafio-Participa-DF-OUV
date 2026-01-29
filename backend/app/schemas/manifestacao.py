"""
Pydantic schemas para validação de dados de Manifestacao
Arquivo: backend/app/schemas/manifestacao.py
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# ==============================================================================
# ENUMS 
# ==============================================================================

class ClassificacaoManifestacaoSchema(str, Enum):
    """Classificação conforme Instrução Normativa"""
    RECLAMACAO = "reclamacao"
    DENUNCIA = "denuncia"
    ELOGIO = "elogio"
    SUGESTAO = "sugestao"
    INFORMACAO = "informacao"
    SOLICITACAO = "solicitacao"


class StatusManifestacaoSchema(str, Enum):
    """Status de processamento"""
    PENDENTE = "pendente"
    RECEBIDA = "recebida"
    EM_PROCESSAMENTO = "em_processamento"
    CONCLUIDA = "concluida"
    REJEITADA = "rejeitada"


# ==============================================================================
# SCHEMAS DE ENTRADA (Input)
# ==============================================================================

class ManifestacaoCreate(BaseModel):
    """
    Schema para validação da ENTRADA de dados (Criação)
    """
    relato: str = Field(..., min_length=10, max_length=13000, description="O texto principal da manifestação")
    assunto_id: str = Field(..., min_length=1, description="ID do assunto selecionado")
    classificacao: ClassificacaoManifestacaoSchema = ClassificacaoManifestacaoSchema.RECLAMACAO
    dados_complementares: Optional[Dict[str, Any]] = None
    anonimo: bool = False

    @validator('relato')
    def relato_nao_vazio(cls, v):
        """Garante que o relato não seja apenas espaços em branco"""
        if not v.strip():
            raise ValueError('Relato não pode ser vazio')
        return v.strip()


class ManifestacaoUpdate(BaseModel):
    """Schema para atualização de manifestação"""
    status: Optional[StatusManifestacaoSchema] = None
    dados_complementares: Optional[Dict[str, Any]] = None


# ==============================================================================
# SCHEMAS DE SAÍDA (Response)
# ==============================================================================

class AnexoResponse(BaseModel):
    id: str
    arquivo_url: str
    tipo_arquivo: str
    tamanho: int
    data_upload: datetime

    class Config:
        from_attributes = True

class AssuntoSimplesResponse(BaseModel):
    id: str
    nome: str
    
    class Config:
        from_attributes = True

# --- Schema para devolver dados do Cidadão ---
class UsuarioInfo(BaseModel):
    id: str
    nome: str
    email: str
    cpf: Optional[str]
    telefone: Optional[str]

    class Config:
        from_attributes = True

class ManifestacaoResponse(BaseModel):
    """
    Schema para formatar a SAÍDA completa da Manifestação
    """
    id: str
    protocolo: str
    relato: str
    assunto_id: str
    
    assunto: Optional[AssuntoSimplesResponse] = None 
    
    #  Campo usuário incluído na resposta ---
    usuario: Optional[UsuarioInfo] = None

    classificacao: ClassificacaoManifestacaoSchema
    dados_complementares: Optional[Dict[str, Any]]
    anonimo: bool
    status: str 
    data_criacao: datetime
    data_atualizacao: Optional[datetime]
    
    anexos: List[AnexoResponse] = []

    class Config:
        from_attributes = True


class ManifestacaoListResponse(BaseModel):
    """Schema para listagem paginada"""
    total: int
    skip: int
    limit: int
    manifestacoes: List[ManifestacaoResponse]