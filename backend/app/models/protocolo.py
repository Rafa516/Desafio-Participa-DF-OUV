"""
Protocolo model - SQLAlchemy ORM
"""

from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models import Base


class Protocolo(Base):
    """
    Modelo para rastreamento de protocolos de manifestações.
    
    Finalidade:
    - Armazenar o histórico de geração de protocolos.
    - Controlar prazos (SLA) de resposta.
    - Manter auditoria sequencial diária.
    
    Formato do Número: OUVIDORIA-YYYYMMDD-XXXXXX
    """
    __tablename__ = "protocolos"

    # ==========================================================================
    # IDENTIFICADORES
    # ==========================================================================
    # O próprio número do protocolo é a chave primária
    numero = Column(String(50), primary_key=True, index=True, comment="Ex: OUVIDORIA-20260121-A1B2C3")
    
    # Chave estrangeira ligando à tabela de manifestações
    # Garante que todo protocolo pertença a uma manifestação real
    manifestacao_id = Column(String(36), ForeignKey("manifestacoes.id"), index=True, nullable=False)

    # ==========================================================================
    # CONTROLE DE SEQUÊNCIA
    # ==========================================================================
    # Armazena qual o número deste protocolo no dia (1º do dia, 2º do dia...)
    # Usado para lógica de "ultima_sequencia + 1"
    sequencia_diaria = Column(Integer, nullable=False)

    # ==========================================================================
    # DATAS E PRAZOS
    # ==========================================================================
    # Data exata que o protocolo foi gerado
    data_geracao = Column(DateTime(timezone=True), server_default=func.now())
    
    # Data limite para resposta (Calculado: data_geracao + dias de prazo legal)
    data_expiracao = Column(DateTime(timezone=True), nullable=True)

    # ==========================================================================
    # RELACIONAMENTOS (ORM)
    # ==========================================================================
    # Permite acessar os dados da manifestação através do objeto protocolo
    # Exemplo: protocolo.manifestacao.relato
    manifestacao = relationship("Manifestacao")

    def __repr__(self):
        return f"<Protocolo(numero={self.numero}, sequencia={self.sequencia_diaria})>"