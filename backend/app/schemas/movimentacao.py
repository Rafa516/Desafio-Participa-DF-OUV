"""
Schema Pydantic para Movimentações
Arquivo: backend/app/schemas/movimentacao.py
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

# ==============================================================================
# ENUMS 
# ==============================================================================

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

class MovimentacaoCreate(BaseModel):
    texto: str = Field(..., min_length=1, description="O conteúdo da resposta")
    interno: bool = False
    
    
    novo_status: Optional[StatusManifestacaoSchema] = None


# ==============================================================================
# SCHEMAS DE SAÍDA (Response)
# ==============================================================================

class MovimentacaoResponse(BaseModel):
    id: str
    texto: str
    interno: bool
    data_criacao: datetime
    
    # Campos extras para o front
    autor_nome: str
    autor_admin: bool

    class Config:
        from_attributes = True