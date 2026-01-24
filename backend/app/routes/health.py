"""
Rotas de Health Check
"""

from fastapi import APIRouter

# ==============================================================================
# CONFIGURAÇÃO DO ROTA
# ==============================================================================
router = APIRouter(
    tags=["Health"]
)


# ==============================================================================
# ROTA: VERIFICAÇÃO DE SAÚDE (GET)
# ==============================================================================
@router.get("/health")
async def health_check():
    """
    Verificar saúde da API
    """
    # Retorna um objeto JSON simples confirmando que a API está online.
    # Este endpoint é essencial para ferramentas de monitoramento (como Kubernetes, 
    # AWS Load Balancers ou Uptime Robot) saberem se o serviço está "vivo".
    return {
        "status": "healthy",
        "service": "Participa-DF API",
        "version": "1.0.0",
    }