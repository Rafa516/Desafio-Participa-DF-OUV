"""
Rotas de Protocolos
Arquivo: backend/app/routes/protocolos.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import uuid4

from app.database import get_db
from app.models.protocolo import Protocolo
# Opcional: Se quiser retornar dados da manifestação junto, importe o modelo
from app.models.manifestacao import Manifestacao

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR
# ==============================================================================
# Adicionamos o prefixo aqui para padronizar com as outras rotas (/api/protocolos)
router = APIRouter(
    prefix="/api/protocolos",
    tags=["Protocolos"]
)


# ==============================================================================
# ROTA: RASTREAR PROTOCOLO (GET)
# ==============================================================================
@router.get("/{numero}")
def rastrear_protocolo(numero: str, db: Session = Depends(get_db)):
    """
    Rastreia um protocolo específico buscando na tabela de auditoria.
    """
    # --------------------------------------------------------------------------
    # 1. BUSCA NO BANCO (TABELA PROTOCOLOS)
    # --------------------------------------------------------------------------
    # Busca exata pelo número (chave primária)
    protocolo_encontrado = db.query(Protocolo).filter(Protocolo.numero == numero).first()

    # --------------------------------------------------------------------------
    # 2. TRATAMENTO DE ERRO (404)
    # --------------------------------------------------------------------------
    if not protocolo_encontrado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Protocolo {numero} não encontrado na base de registros."
        )

    # --------------------------------------------------------------------------
    # 3. RETORNO
    # --------------------------------------------------------------------------
    # Retornamos o objeto direto. O FastAPI converte para JSON automaticamente.
    # Como definimos o relationship no Model, ele pode incluir dados extras se acessados.
    return {
        "numero": protocolo_encontrado.numero,
        "status_manifestacao": protocolo_encontrado.manifestacao.status, # Acessando via relacionamento
        "data_geracao": protocolo_encontrado.data_geracao,
        "data_expiracao": protocolo_encontrado.data_expiracao,
        "sequencia_diaria": protocolo_encontrado.sequencia_diaria,
        "manifestacao_id": protocolo_encontrado.manifestacao_id
    }


# ==============================================================================
# ROTA: SIMULAR GERAÇÃO (POST) - (UTILITÁRIO)
# ==============================================================================
@router.post("/simular-geracao")
def simular_geracao_protocolo():
    """
    Gera um exemplo de número de protocolo válido para testes (SEM SALVAR).
    Útil para o Frontend saber qual formato esperar.
    """
    # 1. Lógica de formatação (A mesma usada em manifestacoes.py)
    data_hoje = datetime.now()
    data_formatada = data_hoje.strftime("%Y%m%d")
    sufixo = str(uuid4().hex)[:6].upper()
    
    protocolo_exemplo = f"OUVIDORIA-{data_formatada}-{sufixo}"

    return {
        "exemplo_protocolo": protocolo_exemplo,
        "mensagem": "Este é apenas um número gerado para teste. Para criar um real, use a rota POST /api/manifestacoes"
    }