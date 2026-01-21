"""
Rotas de Health Check
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Verificar saúde da API
    """
    return {
        "status": "healthy",
        "service": "Participa-DF API",
        "version": "1.0.0",
    }
