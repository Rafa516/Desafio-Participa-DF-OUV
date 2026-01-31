"""
Rotas de Manifestações (Controller)
Arquivo: backend/app/routes/manifestacoes.py
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
from app.routes.auth import get_current_user 

router = APIRouter(
    prefix="/api/manifestacoes",
    tags=["Manifestações"]
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# ==============================================================================
# ROTA: CRIAR MANIFESTAÇÃO (POST)
# ==============================================================================
@router.post(
    "/", 
    response_model=ManifestacaoResponse, 
    status_code=status.HTTP_201_CREATED
)
def criar_manifestacao(
    relato: str = Form(..., min_length=10),
    assunto_id: str = Form(...),
    classificacao: ClassificacaoManifestacaoSchema = Form(ClassificacaoManifestacaoSchema.RECLAMACAO),
    anonimo: bool = Form(False),
    dados_complementares: str = Form("{}"),
    arquivos: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        dados_dict = json.loads(dados_complementares)
    except Exception:
        dados_dict = {}

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

    arquivos_processados = []
    if arquivos:
        try:
            for arquivo in arquivos:
                nome_unico = f"{uuid4()}_{arquivo.filename}"
                caminho_completo = os.path.join(UPLOAD_DIR, nome_unico)
                with open(caminho_completo, "wb") as buffer:
                    shutil.copyfileobj(arquivo.file, buffer)
                
                tamanho_bytes = os.path.getsize(caminho_completo)
                arquivos_processados.append({
                    "caminho": caminho_completo,
                    "tipo": arquivo.content_type,
                    "tamanho": tamanho_bytes
                })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

    try:
        usuario_id = str(current_user.id) if not anonimo else None # Usar None para manifestações anônimas'

        nova_manifestacao = ManifestacaoService.criar_manifestacao(
            db=db,
            manifestacao_data=manifestacao_validada,
            usuario_id=usuario_id,
            arquivos_metadata=arquivos_processados
        )
        return nova_manifestacao

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


# ==============================================================================
# ROTA: LISTAR MANIFESTAÇÕES (GET)
# ==============================================================================
@router.get("/", response_model=ManifestacaoListResponse)
def listar_manifestacoes(
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) 
):
    filtro_usuario_id = None
    if not current_user.admin:
        filtro_usuario_id = str(current_user.id)

    lista, total = ManifestacaoService.listar_manifestacoes(
        db, skip, limit, usuario_id=filtro_usuario_id
    )
    
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
def consultar_manifestacao(
    protocolo: str, 
    db: Session = Depends(get_db),
):
    # O Pydantic (ManifestacaoResponse) agora tem o campo 'usuario'
    # Como o SQLAlchemy carrega as relações, o Pydantic vai ler e preencher automaticamente.
    manifestacao = ManifestacaoService.obter_manifestacao(db, protocolo)
    if not manifestacao:
        raise HTTPException(status_code=404, detail="Manifestação não encontrada")
    return manifestacao

# ==============================================================================
# ROTA ADMIN: LISTAGEM COMPLETA
# ==============================================================================
@router.get("/admin/todas", response_model=ManifestacaoListResponse)
def listar_todas_admin(
    skip: int = Query(0),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not current_user.admin:
        raise HTTPException(status_code=403, detail="Acesso restrito.")

    lista, total = ManifestacaoService.listar_manifestacoes(db, skip, limit)
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "manifestacoes": lista
    }