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
        usuario_id = str(current_user.id) if not anonimo else None

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
# ROTA: LISTAR MANIFESTAÇÕES (GET) - AGORA SEGURA
# ==============================================================================
@router.get("/", response_model=ManifestacaoListResponse)
def listar_manifestacoes(
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = Depends(get_db),
    # ADICIONADO: Pega usuário logado para filtrar
    current_user = Depends(get_current_user) 
):
    """
    Lista manifestações. 
    - Se for ADMIN: Vê tudo (ou poderia filtrar se quisesse).
    - Se for COMUM: Vê apenas as suas.
    """
    
    # Define o filtro: Se NÃO for admin, filtra pelo ID do usuário atual
    filtro_usuario_id = None
    if not current_user.admin:
        filtro_usuario_id = str(current_user.id)

    # Passa o filtro para o Service
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
    # Opcional: Adicionar segurança aqui também para usuário não ver protocolo alheio
    # mas protocolo geralmente é "chave pública" para consulta.
):
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

    # Chama o service SEM passar ID (usuario_id=None), trazendo tudo
    lista, total = ManifestacaoService.listar_manifestacoes(db, skip, limit)
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "manifestacoes": lista
    }