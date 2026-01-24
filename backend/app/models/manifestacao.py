"""
Manifestacao model - SQLAlchemy ORM
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.models import Base


class ClassificacaoManifestacao(str, enum.Enum):
    """Classificação da manifestação conforme Instrução Normativa"""
    RECLAMACAO = "reclamacao"
    DENUNCIA = "denuncia"
    ELOGIO = "elogio"
    SUGESTAO = "sugestao"
    INFORMACAO = "informacao"
    SOLICITACAO = "solicitacao"


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
    relato = Column(Text, nullable=False)
    dados_complementares = Column(JSON, nullable=True)
    classificacao = Column(Enum(ClassificacaoManifestacao), default=ClassificacaoManifestacao.RECLAMACAO)

    # Metadados
    anonimo = Column(Boolean, default=False)
    status = Column(Enum(StatusManifestacao), default=StatusManifestacao.PENDENTE)
    
    # Rastreamento
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    data_atualizacao = Column(DateTime(timezone=True), onupdate=func.now())
    data_conclusao = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    assunto_id = Column(String(36), ForeignKey("assuntos.id"), nullable=False)
    assunto = relationship("Assunto", back_populates="manifestacoes")
    
    # FK para usuario é opcional (para manifestações anônimas)
    usuario_id = Column(String(36), ForeignKey("usuarios.id"), nullable=True)
    usuario = relationship("Usuario", back_populates="manifestacoes")
    
    anexos = relationship("Anexo", back_populates="manifestacao", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Manifestacao(protocolo={self.protocolo}, status={self.status})>"
    
    movimentacoes = relationship("Movimentacao", back_populates="manifestacao", cascade="all, delete-orphan")

