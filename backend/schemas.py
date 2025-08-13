# arquivo: backend/schemas.py

import enum
from pydantic import BaseModel
from typing import List, Optional

# Enum para validação de entrada na API. Garante que apenas valores válidos sejam aceitos.
class StatusEnum(str, enum.Enum):
    PENDENTE = "PENDENTE"
    APROVADO = "APROVADO"
    REJEITADO = "REJEITADO"

# --- SCHEMAS DE PROCESSO ---

class ProcessoBase(BaseModel):
    numero_processo: str
    nome_reu: str
    cpf_cnpj_reu: str
    valor_causa: str

class ProcessoCreate(ProcessoBase):
    pass

class Processo(ProcessoBase):
    id: int
    # --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
    # Usamos 'str' para a saída da API para garantir a serialização correta.
    status: str 

    class Config:
        from_attributes = True

# Schema para um processo quando ele está dentro de uma pasta
class ProcessoInFolder(Processo):
    observation: Optional[str] = None

# Schema para a requisição de atualização de status (continua usando o Enum para validação)
class ProcessoStatusUpdate(BaseModel):
    status: StatusEnum

# --- SCHEMAS DE ASSOCIAÇÃO E PASTA ---

# Este schema representa a "ligação" entre uma pasta e um processo
class FolderProcessAssociationSchema(BaseModel):
    observation: Optional[str] = None
    processo: Processo

    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    pass

# O schema da pasta, que retorna a lista de associações
class Folder(FolderBase):
    id: int
    owner_id: int
    processo_associations: List[FolderProcessAssociationSchema] = []

    class Config:
        from_attributes = True

# --- SCHEMAS DE USUÁRIO ---

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- SCHEMA DE RESPOSTA PARA A TABELA DE PROCESSOS ---

class ProcessosResponse(BaseModel):
    total_count: int
    data: List[Processo]