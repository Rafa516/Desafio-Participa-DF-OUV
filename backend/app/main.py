"""
Participa-DF Backend - Entry Point
FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine
from app.models.manifestacao import Base as ManifestacaoBase
from app.models.protocolo import Base as ProtocoloBase
from app.models.usuario import Base as UsuarioBase
import logging

from app.config import settings

# Criar tabelas
ManifestacaoBase.metadata.create_all(bind=engine)
ProtocoloBase.metadata.create_all(bind=engine)
UsuarioBase.metadata.create_all(bind=engine)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciar o ciclo de vida da aplicação
    """
    logger.info("Iniciando Participa-DF Backend")
    yield
    logger.info("Encerrando Participa-DF Backend")


# Criar aplicação FastAPI
app = FastAPI(
    title="Participa-DF API",
    description="API de Ouvidoria Acessível para o Participa DF",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


@app.get("/")
async def root():
    """
    Rota raiz da API
    """
    return {
        "message": "Bem-vindo ao Participa-DF API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "Participa-DF API",
        "version": "1.0.0",
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
