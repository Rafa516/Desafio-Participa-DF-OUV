"""
Rotas de Manifestações (Controller)
Arquivo: backend/app/routes/manifestacoes.py
Responsabilidade: Lidar com HTTP, Upload de arquivos físicos e chamar o Service.
"""

import os
import shutil
import json
from uuid import uuid4
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.manifestacao_service import ManifestacaoService 
from app.schemas.manifestacao import (
    ManifestacaoCreate,
    ManifestacaoResponse,
    ManifestacaoListResponse,
    ClassificacaoManifestacaoSchema
)
# BLOCO: Importação da dependência de usuário da sua pasta de rotas
from app.routes.auth import get_current_user 

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR
# ==============================================================================
router = APIRouter(
    prefix="/api/manifestacoes",
    tags=["Manifestações"]
)

# ==============================================================================
# CONFIGURAÇÃO DE DIRETÓRIO
# ==============================================================================
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


# ==============================================================================
# ROTA: CRIAR MANIFESTAÇÃO (POST)
# ==============================================================================
@router.post(
    "/", 
    response_model=ManifestacaoResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova manifestação"
)
def criar_manifestacao(
    relato: str = Form(..., min_length=10, description="Descreva o ocorrido"),
    assunto_id: str = Form(..., description="ID do assunto"),
    classificacao: ClassificacaoManifestacaoSchema = Form(ClassificacaoManifestacaoSchema.RECLAMACAO),
    anonimo: bool = Form(False),
    # NOVIDADE: Recebe o JSON das caixinhas como string
    dados_complementares: str = Form("{}"),
    arquivos: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    # NOVIDADE: Captura o usuário logado via Token
    current_user = Depends(get_current_user)
):
    """
    Recebe os dados do formulário e arquivos, salva os arquivos no disco
    e delega a criação do registro no banco para o ManifestacaoService.
    """
    
    # 1. Processar o JSON das caixinhas dinâmicas
    try:
        dados_dict = json.loads(dados_complementares)
    except Exception:
        dados_dict = {}

    # 2. Validar dados do formulário (Pydantic)
    try:
        manifestacao_validada = ManifestacaoCreate(
            relato=relato,
            assunto_id=assunto_id,
            classificacao=classificacao,
            anonimo=anonimo,
            dados_complementares=dados_dict 
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # 3. Processar Uploads Físicos (Salvar no Disco)
    arquivos_processados = []
    
    if arquivos:
        try:
            for arquivo in arquivos:
                # Gerar nome único: UUID + Nome Original
                nome_unico = f"{uuid4()}_{arquivo.filename}"
                caminho_completo = os.path.join(UPLOAD_DIR, nome_unico)
                
                # Salvar arquivo fisicamente
                with open(caminho_completo, "wb") as buffer:
                    shutil.copyfileobj(arquivo.file, buffer)
                
                # Obter metadados para passar ao Service
                tamanho_bytes = os.path.getsize(caminho_completo)
                
                arquivos_processados.append({
                    "caminho": caminho_completo,
                    "tipo": arquivo.content_type,
                    "tamanho": tamanho_bytes
                })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao fazer upload de arquivos: {str(e)}")

    # 4. Chamar o Service para Regra de Negócio (Banco de Dados)
    try:
        # Define o usuario_id para vínculo no banco (None se for anônimo)
        usuario_id = str(current_user.id) if not anonimo else None

        nova_manifestacao = ManifestacaoService.criar_manifestacao(
            db=db,
            manifestacao_data=manifestacao_validada,
            usuario_id=usuario_id,
            arquivos_metadata=arquivos_processados
        )
        return nova_manifestacao

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao criar manifestação: {str(e)}")


# ==============================================================================
# ROTA: LISTAR MANIFESTAÇÕES (GET)
# ==============================================================================
@router.get("/", response_model=ManifestacaoListResponse)
def listar_manifestacoes(
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    # O Service retorna uma tupla (lista, total)
    lista, total = ManifestacaoService.listar_manifestacoes(db, skip, limit)
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "manifestacoes": lista
    }


# ==============================================================================
# ROTA: CONSULTAR POR PROTOCOLO (GET)
# ==============================================================================
@router.get("/{protocolo}", response_model=ManifestacaoResponse)
def consultar_manifestacao(protocolo: str, db: Session = Depends(get_db)):
    
    manifestacao = ManifestacaoService.obter_manifestacao(db, protocolo)
    
    if not manifestacao:
        raise HTTPException(status_code=404, detail="Manifestação não encontrada")
    
    return manifestacao