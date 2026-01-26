from datetime import datetime, timedelta
import traceback
import logging
from typing import Optional, Any

# Adicionado Form para gerar os inputs no Swagger
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

# --- IMPORTS DO SEU PROJETO ---
from app.database import get_db
from app.config import settings
from app.services.auth_service import AuthService
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, Token, UsuarioLogin
from app.models.usuario import Usuario 

# --- CONFIGURAÇÕES GERAIS ---
logger = logging.getLogger("uvicorn")
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticação"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==============================================================================
# DEPENDÊNCIA: OBTER USUÁRIO ATUAL (Essencial para não dar ImportError)
# ==============================================================================
def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Valida o token JWT e retorna o usuário logado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user

# ==============================================================================
# ROTA: REGISTRAR NOVO USUÁRIO 
# ==============================================================================
@router.post("/registrar", response_model=UsuarioResponse, status_code=201)
def registrar_usuario(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    cpf: Optional[str] = Form(None),
    telefone: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Converte os campos de formulário para o Schema esperado pelo Service
    usuario_data = UsuarioCreate(
        nome=nome, 
        email=email, 
        senha=senha, 
        cpf=cpf, 
        telefone=telefone
    )
    return AuthService.criar_usuario(db=db, usuario_data=usuario_data)

# ==============================================================================
# ROTA: LOGIN (Já usa campos individuais por padrão do OAuth2)
# ==============================================================================
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    cpf_limpo = form_data.username.replace(".", "").replace("-", "")
    
    usuario_db = db.query(Usuario).filter(Usuario.cpf == cpf_limpo).first()
    if not usuario_db:
        raise HTTPException(status_code=400, detail="CPF ou senha incorretos")

    dados_login = UsuarioLogin(email=usuario_db.email, senha=form_data.password)
    usuario = AuthService.autenticar_usuario(db, dados_login)
    
    usuario.ultimo_acesso = datetime.now()
    db.add(usuario)
    db.commit()
    
    # BLOCO ATUALIZADO: Incluindo email e cpf no payload para o frontend ler da sessão
    token_acesso = AuthService.criar_token_acesso(data={
        "sub": usuario.email,
        "nome": usuario.nome,
        "email": usuario.email, # Adicionado para a Identificação
        "cpf": usuario.cpf,     # Adicionado para a Identificação
        "id": str(usuario.id),
        "admin": usuario.admin
    })
    
    return {"access_token": token_acesso, "token_type": "bearer"}

# ==============================================================================
# ROTA: ESQUECI MINHA SENHA 
# ==============================================================================
@router.post("/esqueci-senha")
def solicitar_recuperacao_senha(
    email: str = Form(...), 
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if not usuario:
        return {"mensagem": "Se o e-mail existir, enviamos um link."}

    expiracao = datetime.utcnow() + timedelta(hours=24)
    dados_token = {
        "sub": usuario.email, 
        "tipo": "reset_senha",
        "exp": expiracao
    }
    
    token_reset = jwt.encode(dados_token, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    link = f"http://localhost:3000/redefinir-senha?token={token_reset}"
    
    print(f"\nLINK DE RECUPERAÇÃO: {link}\n", flush=True)

    return {
        "mensagem": "Link gerado com sucesso!", 
        "debug_link_autorizado": link 
    }

# ==============================================================================
# ROTA: REDEFINIR SENHA 
# ==============================================================================
@router.post("/redefinir-senha")
def redefinir_senha(
    token: str = Form(...),
    nova_senha: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        tipo: str = payload.get("tipo")
        
        if email is None or tipo != "reset_senha":
            raise HTTPException(status_code=401, detail="Token inválido")
            
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        # Validação de complexidade (reutilizando a lógica do Service)
        AuthService.validar_senha(nova_senha)

        usuario.senha_hash = pwd_context.hash(nova_senha)
        db.add(usuario)
        db.commit()
        
        return {"mensagem": "Senha alterada com sucesso!"}

    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")