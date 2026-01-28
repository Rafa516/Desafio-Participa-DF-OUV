"""
Service de Movimentações
Arquivo: backend/app/services/movimentacao_service.py
"""
from uuid import uuid4
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_
from datetime import datetime, timezone, timedelta 

from app.models.movimentacao import Movimentacao
from app.models.manifestacao import Manifestacao
from app.models.usuario import Usuario 

FUSO_BRASIL = timezone(timedelta(hours=-3))

class MovimentacaoService:
    
    @staticmethod
    def listar_historico(db: Session, manifestacao_id: str, usuario_eh_admin: bool):
        query = db.query(Movimentacao)\
            .options(joinedload(Movimentacao.autor))\
            .filter(Movimentacao.manifestacao_id == manifestacao_id)

        if not usuario_eh_admin:
            query = query.filter(Movimentacao.interno == False)
            
        return query.order_by(Movimentacao.data_criacao.asc()).all()

    @staticmethod
    def criar_movimentacao(db: Session, manifestacao_id: str, usuario_id: str, texto: str, interno: bool = False, novo_status: str = None) -> Movimentacao:
        agora = datetime.now(FUSO_BRASIL)
        nova_mov = Movimentacao(
            id=str(uuid4()),
            manifestacao_id=manifestacao_id,
            autor_id=usuario_id,
            texto=texto,
            interno=interno,
            data_criacao=agora 
        )
        db.add(nova_mov)
        
        if novo_status:
            manifestacao = db.query(Manifestacao).filter(Manifestacao.id == manifestacao_id).first()
            if manifestacao:
                manifestacao.status = novo_status
                manifestacao.data_atualizacao = agora 
                if novo_status in ['concluida', 'rejeitada']:
                    manifestacao.data_conclusao = agora
                db.add(manifestacao)

        db.commit()
        db.refresh(nova_mov)
        return nova_mov

    @staticmethod
    def contar_novas_movimentacoes(db: Session, usuario_id: str, is_admin: bool) -> int:
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        
        # Se não tiver data de 'visto', usa a criação da conta para não pegar tudo desde o inicio dos tempos
        data_referencia = usuario.ultimo_visto_notificacoes or usuario.ultimo_acesso or usuario.data_criacao

        if not data_referencia:
            return 0

        # 1. Conta Novas Respostas (Movimentações) de outros autores
        query_mov = db.query(func.count(Movimentacao.id))\
            .join(Manifestacao, Movimentacao.manifestacao_id == Manifestacao.id)\
            .filter(Movimentacao.data_criacao > data_referencia)\
            .filter(Movimentacao.autor_id != usuario_id) 

        if not is_admin:
            query_mov = query_mov.filter(Manifestacao.usuario_id == usuario_id)
            query_mov = query_mov.filter(Movimentacao.interno == False)
        
        qtd_movimentacoes = query_mov.scalar() or 0

        # 2. Se for ADMIN, soma também as NOVAS MANIFESTAÇÕES criadas no período
        qtd_novas_manifestacoes = 0
        if is_admin:
            qtd_novas_manifestacoes = db.query(func.count(Manifestacao.id))\
                .filter(Manifestacao.data_criacao > data_referencia)\
                .scalar() or 0

        return qtd_movimentacoes + qtd_novas_manifestacoes

    @staticmethod
    def listar_notificacoes_detalhadas(db: Session, usuario_id: str, is_admin: bool):
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        data_referencia = usuario.ultimo_visto_notificacoes or usuario.ultimo_acesso or usuario.data_criacao
        
        if not data_referencia:
            return []

        notificacoes = []

        # A. Busca Movimentações (Respostas)
        query_mov = db.query(Movimentacao)\
            .join(Manifestacao, Movimentacao.manifestacao_id == Manifestacao.id)\
            .options(joinedload(Movimentacao.manifestacao))\
            .filter(Movimentacao.data_criacao > data_referencia)\
            .filter(Movimentacao.autor_id != usuario_id)

        if not is_admin:
            query_mov = query_mov.filter(Manifestacao.usuario_id == usuario_id)
            query_mov = query_mov.filter(Movimentacao.interno == False)
        
        movs = query_mov.order_by(desc(Movimentacao.data_criacao)).limit(5).all()
        for m in movs:
            notificacoes.append({
                "id": m.id,
                "protocolo": m.manifestacao.protocolo,
                "resumo": f"Nova resposta: {m.texto[:40]}...",
                "data": m.data_criacao
            })

        # B. Busca Novas Manifestações (SÓ ADMIN)
        if is_admin:
            novas_manif = db.query(Manifestacao)\
                .filter(Manifestacao.data_criacao > data_referencia)\
                .order_by(desc(Manifestacao.data_criacao))\
                .limit(5).all()
            
            for nm in novas_manif:
                # Tenta pegar o nome do assunto, se disponível
                tipo = "Manifestação"
                if hasattr(nm, 'assunto') and nm.assunto:
                    tipo = nm.assunto.nome
                
                notificacoes.append({
                    "id": nm.id,
                    "protocolo": nm.protocolo,
                    "resumo": f"🆕 Nova: {tipo}",
                    "data": nm.data_criacao
                })

        # Ordena tudo por data (decrescente) e pega as top 5 mais recentes
        notificacoes.sort(key=lambda x: x['data'], reverse=True)
        return notificacoes[:5]