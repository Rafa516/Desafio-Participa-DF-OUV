"""
Rotas de Autenticação (Login, Registro e Validação de Token)
Arquivo: backend/app/routes/auth.py
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Any
from jose import jwt, JWTError

from app.database import get_db
from app.config import settings
from app.services.auth_service import AuthService
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, Token, UsuarioLogin
from app.models.usuario import Usuario # Importando o Model para buscar no banco

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticação"]
)

# Define onde o Swagger deve buscar o token (na rota /login)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ==============================================================================
# DEPENDÊNCIA: OBTER USUÁRIO ATUAL (Proteção de Rotas)
# ==============================================================================
# É ESTA FUNÇÃO QUE ESTAVA FALTANDO!
def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Decodifica o Token JWT e recupera o usuário do banco de dados.
    Usado como dependência em rotas protegidas.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica o token usando a chave secreta
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Busca o usuário no banco
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user


# ==============================================================================
# ROTA: REGISTRAR NOVO USUÁRIO (POST)
# ==============================================================================
@router.post(
    "/registrar", 
    response_model=UsuarioResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo usuário"
)
def registrar_usuario(
    usuario: UsuarioCreate, 
    db: Session = Depends(get_db)
):
    """
    Cria um novo usuário no sistema.
    - Verifica se E-mail ou CPF já existem.
    - Criptografa a senha automaticamente.
    """
    return AuthService.criar_usuario(db=db, usuario_data=usuario)


# ==============================================================================
# ROTA: LOGIN / GERAR TOKEN (POST)
# ==============================================================================
@router.post(
    "/login", 
    response_model=Token,
    summary="Fazer login e obter Token JWT"
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Rota padrão para login compatível com Swagger UI.
    Recebe 'username' (que será o e-mail) e 'password'.
    Retorna o Token de Acesso (JWT).
    """
    # 1. Monta objeto de login (OAuth2 usa 'username', nós usamos 'email')
    dados_login = UsuarioLogin(email=form_data.username, senha=form_data.password)
    
    # 2. Autentica
    usuario = AuthService.autenticar_usuario(db, dados_login)
    
    # 3. Gera Token
    token_acesso = AuthService.criar_token_acesso(data={"sub": usuario.email})
    
    return {
        "access_token": token_acesso,
        "token_type": "bearer"
    }