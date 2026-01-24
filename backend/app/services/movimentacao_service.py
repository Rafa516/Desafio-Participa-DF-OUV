"""
Service de Movimentações
Arquivo: backend/app/services/movimentacao_service.py
Objetivo: Contém a lógica de negócio para criar e listar interações.
"""
from sqlalchemy.orm import Session
from uuid import uuid4
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional

# Importamos os Modelos (Banco de Dados)
from app.models.movimentacao import Movimentacao
from app.models.manifestacao import Manifestacao
from app.models.usuario import Usuario

class MovimentacaoService:

    @staticmethod
    def criar_movimentacao(
        db: Session, 
        manifestacao_id: str, 
        usuario_id: str, 
        texto: str, 
        interno: bool = False,
        novo_status: Optional[str] = None
    ) -> Movimentacao:
        """
        Cria uma nova interação (resposta) e opcionalmente atualiza o status da manifestação.
        """
        
        # 1. VERIFICAÇÃO: A manifestação existe?
        # Antes de salvar a resposta, precisamos garantir que o "pai" existe.
        manifestacao = db.query(Manifestacao).filter(Manifestacao.id == manifestacao_id).first()
        if not manifestacao:
            raise HTTPException(status_code=404, detail="Manifestação não encontrada")

        # 2. CRIAÇÃO: Monta o objeto da mensagem
        nova_movimentacao = Movimentacao(
            id=str(uuid4()),               # Gera um ID único
            manifestacao_id=manifestacao_id, # Linka com a manifestação
            autor_id=usuario_id,           # Linka com quem está logado
            texto=texto,
            interno=interno,
            data_criacao=datetime.now()
        )
        
        # Adiciona a mensagem na "fila" do banco
        db.add(nova_movimentacao)

        # 3. ATUALIZAÇÃO DO PAI (Lógica Extra)
        # Se o admin mandou um novo status, atualizamos a Manifestação também
        if novo_status:
            manifestacao.status = novo_status
            manifestacao.data_atualizacao = datetime.now()
            
            # Se o status for "concluida", gravamos a data de fechamento
            if novo_status == "concluida":
                manifestacao.data_conclusao = datetime.now()

        # 4. FINALIZAÇÃO: Salva tudo no banco (Commit)
        db.commit()
        
        # Recarrega o objeto para garantir que temos os dados atualizados (como datas)
        db.refresh(nova_movimentacao)
        
        return nova_movimentacao

    @staticmethod
    def listar_historico(db: Session, manifestacao_id: str, usuario_eh_admin: bool):
        """
        Busca todas as mensagens de uma manifestação.
        """
        # Pega todas as movimentações daquela manifestação
        query = db.query(Movimentacao).filter(Movimentacao.manifestacao_id == manifestacao_id)
        
        # REGRA DE SEGURANÇA:
        # Se quem está pedindo NÃO for admin (ou seja, é o cidadão),
        # filtramos para esconder as mensagens marcadas como "interno".
        if not usuario_eh_admin:
            query = query.filter(Movimentacao.interno == False)
            
        # Retorna ordenado por data (da mais antiga para a mais nova)
        return query.order_by(Movimentacao.data_criacao).all()