"""
Manifestacao model - SQLAlchemy ORM
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from app.models import Base


class TipoManifestacao(str, enum.Enum):
    """Tipos de manifestação suportados"""
    TEXTO = "texto"
    AUDIO = "audio"
    VIDEO = "video"
    IMAGEM = "imagem"


class StatusManifestacao(str, enum.Enum):
    """Status de processamento da manifestação"""
    PENDENTE = "pendente"
    RECEBIDA = "recebida"
    EM_PROCESSAMENTO = "em_processamento"
    CONCLUIDA = "concluida"
    REJEITADA = "rejeitada"


class Manifestacao(Base):
    """
    Modelo para armazenar manifestações dos cidadãos
    """
    __tablename__ = "manifestacoes"

    # Identificadores
    id = Column(String(36), primary_key=True, index=True)
    protocolo = Column(String(50), unique=True, index=True, nullable=False)

    # Conteúdo
    titulo = Column(String(255), nullable=False)
    descricao_texto = Column(Text, nullable=True)
    tipo_principal = Column(Enum(TipoManifestacao), default=TipoManifestacao.TEXTO)

    # Arquivos
    caminho_audio = Column(String(500), nullable=True)
    caminho_video = Column(String(500), nullable=True)
    caminho_imagem = Column(String(500), nullable=True)

    # Metadados
    anonimo = Column(Boolean, default=False)
    status = Column(Enum(StatusManifestacao), default=StatusManifestacao.PENDENTE)
    
    # Rastreamento
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    data_atualizacao = Column(DateTime(timezone=True), onupdate=func.now())
    data_conclusao = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    usuario = relationship("Usuario", back_populates="manifestacoes")

    def __repr__(self):
        return f"<Manifestacao(protocolo={self.protocolo}, status={self.status})>"
