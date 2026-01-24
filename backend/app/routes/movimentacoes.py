"""
API de Movimentações (Rotas)
Arquivo: backend/app/api/endpoints/movimentacao.py
Objetivo: Expor os endereços (URLs) para criar e listar mensagens.
"""
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session

# Importações do Projeto
from app.database import get_db
# Importamos o Enum para o Dropdown funcionar no Form
from app.schemas.movimentacao import MovimentacaoResponse, StatusManifestacaoSchema
from app.services.movimentacao_service import MovimentacaoService
from app.models.usuario import Usuario
from app.routes.auth import get_current_user

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR 
# ==============================================================================
router = APIRouter(
    prefix="/api/movimentacoes",
    tags=["Movimentações"]
)

# ==============================================================================
# ROTA 1: LISTAR HISTÓRICO 
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
# ROTA 2: RESPONDER 
# Método: POST
# ==============================================================================
@router.post("/{manifestacao_id}", response_model=MovimentacaoResponse)
def responder_manifestacao(
    manifestacao_id: str,
    
    # 👇 A MUDANÇA MÁGICA ESTÁ AQUI 👇
    # Ao usar Form(...), o Swagger cria caixinhas separadas ao invés de JSON
    texto: str = Form(..., description="O conteúdo da resposta"),
    interno: bool = Form(False, description="Mensagem interna?"),
    
    # Ao tipar com o Enum + Form, o Swagger cria o Dropdown!
    novo_status: Optional[StatusManifestacaoSchema] = Form(None, description="Alterar status do chamado"),
    
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Any:
    """
    Adiciona uma nova mensagem/resposta à manifestação via Formulário.
    """
    
    # 1. Regra de Segurança
    if interno and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas administradores podem criar notas internas."
        )

    # 2. Chama o Service (passando as variáveis do Form direto)
    nova_movimentacao = MovimentacaoService.criar_movimentacao(
        db=db,
        manifestacao_id=manifestacao_id,
        usuario_id=current_user.id,
        texto=texto,
        interno=interno,
        novo_status=novo_status
    )
    
    # 3. Retorna o objeto criado
    return {
        "id": nova_movimentacao.id,
        "texto": nova_movimentacao.texto,
        "interno": nova_movimentacao.interno,
        "data_criacao": nova_movimentacao.data_criacao,
        "autor_nome": current_user.nome,
        "autor_admin": current_user.admin
    }