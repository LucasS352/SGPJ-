# arquivo: backend/schemas.py

from pydantic import BaseModel
from typing import List, Optional

# --- SCHEMAS DE PROCESSO ---
class ProcessoBase(BaseModel):
    numero_processo: str
    nome_reu: str
    cpf_cnpj_reu: str
    valor_causa: str

class ProcessoCreate(ProcessoBase):
    pass

# Schema principal do processo. Note que ainda não inclui a lista de pastas
# para evitar complexidade excessiva na resposta principal da tabela.
class Processo(ProcessoBase):
    id: int
    class Config:
        from_attributes = True

# --- SCHEMAS DE PASTA ---
class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    pass

# Agora o schema Folder pode incluir uma lista de Processos associados
class Folder(FolderBase):
    id: int
    processos: List[Processo] = [] # Inclui a lista de processos
    class Config:
        from_attributes = True

# --- SCHEMA DE RESPOSTA PARA A TABELA DE PROCESSOS ---
# (Este não muda)
class ProcessosResponse(BaseModel):
    total_count: int
    data: List[Processo]

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- ATUALIZE O SCHEMA FOLDER ---
# Precisamos que o schema Folder também retorne quem é o dono
class Folder(FolderBase):
    id: int
    owner_id: int
    processos: List[Processo] = []
    class Config:
        from_attributes = True