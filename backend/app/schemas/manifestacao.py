"""
Pydantic schemas para validação de dados de Manifestacao
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class TipoManifestacaoSchema(str, Enum):
    """Tipos de manifestação"""
    TEXTO = "texto"
    AUDIO = "audio"
    VIDEO = "video"
    IMAGEM = "imagem"


class StatusManifestacaoSchema(str, Enum):
    """Status de processamento"""
    PENDENTE = "pendente"
    RECEBIDA = "recebida"
    EM_PROCESSAMENTO = "em_processamento"
    CONCLUIDA = "concluida"
    REJEITADA = "rejeitada"


class ManifestacaoCreate(BaseModel):
    """Schema para criação de manifestação"""
    titulo: str = Field(..., min_length=5, max_length=255)
    descricao_texto: Optional[str] = Field(None, max_length=12998)
    tipo_principal: TipoManifestacaoSchema = TipoManifestacaoSchema.TEXTO
    anonimo: bool = False

    @validator('titulo')
    def titulo_nao_vazio(cls, v):
        if not v.strip():
            raise ValueError('Título não pode ser vazio')
        return v.strip()


class ManifestacaoUpdate(BaseModel):
    """Schema para atualização de manifestação"""
    status: Optional[StatusManifestacaoSchema] = None
    descricao_texto: Optional[str] = Field(None, max_length=12998)


class ManifestacaoResponse(BaseModel):
    """Schema para resposta de manifestação"""
    id: str
    protocolo: str
    titulo: str
    descricao_texto: Optional[str]
    tipo_principal: TipoManifestacaoSchema
    anonimo: bool
    status: StatusManifestacaoSchema
    data_criacao: datetime
    data_atualizacao: Optional[datetime]

    class Config:
        from_attributes = True


class ManifestacaoListResponse(BaseModel):
    """Schema para listagem de manifestações"""
    total: int
    skip: int
    limit: int
    manifestacoes: list[ManifestacaoResponse]
