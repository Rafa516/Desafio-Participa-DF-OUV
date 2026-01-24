"""
Serviço de Autenticação e Gestão de Usuários
Arquivo: backend/app/services/auth_service.py
"""

from sqlalchemy.orm import Session
import bcrypt 
from jose import jwt
from datetime import datetime, timedelta
from uuid import uuid4
from fastapi import HTTPException, status

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioLogin
from app.config import settings


class AuthService:
    
    # ==========================================================================
    # MÉTODOS UTILITÁRIOS (Hash e Token) 
    # ==========================================================================
    
    @staticmethod
    def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
        """Confere se a senha digitada bate com o hash do banco"""
        # O bcrypt precisa de bytes, então usamos .encode('utf-8')
        return bcrypt.checkpw(
            senha_pura.encode('utf-8'), 
            senha_hash.encode('utf-8')
        )

    @staticmethod
    def gerar_hash_senha(senha: str) -> str:
        """Transforma texto puro em hash seguro"""
        # Gera o salt e o hash
        hashed = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
        # Retorna como string para salvar no banco
        return hashed.decode('utf-8')

    @staticmethod
    def criar_token_acesso(data: dict):
        """Gera o Token JWT com tempo de expiração"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    # ==========================================================================
    # REGRAS DE NEGÓCIO (Banco de Dados)
    # ==========================================================================

    @staticmethod
    def criar_usuario(db: Session, usuario_data: UsuarioCreate):
        """
        Registra um novo usuário no sistema.
        """
        # 1. Verificar se e-mail já existe
        email_existente = db.query(Usuario).filter(Usuario.email == usuario_data.email).first()
        if email_existente:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

        # 2. Verificar se CPF já existe (se foi informado)
        if usuario_data.cpf:
            cpf_existente = db.query(Usuario).filter(Usuario.cpf == usuario_data.cpf).first()
            if cpf_existente:
                raise HTTPException(status_code=400, detail="CPF já cadastrado.")

        # 3. Criar o usuário com senha criptografada
        try:
            hash_gerado = AuthService.gerar_hash_senha(usuario_data.senha)
        except Exception as e:
            print(f"ERRO AO GERAR HASH: {e}") # Vai aparecer no terminal se der erro
            raise HTTPException(status_code=500, detail="Erro interno na segurança da senha.")

        novo_usuario = Usuario(
            id=str(uuid4()),
            nome=usuario_data.nome,
            email=usuario_data.email,
            cpf=usuario_data.cpf,
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
        """
        Tenta fazer login.
        """
        # 1. Buscar usuário pelo e-mail
        usuario = db.query(Usuario).filter(Usuario.email == dados_login.email).first()
        
        # 2. Se usuário não existe
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. Verifica senha (com proteção contra campo vazio no banco)
        if not usuario.senha_hash or not AuthService.verificar_senha(dados_login.senha, usuario.senha_hash):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not usuario.ativo:
            raise HTTPException(status_code=400, detail="Usuário inativo.")

        return usuario