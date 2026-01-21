"""
Rotas de Manifestações
"""

from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter()


@router.post("/manifestacoes")
async def criar_manifestacao(
    titulo: str = Form(...),
    descricao_texto: Optional[str] = Form(None),
    anonimo: bool = Form(False),
    arquivo_audio: Optional[UploadFile] = File(None),
    arquivo_video: Optional[UploadFile] = File(None),
    arquivo_imagem: Optional[UploadFile] = File(None),
):
    """
    Criar nova manifestação
    
    - **titulo**: Título da manifestação
    - **descricao_texto**: Descrição em texto
    - **anonimo**: Se a manifestação é anônima
    - **arquivo_audio**: Arquivo de áudio (opcional)
    - **arquivo_video**: Arquivo de vídeo (opcional)
    - **arquivo_imagem**: Arquivo de imagem (opcional)
    """
    return {
        "message": "Manifestação criada com sucesso",
        "protocolo": "OUVIDORIA-20260120-XXXXXX",
        "status": "pendente",
    }


@router.get("/manifestacoes/{protocolo}")
async def consultar_manifestacao(protocolo: str):
    """
    Consultar manifestação por protocolo
    """
    return {
        "protocolo": protocolo,
        "titulo": "Exemplo de manifestação",
        "status": "em_processamento",
        "data_criacao": "2026-01-20",
    }


@router.get("/manifestacoes")
async def listar_manifestacoes(skip: int = 0, limit: int = 10):
    """
    Listar manifestações com paginação
    """
    return {
        "total": 0,
        "skip": skip,
        "limit": limit,
        "manifestacoes": [],
    }
