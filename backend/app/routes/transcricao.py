import os
import shutil
import asyncio
import sys
import subprocess
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(
    prefix="/api/transcricao",
    tags=["Transcrição"]
)

model_cache = None

UPLOAD_DIR = "uploads/temp_audio"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def install_package(package):
    """Função de Auto-Reparo: Instala pacotes no Python atual"""
    try:
        print(f"🔧 AUTO-REPARO: Instalando {package} no Python atual ({sys.executable})...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--user"])
        print(f"{package} instalado com sucesso!")
        return True
    except Exception as e:
        print(f"Falha no auto-reparo: {e}")
        return False

def processar_audio_pesado(caminho_arquivo: str):
    global model_cache
    
    # 1. Garante o FFmpeg no PATH (caso esteja no C:)
    caminhos_ffmpeg = [r"C:\ffmpeg\bin", r"C:\Program Files\ffmpeg\bin"]
    for path in caminhos_ffmpeg:
        if os.path.exists(path):
            os.environ["PATH"] += os.pathsep + path

    # 2. Tenta importar. Se falhar, Auto-Instala.
    try:
        import whisper
    except ImportError:
        print("⚠️ Biblioteca Whisper faltando. Iniciando instalação automática...")
        if install_package("openai-whisper"):
            try:
                import whisper # Tenta de novo após instalar
            except ImportError:
                return f"ERRO CRÍTICO: Auto-instalação rodou, mas o Python {sys.executable} ainda não achou a lib. Reinicie o backend manualmente."
        else:
            return f"ERRO: Não foi possível instalar o Whisper automaticamente no Python: {sys.executable}"

    try:
        if model_cache is None:
            print("🎙️ Carregando IA Whisper (Isso pode demorar um pouco na 1ª vez)...")
            model_cache = whisper.load_model("base")
            print("✅ IA Carregada!")

        # fp16=False evita erro de CPU
        resultado = model_cache.transcribe(caminho_arquivo, fp16=False)
        return resultado["text"].strip()
    
    except Exception as e:
        return f"ERRO: {str(e)}"

@router.post("/")
async def transcrever_audio(arquivo: UploadFile = File(...)):
    caminho_arquivo = ""
    try:
        extensao = arquivo.filename.split(".")[-1]
        nome_unico = f"{uuid4()}.{extensao}"
        caminho_arquivo = os.path.join(UPLOAD_DIR, nome_unico)
        
        with open(caminho_arquivo, "wb") as buffer:
            shutil.copyfileobj(arquivo.file, buffer)

        # Processa
        resultado = await asyncio.to_thread(processar_audio_pesado, caminho_arquivo)

        if resultado.startswith("ERRO"):
            raise HTTPException(status_code=400, detail=resultado)

        return {"texto": resultado}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Erro 500: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if caminho_arquivo and os.path.exists(caminho_arquivo):
            try:
                os.remove(caminho_arquivo)
            except:
                pass