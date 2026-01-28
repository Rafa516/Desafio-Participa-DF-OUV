"""
API de Movimentações (Rotas)
Arquivo: backend/app/routes/movimentacoes.py
"""
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.movimentacao import MovimentacaoResponse, StatusManifestacaoSchema
from app.services.movimentacao_service import MovimentacaoService
from app.models.usuario import Usuario
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/api/movimentacoes",
    tags=["Movimentações"]
)

# ==============================================================================
# ROTA CORRIGIDA: NOTIFICAÇÕES COMPLETAS
# ==============================================================================
@router.get("/notificacoes/novas")
def obter_notificacoes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # 1. Pega a contagem total
    qtd = MovimentacaoService.contar_novas_movimentacoes(
        db=db, 
        usuario_id=str(current_user.id), 
        is_admin=current_user.admin
    )
    
    # 2. Pega a lista já formatada pelo Service (dicts)
    # O erro estava aqui: o service devolve dicionários, não objetos.
    lista_pronta = MovimentacaoService.listar_notificacoes_detalhadas(
        db=db,
        usuario_id=str(current_user.id),
        is_admin=current_user.admin
    )
    
    # Retorna direto, pois o Service já formatou corretamente
    return {"novas": qtd, "itens": lista_pronta}


# ==============================================================================
# ROTA: LISTAR HISTÓRICO 
# ==============================================================================
@router.get("/{manifestacao_id}", response_model=List[MovimentacaoResponse])
def listar_historico(
    manifestacao_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    historico = MovimentacaoService.listar_historico(
        db=db, 
        manifestacao_id=manifestacao_id, 
        usuario_eh_admin=current_user.admin
    )
    
    resultado = []
    for mov in historico:
        resultado.append({
            "id": mov.id,
            "texto": mov.texto,
            "interno": mov.interno,
            "data_criacao": mov.data_criacao,
            "autor_nome": mov.autor.nome,
            "autor_admin": mov.autor.admin
        })
        
    return resultado


# ==============================================================================
# ROTA: RESPONDER (Criar Movimentação)
# ==============================================================================
@router.post("/{manifestacao_id}", response_model=MovimentacaoResponse)
def responder_manifestacao(
    manifestacao_id: str,
    texto: str = Form(..., description="O conteúdo da resposta"),
    interno: bool = Form(False, description="Mensagem interna?"),
    novo_status: Optional[StatusManifestacaoSchema] = Form(None, description="Alterar status do chamado"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    
    # Apenas admin pode criar nota interna
    if interno and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas administradores podem criar notas internas."
        )

    nova_movimentacao = MovimentacaoService.criar_movimentacao(
        db=db,
        manifestacao_id=manifestacao_id,
        usuario_id=current_user.id,
        texto=texto,
        interno=interno,
        novo_status=novo_status
    )
    
    return {
        "id": nova_movimentacao.id,
        "texto": nova_movimentacao.texto,
        "interno": nova_movimentacao.interno,
        "data_criacao": nova_movimentacao.data_criacao,
        "autor_nome": current_user.nome,
        "autor_admin": current_user.admin
    }