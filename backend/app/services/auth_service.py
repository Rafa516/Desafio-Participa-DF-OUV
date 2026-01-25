from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
import re  # IMPORTANTE: Necessário para as validações de Regex
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
from passlib.context import CryptContext 

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioLogin
from app.config import settings

# Configuração do contexto de senha
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

class AuthService:
    
    # ==========================================================================
    # MÉTODOS DE SEGURANÇA E UTILITÁRIOS
    # ==========================================================================
    
    @staticmethod
    def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
        """Confere se a senha digitada bate com o hash do banco"""
        return pwd_context.verify(senha_pura, senha_hash)

    @staticmethod
    def gerar_hash_senha(senha: str) -> str:
        """Transforma texto puro em hash seguro"""
        return pwd_context.hash(senha)

    @staticmethod
    def validar_senha(senha: str):
        """
        Verifica se a senha em TEXTO PURO atende aos requisitos.
        Deve ser chamada ANTES de gerar o hash.
        """
        if len(senha) < 8:
            raise HTTPException(
                status_code=400, 
                detail="A senha deve ter no mínimo 8 caracteres."
            )
        
        if not re.search(r"[a-zA-Z]", senha):
            raise HTTPException(
                status_code=400, 
                detail="A senha deve conter pelo menos uma letra."
            )
            
        if not re.search(r"[^a-zA-Z]", senha):
            raise HTTPException(
                status_code=400, 
                detail="A senha deve conter caracteres especiais ou números."
            )

    @staticmethod
    def criar_token_acesso(data: dict, expires_delta: Optional[timedelta] = None):
        """Gera o Token JWT"""
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    # ==========================================================================
    # REGRAS DE NEGÓCIO
    # ==========================================================================

    @staticmethod
    def criar_usuario(db: Session, usuario_data: UsuarioCreate):
        """Registra um novo usuário com validações de segurança."""
        
        # 1. Validar e-mail e CPF existentes
        if db.query(Usuario).filter(Usuario.email == usuario_data.email).first():
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

        cpf_limpo = usuario_data.cpf.replace(".", "").replace("-", "") if usuario_data.cpf else None
        if cpf_limpo and db.query(Usuario).filter(Usuario.cpf == cpf_limpo).first():
            raise HTTPException(status_code=400, detail="CPF já cadastrado.")

        # 2. VALIDAÇÃO DA SENHA (Texto Puro)
        # Chamamos aqui ANTES de gerar o hash para garantir que a senha é forte
        AuthService.validar_senha(usuario_data.senha)

        # 3. Criar o hash após a validação ter passado
        try:
            hash_gerado = AuthService.gerar_hash_senha(usuario_data.senha)
        except Exception as e:
            print(f"ERRO AO GERAR HASH: {e}")
            raise HTTPException(status_code=500, detail="Erro interno na geração de segurança.")

        novo_usuario = Usuario(
            id=str(uuid4()),
            nome=usuario_data.nome,
            email=usuario_data.email,
            cpf=cpf_limpo,
            telefone=usuario_data.telefone,
            senha_hash=hash_gerado, 
            admin=False, 
            ativo=True
        )

        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        return novo_usuario

    @staticmethod
    def autenticar_usuario(db: Session, dados_login: UsuarioLogin):
        """Tenta fazer login comparando a senha com o hash."""
        usuario = db.query(Usuario).filter(Usuario.email == dados_login.email).first()
        
        if not usuario or not AuthService.verificar_senha(dados_login.senha, usuario.senha_hash):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not usuario.ativo:
            raise HTTPException(status_code=400, detail="Usuário inativo.")

        return usuario