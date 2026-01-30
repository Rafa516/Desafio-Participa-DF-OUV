"""
 Desafio Participa-DF-Ouvidoria Backend - Entry Point
FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 
from contextlib import asynccontextmanager
import os 

from app.database import engine
# Importando todos os modelos para criar as tabelas
from app.models.manifestacao import Base as ManifestacaoBase
from app.models.protocolo import Base as ProtocoloBase
from app.models.usuario import Base as UsuarioBase
from app.models.assunto import Base as AssuntoBase
from app.models.anexo import Base as AnexoBase
from app.models.movimentacao import Base as MovimentacaoBase
from app.routes import health, assuntos, manifestacoes, protocolos, auth, movimentacoes
import logging

from app.config import settings

# Criar tabelas no banco de dados (caso não existam)
ManifestacaoBase.metadata.create_all(bind=engine)
ProtocoloBase.metadata.create_all(bind=engine)
UsuarioBase.metadata.create_all(bind=engine)
AssuntoBase.metadata.create_all(bind=engine)
AnexoBase.metadata.create_all(bind=engine)
MovimentacaoBase.metadata.create_all(bind=engine)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciar o ciclo de vida da aplicação
    """
    # 1. Garantir que a pasta de uploads exista ao iniciar
    # Isso evita erro 500 se o StaticFiles tentar montar uma pasta inexistente
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
        logger.info("Pasta 'uploads' criada com sucesso.")

    logger.info("Iniciando Participa-DF-Ouvidoria Backend")
    yield
    logger.info("Encerrando Participa-DF-Ouvidoria Backend")


# Criar aplicação FastAPI
app = FastAPI(
    title="Desafio Participa-DF-Ouvidoria API",
    description="API de Ouvidoria Acessível para o Participa DF",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS (Permite que o Frontend acesse o Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# ==============================================================================
# ARQUIVOS ESTÁTICOS (IMAGENS)
# ==============================================================================
# Isso permite acessar http://localhost:8000/uploads/nome_da_imagem.png
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ==============================================================================
# ROTAS DA API
# ==============================================================================
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(assuntos.router)
app.include_router(manifestacoes.router)
app.include_router(protocolos.router) 
app.include_router(movimentacoes.router)




@app.get("/", include_in_schema=False)
async def root():
    """
    Rota raiz da API (apenas informativo)
    """
    return {
        "message": "Bem-vindo ao Participa-DF-Ouvidoria API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": {
            "assuntos": "/api/assuntos",
            "manifestacoes": "/api/manifestacoes",
            "protocolos": "/api/protocolos",
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.RELOAD,
        workers=settings.WORKERS,
    )