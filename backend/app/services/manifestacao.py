"""
Manifestacao business logic service
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from uuid import uuid4
from datetime import datetime
from app.models.manifestacao import Manifestacao, StatusManifestacao
from app.schemas.manifestacao import ManifestacaoCreate, ManifestacaoUpdate
import logging

logger = logging.getLogger(__name__)


class ManifestacaoService:
    """Serviço para gerenciar manifestações"""

    @staticmethod
    def criar_manifestacao(db: Session, manifestacao_data: ManifestacaoCreate) -> Manifestacao:
        """
        Cria nova manifestação no banco de dados
        """
        novo_id = str(uuid4())
        protocolo = ManifestacaoService._gerar_protocolo(novo_id)

        manifestacao = Manifestacao(
            id=novo_id,
            protocolo=protocolo,
            titulo=manifestacao_data.titulo,
            descricao_texto=manifestacao_data.descricao_texto,
            tipo_principal=manifestacao_data.tipo_principal,
            anonimo=manifestacao_data.anonimo,
            status=StatusManifestacao.RECEBIDA,
        )

        db.add(manifestacao)
        db.commit()
        db.refresh(manifestacao)

        logger.info(f"Manifestação criada: {protocolo}")
        return manifestacao

    @staticmethod
    def obter_manifestacao(db: Session, protocolo: str) -> Manifestacao:
        """
        Obtém manifestação pelo protocolo
        """
        return db.query(Manifestacao).filter(Manifestacao.protocolo == protocolo).first()

    @staticmethod
    def listar_manifestacoes(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        status: str = None
    ) -> tuple[list[Manifestacao], int]:
        """
        Lista manifestações com paginação e filtro opcional
        """
        query = db.query(Manifestacao).order_by(desc(Manifestacao.data_criacao))

        if status:
            query = query.filter(Manifestacao.status == status)

        total = query.count()
        manifestacoes = query.offset(skip).limit(limit).all()

        return manifestacoes, total

    @staticmethod
    def atualizar_manifestacao(
        db: Session,
        protocolo: str,
        dados_atualizacao: ManifestacaoUpdate
    ) -> Manifestacao:
        """
        Atualiza status ou dados da manifestação
        """
        manifestacao = ManifestacaoService.obter_manifestacao(db, protocolo)

        if not manifestacao:
            return None

        if dados_atualizacao.status:
            manifestacao.status = dados_atualizacao.status
            if dados_atualizacao.status == StatusManifestacao.CONCLUIDA:
                manifestacao.data_conclusao = datetime.utcnow()

        if dados_atualizacao.descricao_texto:
            manifestacao.descricao_texto = dados_atualizacao.descricao_texto

        db.commit()
        db.refresh(manifestacao)

        logger.info(f"Manifestação atualizada: {protocolo}")
        return manifestacao

    @staticmethod
    def _gerar_protocolo(manifestacao_id: str) -> str:
        """
        Gera número de protocolo único
        Formato: OUVIDORIA-YYYYMMDD-XXXXXX
        """
        from datetime import datetime
        data = datetime.utcnow().strftime("%Y%m%d")
        # Pega últimos 6 caracteres do UUID
        sufixo = manifestacao_id.replace("-", "")[-6:].upper()
        return f"OUVIDORIA-{data}-{sufixo}"
