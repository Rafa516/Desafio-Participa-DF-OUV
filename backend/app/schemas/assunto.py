"""
Pydantic schemas para validação de dados de Assunto
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class AssuntoCreate(BaseModel):
    """Schema para criação de assunto"""
    nome: str = Field(..., min_length=3, max_length=255)
    descricao: Optional[str] = None
    campos_adicionais: Optional[Dict[str, Any]] = None


class AssuntoUpdate(BaseModel):
    """Schema para atualização de assunto"""
    nome: Optional[str] = None
    descricao: Optional[str] = None
    campos_adicionais: Optional[Dict[str, Any]] = None
    ativo: Optional[bool] = None


class AssuntoResponse(BaseModel):
    """Schema para resposta de assunto"""
    id: str
    nome: str
    descricao: Optional[str]
    campos_adicionais: Optional[Dict[str, Any]]
    ativo: bool

    class Config:
        from_attributes = True


class AssuntoListResponse(BaseModel):
    """Schema para listagem de assuntos"""
    total: int
    assuntos: list[AssuntoResponse]
