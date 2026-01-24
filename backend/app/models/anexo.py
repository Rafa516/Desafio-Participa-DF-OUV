"""
Anexo model - SQLAlchemy ORM
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models import Base


class Anexo(Base):
    """
    Modelo para armazenar anexos das manifestações
    """
    __tablename__ = "anexos"

    # Identificadores
    id = Column(String(36), primary_key=True, index=True)
    manifestacao_id = Column(String(36), ForeignKey("manifestacoes.id"), nullable=False)

    # Dados do arquivo
    arquivo_url = Column(String(500), nullable=False)
    tipo_arquivo = Column(String(50), nullable=False)
    tamanho = Column(Integer, nullable=False)  # Em bytes

    # Rastreamento
    data_upload = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    manifestacao = relationship("Manifestacao", back_populates="anexos")

    def __repr__(self):
        return f"<Anexo(id={self.id}, tipo={self.tipo_arquivo})>"
