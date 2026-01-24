"""
Pydantic schemas para validação de dados de Protocolo
Arquivo: backend/app/schemas/protocolo.py
Objetivo: Definir o formato de dados para criação e leitura de protocolos e rastreamento.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# ==============================================================================
# SCHEMAS DE ENTRADA (Input)
# ==============================================================================

class ProtocoloCreate(BaseModel):
    """
    Schema para criação interna de protocolo.
    Geralmente usado pelo Service, já que o usuário não cria protocolo manualmente.
    """
    manifestacao_id: str = Field(..., min_length=36, max_length=36, description="UUID da manifestação vinculada")
    # Nota: O número e a sequência são gerados automaticamente pelo sistema/banco.


# ==============================================================================
# SCHEMAS DE SAÍDA (Response)
# ==============================================================================

class ProtocoloResponse(BaseModel):
    """
    Schema completo para detalhes do protocolo (Visão Administrativa/Sistema).
    Reflete a tabela 'protocolos' do banco.
    """
    numero: str
    manifestacao_id: str
    sequencia_diaria: int
    data_geracao: datetime
    data_expiracao: Optional[datetime] = None # Importante para saber o prazo legal

    class Config:
        from_attributes = True


class ProtocoloRastreamento(BaseModel):
    """
    Schema simplificado para o Cidadão (Visão Pública).
    Usado na tela de "Acompanhar Manifestação".
    """
    numero: str
    status_manifestacao: str # Ex: PENDENTE, CONCLUIDA (Vem do relacionamento)
    data_geracao: datetime
    data_expiracao: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

    class Config:
        from_attributes = True