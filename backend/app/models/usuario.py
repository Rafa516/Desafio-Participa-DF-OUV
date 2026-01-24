"""
Usuario model - SQLAlchemy ORM
Arquivo: backend/app/models/usuario.py
"""

from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models import Base


class Usuario(Base):
    """
    Modelo para usuários do sistema.
    Atende tanto o CIDADÃO (que abre manifestação) quanto o ADMIN (que responde).
    """
    __tablename__ = "usuarios"

    # ==========================================================================
    # IDENTIFICADORES E ACESSO
    # ==========================================================================
    id = Column(String(36), primary_key=True, index=True)
    
    # E-mail é a chave de login (unique=True impede duplicidade)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # CPF opcional (pode ser usado para validar cidadão real)
    cpf = Column(String(11), unique=True, index=True, nullable=True)

    # ==========================================================================
    # SEGURANÇA (Adicionado para Autenticação)
    # ==========================================================================
    # Armazena o hash Bcrypt da senha. NUNCA armazene senhas em texto puro!
    senha_hash = Column(String(255), nullable=True) 
    
    # Define se é um gestor da ouvidoria (True) ou cidadão comum (False)
    admin = Column(Boolean, default=False)

    # ==========================================================================
    # DADOS PESSOAIS
    # ==========================================================================
    nome = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=True)

    # ==========================================================================
    # STATUS E AUDITORIA
    # ==========================================================================
    # Se False, o usuário não consegue logar (banido ou inativo)
    ativo = Column(Boolean, default=True)

    # Datas automáticas
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    ultimo_acesso = Column(DateTime(timezone=True), nullable=True)

    # ==========================================================================
    # RELACIONAMENTOS
    # ==========================================================================
    # Relacionamento com as manifestações criadas por este usuário.
    # Nota: Para funcionar, a tabela 'manifestacoes' precisará ter uma coluna 'usuario_id'.
    # Por enquanto, deixamos configurado aqui.
    manifestacoes = relationship("Manifestacao", back_populates="usuario")

    def __repr__(self):
        return f"<Usuario(email={self.email}, nome={self.nome}, admin={self.admin})>"
    
    movimentacoes = relationship("Movimentacao", back_populates="autor")