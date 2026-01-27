"""
Pydantic schemas para validação de dados de Usuário e Autenticação
Arquivo: backend/app/schemas/usuario.py
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ==============================================================================
# SCHEMAS DE ENTRADA (O que o usuário manda)
# ==============================================================================

class UsuarioCreate(BaseModel):
    """
    Dados necessários para CADASTRAR um novo usuário.
    """
    nome: str = Field(..., min_length=3, description="Nome completo")
    email: EmailStr # Valida automaticamente se tem @ e .com, etc.
    cpf: Optional[str] = Field(None, min_length=11, max_length=11, description="CPF apenas números")
    
    # A senha é obrigatória na criação e deve ter no mínimo 6 caracteres
    senha: str = Field(..., min_length=6, description="Senha para login")
    
    telefone: Optional[str] = None


class UsuarioLogin(BaseModel):
    """
    Dados necessários para fazer LOGIN.
    """
    email: EmailStr
    senha: str


# ==============================================================================
# SCHEMAS DE SAÍDA (O que o sistema devolve)
# ==============================================================================

class UsuarioResponse(BaseModel):
    """
    Dados públicos do usuário devolvidos pela API.
    ATENÇÃO: Nunca coloque o campo 'senha' aqui!
    """
    id: str
    nome: str
    email: EmailStr
    admin: bool
    ativo: bool
    data_criacao: datetime

    class Config:
        # Permite ler direto do objeto do banco de dados (SQLAlchemy)
        from_attributes = True


class Token(BaseModel):
    """
    Formato do Token JWT que o Frontend vai receber ao logar.
    """
    access_token: str
    token_type: str
    
class UsuarioUpdate(BaseModel):
    """
    Schema para atualizar dados do perfil (apenas o que é permitido).
    """
    telefone: Optional[str] = None