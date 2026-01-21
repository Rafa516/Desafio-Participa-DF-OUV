"""
Pydantic schemas para validação de dados de Protocolo
"""

from pydantic import BaseModel, Field
from datetime import datetime


class ProtocoloCreate(BaseModel):
    """Schema para criação de protocolo"""
    manifestacao_id: str = Field(..., min_length=1)


class ProtocoloResponse(BaseModel):
    """Schema para resposta de protocolo"""
    numero: str
    manifestacao_id: str
    sequencia_diaria: int
    data_geracao: datetime

    class Config:
        from_attributes = True


class ProtocoloRastreamento(BaseModel):
    """Schema para rastreamento de protocolo"""
    numero: str
    status: str
    data_geracao: datetime
    data_atualizacao: Optional[datetime] = None


from typing import Optional
