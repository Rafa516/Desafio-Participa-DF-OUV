"""
Manifestacao Business Logic Service
Arquivo: backend/app/services/manifestacao_service.py
"""

from sqlalchemy.orm import Session, joinedload 
from sqlalchemy import desc, func, cast, Date
from uuid import uuid4
from datetime import datetime, timedelta
from typing import List, Dict, Optional

from app.models.manifestacao import Manifestacao
from app.models.protocolo import Protocolo
from app.models.anexo import Anexo
from app.schemas.manifestacao import ManifestacaoCreate
import logging

logger = logging.getLogger(__name__)

class ManifestacaoService:
    """
    Serviço para gerenciar toda a regra de negócio das manifestações.
    Centraliza a criação de Manifestação + Protocolo + Anexos.
    """

    # ==========================================
    # BLOCO 1: CRIAR MANIFESTAÇÃO (POST)
    # ==========================================
    @staticmethod
    def criar_manifestacao(
        db: Session, 
        manifestacao_data: ManifestacaoCreate,
        usuario_id: Optional[str] = None, 
        arquivos_metadata: List[Dict] = []
    ) -> Manifestacao:
        # 1. Gerar IDs e Datas
        manifestacao_id = str(uuid4())
        data_hoje = datetime.now()
        
        data_formatada = data_hoje.strftime("%Y%m%d")
        sufixo = str(uuid4().hex)[:6].upper()
        protocolo_texto = f"OUVIDORIA-{data_formatada}-{sufixo}"
        
        data_limite = data_hoje + timedelta(days=30)

        ultima_sequencia = db.query(func.max(Protocolo.sequencia_diaria))\
            .filter(cast(Protocolo.data_geracao, Date) == data_hoje.date())\
            .scalar()
        nova_sequencia = (ultima_sequencia or 0) + 1

        nova_manifestacao = Manifestacao(
            id=manifestacao_id,
            protocolo=protocolo_texto,
            relato=manifestacao_data.relato,
            assunto_id=manifestacao_data.assunto_id,
            classificacao=manifestacao_data.classificacao,
            dados_complementares=manifestacao_data.dados_complementares,
            anonimo=manifestacao_data.anonimo,
            usuario_id=usuario_id, 
            status="pendente",
            data_criacao=data_hoje
        )

        novo_protocolo = Protocolo(
            numero=protocolo_texto,
            manifestacao_id=manifestacao_id,
            sequencia_diaria=nova_sequencia,
            data_geracao=data_hoje,
            data_expiracao=data_limite
        )

        try:
            db.add(nova_manifestacao)
            db.add(novo_protocolo)
            db.flush() 

            for arq in arquivos_metadata:
                novo_anexo = Anexo(
                    id=str(uuid4()),
                    manifestacao_id=manifestacao_id,
                    arquivo_url=arq['caminho'],
                    tipo_arquivo=arq['tipo'],
                    tamanho=arq['tamanho']
                )
                db.add(novo_anexo)

            db.commit()
            db.refresh(nova_manifestacao)
            _ = nova_manifestacao.assunto 
            
            logger.info(f"Manifestação criada com sucesso: {protocolo_texto}")
            return nova_manifestacao

        except Exception as e:
            db.rollback()
            logger.error(f"Erro ao criar manifestação: {str(e)}")
            raise e

    # ==========================================
    # BLOCO 2: CONSULTA POR PROTOCOLO (GET)
    # ==========================================
    @staticmethod
    def obter_manifestacao(db: Session, protocolo: str) -> Optional[Manifestacao]:
        return db.query(Manifestacao)\
            .options(joinedload(Manifestacao.assunto))\
            .options(joinedload(Manifestacao.anexos))\
            .filter(Manifestacao.protocolo == protocolo)\
            .first()

    # ==========================================
    # BLOCO 3: LISTAGEM PAGINADA (GET) - CORRIGIDO
    # ==========================================
    @staticmethod
    def listar_manifestacoes(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        usuario_id: Optional[str] = None # NOVO PARÂMETRO
    ) -> tuple[List[Manifestacao], int]:
        
        # Query base
        query = db.query(Manifestacao)

        # SE TIVER ID DE USUÁRIO, FILTRA APENAS AS DELE
        if usuario_id:
            query = query.filter(Manifestacao.usuario_id == usuario_id)

        # Ordenação
        query = query.order_by(desc(Manifestacao.data_criacao))
        
        # Contagem total (considerando o filtro acima)
        total = query.count()
        
        # Paginação e Joins
        lista = query.options(joinedload(Manifestacao.assunto))\
                     .options(joinedload(Manifestacao.anexos))\
                     .offset(skip)\
                     .limit(limit)\
                     .all()
        
        return lista, total