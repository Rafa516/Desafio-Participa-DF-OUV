"""
Protocolo model - SQLAlchemy ORM
"""

from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.sql import func
from app.models import Base


class Protocolo(Base):
    """
    Modelo para rastreamento de protocolos de manifestações
    Formato: OUVIDORIA-YYYYMMDD-XXXXXX
    """
    __tablename__ = "protocolos"

    # Identificadores
    numero = Column(String(50), primary_key=True, index=True)
    manifestacao_id = Column(String(36), index=True, nullable=False)

    # Sequência diária
    sequencia_diaria = Column(Integer, nullable=False)

    # Rastreamento
    data_geracao = Column(DateTime(timezone=True), server_default=func.now())
    data_expiracao = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Protocolo(numero={self.numero})>"
