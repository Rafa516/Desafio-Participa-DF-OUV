from typing import List
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.assunto import Assunto
from app.schemas.assunto import AssuntoResponse, AssuntoListResponse, AssuntoCreate, AssuntoUpdate

router = APIRouter(
    prefix="/api/assuntos",
    tags=["Assuntos"]
)

# ==============================================================================
# LISTAR (GET)
# ==============================================================================
@router.get("/", response_model=AssuntoListResponse)
def listar_assuntos(
    apenas_ativos: bool = True, 
    db: Session = Depends(get_db)
):
    query = db.query(Assunto)
    if apenas_ativos:
        query = query.filter(Assunto.ativo == True)
    
    lista = query.order_by(Assunto.nome.asc()).all()
    
    return {
        "total": len(lista),
        "assuntos": lista
    }

# ==============================================================================
# OBTER UM (GET)
# ==============================================================================
@router.get("/{assunto_id}", response_model=AssuntoResponse)
def obter_assunto(assunto_id: str, db: Session = Depends(get_db)):
    assunto = db.query(Assunto).filter(Assunto.id == assunto_id).first()
    if not assunto:
        raise HTTPException(status_code=404, detail="Assunto não encontrado")
    return assunto

# ==============================================================================
# CRIAR (POST)
# ==============================================================================
@router.post("/", response_model=AssuntoResponse, status_code=201)
def criar_assunto(
    dados: AssuntoCreate, 
    db: Session = Depends(get_db)
):
    # Verifica se já existe com esse nome
    existe = db.query(Assunto).filter(Assunto.nome == dados.nome).first()
    if existe:
        raise HTTPException(status_code=400, detail="Já existe um assunto com este nome.")

    novo_assunto = Assunto(
        id=str(uuid4()),
        nome=dados.nome,
        descricao=dados.descricao,
        campos_adicionais=dados.campos_adicionais,
        ativo=True # Nasce ativo por padrão
    )
    
    db.add(novo_assunto)
    db.commit()
    db.refresh(novo_assunto)
    return novo_assunto

# ==============================================================================
# ATUALIZAR (PUT)
# ==============================================================================
@router.put("/{assunto_id}", response_model=AssuntoResponse)
def atualizar_assunto(
    assunto_id: str,
    dados: AssuntoUpdate,
    db: Session = Depends(get_db)
):
    assunto = db.query(Assunto).filter(Assunto.id == assunto_id).first()
    if not assunto:
        raise HTTPException(status_code=404, detail="Assunto não encontrado")

    if dados.nome is not None:
        # Verifica duplicidade de nome (se mudou o nome)
        if dados.nome != assunto.nome:
            existe = db.query(Assunto).filter(Assunto.nome == dados.nome).first()
            if existe:
                raise HTTPException(status_code=400, detail="Já existe um assunto com este nome.")
        assunto.nome = dados.nome
        
    if dados.descricao is not None:
        assunto.descricao = dados.descricao
        
    if dados.campos_adicionais is not None:
        assunto.campos_adicionais = dados.campos_adicionais
        
    if dados.ativo is not None:
        assunto.ativo = dados.ativo

    db.add(assunto)
    db.commit()
    db.refresh(assunto)
    return assunto

# ==============================================================================
# DELETAR (DELETE)
# ==============================================================================
@router.delete("/{assunto_id}", status_code=204)
def deletar_assunto(assunto_id: str, db: Session = Depends(get_db)):
    assunto = db.query(Assunto).filter(Assunto.id == assunto_id).first()
    if not assunto:
        raise HTTPException(status_code=404, detail="Assunto não encontrado")
    
    # Aqui poderíamos validar se existem manifestações vinculadas antes de deletar
    # Por segurança, vamos apenas deletar o registro. 
    # Idealmente, faríamos um "Soft Delete" (ativo=False), mas o Admin pediu Delete.
    
    db.delete(assunto)
    db.commit()
    return None