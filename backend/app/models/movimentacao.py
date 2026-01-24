"""
Modelo de Movimentação (Tabela 'movimentacoes')
Arquivo: backend/app/models/movimentacao.py

OBJETIVO:
Esta tabela funciona como o "Chat" ou "Histórico" do chamado.
Cada linha nesta tabela representa UMA mensagem (seja do Cidadão ou do Admin).
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models import Base

class Movimentacao(Base):
    # Nome da tabela no Banco de Dados (PostgreSQL)
    __tablename__ = "movimentacoes"

    # ==========================================================================
    # COLUNAS (Dados Básicos)
    # ==========================================================================
    
    # ID único da mensagem (UUID)
    id = Column(String(36), primary_key=True, index=True)
    
    # O conteúdo da mensagem em si (Texto livre)
    texto = Column(Text, nullable=False)
    
    # Flag de Controle:
    # Se True: É uma nota técnica interna (o cidadão NÃO vê no portal).
    # Se False: É uma resposta pública (o cidadão vê).
    interno = Column(Boolean, default=False)
    
    # Data e Hora que a mensagem foi criada (automático pelo banco)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())

    # ==========================================================================
    # CHAVES ESTRANGEIRAS (Os "Links" do Banco de Dados)
    # ==========================================================================
    
    # 1. Link com a Manifestação (O Pai)
    # Diz: "Esta mensagem pertence ao chamado X"
    manifestacao_id = Column(String(36), ForeignKey("manifestacoes.id"), nullable=False)
    
    # 2. Link com o Usuário (O Autor)
    # Diz: "Esta mensagem foi escrita pelo usuário Y (seja Admin ou Cidadão)"
    autor_id = Column(String(36), ForeignKey("usuarios.id"), nullable=False)

   # ==========================================================================
    # RELACIONAMENTOS (Para o Python navegar entre as tabelas)
    # ==========================================================================
    
    manifestacao = relationship("Manifestacao", back_populates="movimentacoes")
    autor = relationship("Usuario", back_populates="movimentacoes")

    def __repr__(self):
        return f"<Movimentacao(id={self.id}, autor={self.autor_id})>"