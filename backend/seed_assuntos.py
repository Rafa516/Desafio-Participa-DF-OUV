"""
Script para popular assuntos iniciais no banco de dados
Baseado na Instrução Normativa CGDF nº 01/2017
"""

from sqlalchemy.orm import Session
from uuid import uuid4
from app.database import SessionLocal
from app.models.assunto import Assunto
from app.models.manifestacao import Manifestacao
from app.models.usuario import Usuario
from app.models.anexo import Anexo
from app.models.movimentacao import Movimentacao
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_assuntos():
    """
    Popula a tabela de assuntos com os tipos disponíveis no Participa DF
    """
    db: Session = SessionLocal()

    assuntos_data = [
        {
            "nome": "Servidor Público",
            "descricao": "Reclamações, denúncias ou sugestões relacionadas a servidores públicos",
            "campos_adicionais": {
                "nome_servidor": {"tipo": "text", "obrigatorio": True, "label": "Nome do Servidor"},
                "orgao_entidade": {"tipo": "text", "obrigatorio": True, "label": "Órgão/Entidade"},
                "setor_locacao": {"tipo": "text", "obrigatorio": False, "label": "Setor/Locação"},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
                "horario_fato": {"tipo": "time", "obrigatorio": False, "label": "Horário do Fato"},
                "subassunto": {"tipo": "select", "obrigatorio": True, "label": "Subassunto", "opcoes": ["Conduta Irregular", "Incompetência", "Negligência", "Outro"]},
                "tipo_vinculo": {"tipo": "select", "obrigatorio": False, "label": "Tipo de Vínculo", "opcoes": ["Efetivo", "Contratado", "Comissionado", "Outro"]},
            }
        },
        {
            "nome": "Serviço Público",
            "descricao": "Problemas relacionados à qualidade e prestação de serviços públicos",
            "campos_adicionais": {
                "nome_servico": {"tipo": "text", "obrigatorio": True, "label": "Nome do Serviço"},
                "orgao_responsavel": {"tipo": "text", "obrigatorio": True, "label": "Órgão Responsável"},
                "local_servico": {"tipo": "text", "obrigatorio": False, "label": "Local do Serviço"},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
                "tipo_problema": {"tipo": "select", "obrigatorio": True, "label": "Tipo de Problema", "opcoes": ["Falta de Atendimento", "Atendimento Ruim", "Demora", "Falta de Informação", "Outro"]},
            }
        },
        {
            "nome": "Educação",
            "descricao": "Questões relacionadas a instituições de ensino e educação",
            "campos_adicionais": {
                "instituicao": {"tipo": "text", "obrigatorio": True, "label": "Instituição de Ensino"},
                "tipo_instituicao": {"tipo": "select", "obrigatorio": True, "label": "Tipo", "opcoes": ["Pública", "Privada", "Conveniada"]},
                "nivel_ensino": {"tipo": "select", "obrigatorio": True, "label": "Nível de Ensino", "opcoes": ["Educação Infantil", "Ensino Fundamental", "Ensino Médio", "Educação Superior", "Outro"]},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
                "assunto_especifico": {"tipo": "select", "obrigatorio": True, "label": "Assunto Específico", "opcoes": ["Qualidade do Ensino", "Infraestrutura", "Gestão", "Outro"]},
            }
        },
        {
            "nome": "Saúde",
            "descricao": "Problemas e reclamações relacionados a serviços de saúde",
            "campos_adicionais": {
                "estabelecimento": {"tipo": "text", "obrigatorio": True, "label": "Estabelecimento de Saúde"},
                "tipo_estabelecimento": {"tipo": "select", "obrigatorio": True, "label": "Tipo", "opcoes": ["Hospital", "Clínica", "Posto de Saúde", "Farmácia", "Outro"]},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
                "tipo_problema": {"tipo": "select", "obrigatorio": True, "label": "Tipo de Problema", "opcoes": ["Atendimento", "Medicamento", "Infraestrutura", "Outro"]},
            }
        },
        {
            "nome": "Segurança Pública",
            "descricao": "Questões relacionadas a segurança, polícia e ordem pública",
            "campos_adicionais": {
                "orgao": {"tipo": "select", "obrigatorio": True, "label": "Órgão", "opcoes": ["PMDF", "PCDF", "Bombeiros", "Outro"]},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
                "local_fato": {"tipo": "text", "obrigatorio": True, "label": "Local do Fato"},
                "tipo_problema": {"tipo": "select", "obrigatorio": True, "label": "Tipo de Problema", "opcoes": ["Abuso de Autoridade", "Falta de Atendimento", "Negligência", "Outro"]},
            }
        },
        {
            "nome": "Infraestrutura e Mobilidade",
            "descricao": "Problemas com infraestrutura, transportes e mobilidade urbana",
            "campos_adicionais": {
                "tipo_infraestrutura": {"tipo": "select", "obrigatorio": True, "label": "Tipo", "opcoes": ["Rua/Avenida", "Transporte Público", "Estacionamento", "Ciclovias", "Outro"]},
                "endereco": {"tipo": "text", "obrigatorio": True, "label": "Endereço/Local"},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
                "tipo_problema": {"tipo": "select", "obrigatorio": True, "label": "Tipo de Problema", "opcoes": ["Buraco/Estrago", "Falta de Manutenção", "Demora", "Outro"]},
            }
        },
        {
            "nome": "Meio Ambiente",
            "descricao": "Questões ambientais e de sustentabilidade",
            "campos_adicionais": {
                "tipo_problema": {"tipo": "select", "obrigatorio": True, "label": "Tipo de Problema", "opcoes": ["Poluição", "Desmatamento", "Resíduos", "Outro"]},
                "local": {"tipo": "text", "obrigatorio": True, "label": "Local"},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
            }
        },
        {
            "nome": "Transparência e Acesso à Informação",
            "descricao": "Problemas relacionados a transparência e acesso a informações públicas",
            "campos_adicionais": {
                "orgao": {"tipo": "text", "obrigatorio": True, "label": "Órgão"},
                "tipo_problema": {"tipo": "select", "obrigatorio": True, "label": "Tipo de Problema", "opcoes": ["Informação Negada", "Demora na Resposta", "Informação Incompleta", "Outro"]},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
            }
        },
        {
            "nome": "Administração e Gestão Pública",
            "descricao": "Questões gerais sobre administração e gestão pública",
            "campos_adicionais": {
                "orgao": {"tipo": "text", "obrigatorio": True, "label": "Órgão"},
                "tipo_problema": {"tipo": "select", "obrigatorio": True, "label": "Tipo de Problema", "opcoes": ["Gestão Inadequada", "Desperdício", "Corrupção", "Outro"]},
                "data_fato": {"tipo": "date", "obrigatorio": True, "label": "Data do Fato"},
            }
        },
        {
            "nome": "Outro",
            "descricao": "Outros assuntos não especificados acima",
            "campos_adicionais": {
                "descricao_assunto": {"tipo": "text", "obrigatorio": True, "label": "Descreva o Assunto"},
            }
        },
    ]

    try:
        for assunto_data in assuntos_data:
            # Verificar se assunto já existe
            existe = db.query(Assunto).filter(Assunto.nome == assunto_data["nome"]).first()
            
            if existe:
                logger.info(f"⏭️  Assunto '{assunto_data['nome']}' já existe, pulando...")
                continue

            novo_assunto = Assunto(
                id=str(uuid4()),
                nome=assunto_data["nome"],
                descricao=assunto_data["descricao"],
                campos_adicionais=assunto_data["campos_adicionais"],
                ativo=True,
            )
            
            db.add(novo_assunto)
            logger.info(f"Assunto '{assunto_data['nome']}' adicionado")

        db.commit()
        logger.info("Todos os assuntos foram populados com sucesso!")

    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao popular assuntos: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_assuntos()
