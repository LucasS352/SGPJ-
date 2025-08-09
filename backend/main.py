# arquivo: backend/main.py

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

# Importações locais do projeto
from . import models, schemas, security
from .database import SessionLocal, engine

# Deixe esta linha comentada para o desenvolvimento do dia-a-dia
# models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuração do CORS
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTS PARA PROCESSOS ---
@app.post("/processos/", response_model=schemas.Processo)
def create_processo(processo: schemas.ProcessoCreate, db: Session = Depends(get_db)):
    db_processo = db.query(models.Processo).filter(models.Processo.numero_processo == processo.numero_processo).first()
    if db_processo:
        raise HTTPException(status_code=400, detail="Processo já cadastrado")
    db_processo = models.Processo(**processo.dict())
    db.add(db_processo)
    db.commit()
    db.refresh(db_processo)
    return db_processo

@app.get("/processos/", response_model=schemas.ProcessosResponse)
def read_processos(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    total_count = db.query(models.Processo).count()
    processos_na_pagina = db.query(models.Processo).offset(skip).limit(limit).all()
    return {"total_count": total_count, "data": processos_na_pagina}

# --- ENDPOINTS PARA PASTAS (FOLDERS) ---
@app.post("/folders/", response_model=schemas.Folder)
def create_folder(folder: schemas.FolderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    db_folder = db.query(models.Folder).filter(models.Folder.name == folder.name, models.Folder.owner_id == current_user.id).first()
    if db_folder:
        raise HTTPException(status_code=400, detail="Uma pasta com este nome já existe.")
    new_folder = models.Folder(name=folder.name, owner_id=current_user.id)
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder

@app.get("/folders/", response_model=List[schemas.Folder])
def read_folders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    folders = db.query(models.Folder).filter(models.Folder.owner_id == current_user.id).all()
    return folders

@app.get("/folders/{folder_id}", response_model=schemas.Folder)
def read_folder(folder_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    folder = db.query(models.Folder).filter(
        models.Folder.id == folder_id,
        models.Folder.owner_id == current_user.id
    ).first()
    if folder is None:
        raise HTTPException(status_code=404, detail="Pasta não encontrada ou não pertence ao usuário.")
    return folder

class AddProcessosRequest(BaseModel):
    processo_ids: List[int]

@app.post("/folders/{folder_id}/add_processos/", response_model=schemas.Folder)
def add_processos_to_folder(folder_id: int, request: AddProcessosRequest, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    folder = db.query(models.Folder).filter(models.Folder.id == folder_id, models.Folder.owner_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Pasta não encontrada ou não pertence ao usuário.")
    processos_to_add = db.query(models.Processo).filter(models.Processo.id.in_(request.processo_ids)).all()
    if len(processos_to_add) != len(set(request.processo_ids)):
        raise HTTPException(status_code=404, detail="Um ou mais IDs de processo não foram encontrados.")
    for processo in processos_to_add:
        if processo not in folder.processos:
            # --- AQUI ESTAVA O ERRO (proceso -> processo) ---
            folder.processos.append(processo)
    db.commit()
    db.refresh(folder)
    return folder

# --- ENDPOINTS PARA USUÁRIOS E AUTENTICAÇÃO ---
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Usuário já registrado")
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}