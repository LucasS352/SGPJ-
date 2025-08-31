# arquivo: backend/schemas.py

import enum
from pydantic import BaseModel
from typing import List, Optional

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
    status: str
    class Config:
        from_attributes = True

class ProcessoInFolder(Processo):
    observation: Optional[str] = None

class ProcessoStatusUpdate(BaseModel):
    status: StatusEnum

# --- SCHEMAS DE ASSOCIAÇÃO E PASTA ---
class FolderProcessAssociationSchema(BaseModel):
    observation: Optional[str] = None
    processo: Processo
    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    pass

# --- MUDANÇA PRINCIPAL AQUI ---
# Este é o schema PADRÃO para uma pasta, usado na listagem.
# Note que ele não exige mais a contagem total de processos.
class Folder(FolderBase):
    id: int
    owner_id: int
    processo_associations: List[FolderProcessAssociationSchema] = []
    class Config:
        from_attributes = True

# --- NOVO SCHEMA ---
# Este é um schema ESPECIAL, apenas para a resposta do endpoint de detalhes da pasta.
class FolderDetail(Folder):
    total_processos_count: int

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