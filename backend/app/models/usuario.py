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
    email = Column(String(255), unique=True, index=True, nullable=False)
    cpf = Column(String(11), unique=True, index=True, nullable=True)

    # ==========================================================================
    # SEGURANÇA
    # ==========================================================================
    senha_hash = Column(String(255), nullable=True) 
    admin = Column(Boolean, default=False)

    # ==========================================================================
    # DADOS PESSOAIS
    # ==========================================================================
    nome = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=True)

    # ==========================================================================
    # STATUS E AUDITORIA
    # ==========================================================================
    ativo = Column(Boolean, default=True)

    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    
    # Data mostrada no "Meu Perfil" (atualizada em todo login)
    ultimo_acesso = Column(DateTime(timezone=True), nullable=True)
    
    # NOVO CAMPO: Data de referência para o sininho (atualizada ao clicar em "Marcar como lido")
    ultimo_visto_notificacoes = Column(DateTime(timezone=True), nullable=True)

    # ==========================================================================
    # RELACIONAMENTOS
    # ==========================================================================
    manifestacoes = relationship("Manifestacao", back_populates="usuario")
    movimentacoes = relationship("Movimentacao", back_populates="autor")

    def __repr__(self):
        return f"<Usuario(email={self.email}, nome={self.nome}, admin={self.admin})>"