"""
Assunto model - SQLAlchemy ORM
"""

from sqlalchemy import Column, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.models import Base


class Assunto(Base):
    """
    Modelo para armazenar os tipos de assunto e seus campos dinâmicos
    """
    __tablename__ = "assuntos"

    # Identificadores
    id = Column(String(36), primary_key=True, index=True)
    nome = Column(String(255), unique=True, index=True, nullable=False)
    descricao = Column(Text, nullable=True)

    # Campos dinâmicos
    campos_adicionais = Column(JSON, nullable=True)

    # Status
    ativo = Column(Boolean, default=True)

    # Relacionamentos
    manifestacoes = relationship("Manifestacao", back_populates="assunto")

    def __repr__(self):
        return f"<Assunto(nome={self.nome})>"
