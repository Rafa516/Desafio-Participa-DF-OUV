"""
Manifestacao Business Logic Service
Arquivo: backend/app/services/manifestacao_service.py
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, func, cast, Date
from uuid import uuid4
from datetime import datetime, timedelta
from typing import List, Dict, Optional

from app.models.manifestacao import Manifestacao
from app.models.protocolo import Protocolo
from app.models.anexo import Anexo
from app.schemas.manifestacao import ManifestacaoCreate, ManifestacaoUpdate
import logging

logger = logging.getLogger(__name__)

class ManifestacaoService:
    """
    Serviço para gerenciar toda a regra de negócio das manifestações.
    Centraliza a criação de Manifestação + Protocolo + Anexos.
    """

    @staticmethod
    def criar_manifestacao(
        db: Session, 
        manifestacao_data: ManifestacaoCreate,
        arquivos_metadata: List[Dict] = []
    ) -> Manifestacao:
        """
        Cria:
        1. Manifestação
        2. Registro na tabela Protocolos (Auditoria)
        3. Registros na tabela Anexos (se houver)
        """
        # 1. Gerar IDs e Datas
        manifestacao_id = str(uuid4())
        data_hoje = datetime.now()
        
        # Gera Protocolo: OUVIDORIA-YYYYMMDD-XXXXXX
        data_formatada = data_hoje.strftime("%Y%m%d")
        sufixo = str(uuid4().hex)[:6].upper()
        protocolo_texto = f"OUVIDORIA-{data_formatada}-{sufixo}"
        
        # Prazo (30 dias)
        data_limite = data_hoje + timedelta(days=30)

        # 2. Calcular Sequência Diária (Lógica da Opção B)
        ultima_sequencia = db.query(func.max(Protocolo.sequencia_diaria))\
            .filter(cast(Protocolo.data_geracao, Date) == data_hoje.date())\
            .scalar()
        nova_sequencia = (ultima_sequencia or 0) + 1

        # 3. Criar Objeto Manifestação (Campos Corretos)
        nova_manifestacao = Manifestacao(
            id=manifestacao_id,
            protocolo=protocolo_texto,
            relato=manifestacao_data.relato,            # Campo correto
            assunto_id=manifestacao_data.assunto_id,    # Campo correto
            classificacao=manifestacao_data.classificacao,
            dados_complementares=manifestacao_data.dados_complementares,
            anonimo=manifestacao_data.anonimo,
            status="pendente",
            data_criacao=data_hoje
        )

        # 4. Criar Objeto Protocolo (Auditoria)
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
            db.flush() # Garante IDs antes de salvar anexos

            # 5. Salvar metadados dos Anexos no Banco
            # (O upload físico deve ser feito na Rota antes de chamar o service)
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
            
            logger.info(f"Manifestação criada com sucesso: {protocolo_texto}")
            return nova_manifestacao

        except Exception as e:
            db.rollback()
            logger.error(f"Erro ao criar manifestação: {str(e)}")
            raise e

    @staticmethod
    def obter_manifestacao(db: Session, protocolo: str) -> Optional[Manifestacao]:
        return db.query(Manifestacao).filter(Manifestacao.protocolo == protocolo).first()

    @staticmethod
    def listar_manifestacoes(
        db: Session,
        skip: int = 0,
        limit: int = 10
    ) -> tuple[List[Manifestacao], int]:
        
        query = db.query(Manifestacao).order_by(desc(Manifestacao.data_criacao))
        total = query.count()
        lista = query.offset(skip).limit(limit).all()
        
        return lista, total