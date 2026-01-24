from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.assunto import Assunto
from app.schemas.assunto import AssuntoResponse, AssuntoListResponse

# ==============================================================================
# CONFIGURAÇÃO DA ROTA
# ==============================================================================
router = APIRouter(
    prefix="/api/assuntos",
    tags=["Assuntos"]
)

# ==============================================================================
# ROTA: LISTAR ASSUNTOS (GET)
# ==============================================================================
@router.get(
    "/", 
    response_model=AssuntoListResponse, # Define que a resposta segue o schema de lista
    summary="Listar todos os assuntos"
)
def listar_assuntos(db: Session = Depends(get_db)):
    """
    Retorna a lista de todos os assuntos ativos disponíveis para manifestação.
    """
    # --------------------------------------------------------------------------
    # 1. BUSCA NO BANCO DE DADOS
    # --------------------------------------------------------------------------
    # Busca apenas os registros marcados como ativos na tabela 'assuntos'
    lista_assuntos = db.query(Assunto).filter(Assunto.ativo == True).all()
    
    # --------------------------------------------------------------------------
    # 2. MONTAGEM DA RESPOSTA
    # --------------------------------------------------------------------------
    # Monta a resposta no formato exato do Schema AssuntoListResponse.
    # O Frontend espera receber um objeto contendo a contagem 'total' e a lista 'assuntos'.
    return {
        "total": len(lista_assuntos),
        "assuntos": lista_assuntos
    }


# ==============================================================================
# ROTA: OBTER DETALHES DO ASSUNTO (GET)
# ==============================================================================
@router.get(
    "/{assunto_id}", 
    response_model=AssuntoResponse, # Define que a resposta segue o schema individual
    summary="Obter detalhes do assunto"
)
def obter_assunto(assunto_id: str, db: Session = Depends(get_db)):
    """
    Retorna os detalhes de um assunto específico (incluindo os campos dinâmicos).
    """
    # --------------------------------------------------------------------------
    # 1. BUSCA POR ID
    # --------------------------------------------------------------------------
    # Tenta encontrar o assunto pelo ID, garantindo que ele ainda esteja ativo
    assunto = db.query(Assunto).filter(Assunto.id == assunto_id, Assunto.ativo == True).first()
    
    # --------------------------------------------------------------------------
    # 2. TRATAMENTO DE ERRO (404)
    # --------------------------------------------------------------------------
    # Se o ID não existir ou o assunto estiver inativo, retorna erro 404
    if not assunto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Assunto não encontrado"
        )
    
    # Retorna o objeto encontrado (o Pydantic converte para JSON automaticamente)
    return assunto