from datetime import datetime, timedelta, timezone
import traceback
import logging
from typing import Optional, Any

# Adicionado Form para gerar os inputs no Swagger
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext


from app.database import get_db
from app.config import settings
from app.services.auth_service import AuthService
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, Token, UsuarioLogin, UsuarioUpdate
from app.models.usuario import Usuario 

# --- CONFIGURAÇÕES GERAIS ---
logger = logging.getLogger("uvicorn")
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# Configuração do Fuso Horário de Brasília (GMT-3)
FUSO_BRASIL = timezone(timedelta(hours=-3))

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticação"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==============================================================================
# DEPENDÊNCIA: OBTER USUÁRIO ATUAL
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
# ROTA: LOGIN (Com Fuso Horário Corrigido)
# ==============================================================================
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    cpf_limpo = form_data.username.replace(".", "").replace("-", "")
    
    # Lógica original: Busca por CPF
    usuario_db = db.query(Usuario).filter(Usuario.cpf == cpf_limpo).first()
    if not usuario_db:
        raise HTTPException(status_code=400, detail="CPF ou senha incorretos")

    # Verifica senha
    if not AuthService.verificar_senha(form_data.password, usuario_db.senha_hash):
        raise HTTPException(status_code=400, detail="CPF ou senha incorretos")

    agora = datetime.now(FUSO_BRASIL)
    usuario_db.ultimo_acesso = agora
    db.add(usuario_db)
    db.commit()
    
    # Payload com dados extras para o Frontend
    token_acesso = AuthService.criar_token_acesso(data={
        "sub": usuario_db.email,
        "nome": usuario_db.nome,
        "email": usuario_db.email, 
        "telefone": usuario_db.telefone, 
        "cpf": usuario_db.cpf,     
        "id": str(usuario_db.id),
        "admin": usuario_db.admin,
        "ultimo_acesso": agora.isoformat() 
    })
    
    return {"access_token": token_acesso, "token_type": "bearer"}

# ==============================================================================
# ROTA: ATUALIZAR PERFIL
# ==============================================================================
@router.put("/atualizar-perfil", response_model=UsuarioResponse)
def atualizar_meu_perfil(
    dados: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza dados do usuário logado (apenas telefone por enquanto).
    """
    if dados.telefone is not None:
        current_user.telefone = dados.telefone
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

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