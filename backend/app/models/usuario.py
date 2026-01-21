"""
Usuario model - SQLAlchemy ORM
"""

from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models import Base


class Usuario(Base):
    """
    Modelo para usuários que registram manifestações não-anônimas
    """
    __tablename__ = "usuarios"

    # Identificadores
    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    cpf = Column(String(11), unique=True, index=True, nullable=True)

    # Dados pessoais
    nome = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=True)

    # Status
    ativo = Column(Boolean, default=True)

    # Rastreamento
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    ultimo_acesso = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    manifestacoes = relationship("Manifestacao", back_populates="usuario")

    def __repr__(self):
        return f"<Usuario(email={self.email}, nome={self.nome})>"
