# arquivo: backend/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from . import models, schemas, security
from .database import get_db, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    processos_na_pagina = db.query(models.Processo).options(
        selectinload(models.Processo.folder_associations)
    ).offset(skip).limit(limit).all()
    return {"total_count": total_count, "data": processos_na_pagina}

@app.patch("/processos/{processo_id}/status", response_model=schemas.Processo)
def update_processo_status(
    processo_id: int, 
    status_update: schemas.ProcessoStatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    processo_db = db.query(models.Processo).filter(models.Processo.id == processo_id).first()
    if not processo_db:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")

    db.query(models.Processo).filter(models.Processo.id == processo_id).update(
        {"status": status_update.status.value}, synchronize_session="fetch"
    )
    db.commit()

    updated_processo = db.query(models.Processo).filter(models.Processo.id == processo_id).first()
    return updated_processo

@app.post("/folders/", response_model=schemas.Folder)
def create_folder(folder: schemas.FolderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    db_folder = db.query(models.Folder).filter(models.Folder.name == folder.name, models.Folder.owner_id == current_user.id).first()
    if db_folder:
        raise HTTPException(status_code=400, detail="Uma pasta com este nome já existe.")
    new_folder = models.Folder(name=folder.name, owner=current_user)
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder

@app.get("/folders/", response_model=List[schemas.Folder])
def read_folders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    folders = db.query(models.Folder).options(
        selectinload(models.Folder.processo_associations).selectinload(models.FolderProcessAssociation.processo)
    ).filter(models.Folder.owner_id == current_user.id).all()
    return folders

@app.get("/folders/{folder_id}", response_model=schemas.Folder)
def read_folder(folder_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    folder = db.query(models.Folder).options(
        selectinload(models.Folder.processo_associations).selectinload(models.FolderProcessAssociation.processo)
    ).filter(
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
    
    for processo_id in request.processo_ids:
        processo_to_add = db.query(models.Processo).filter(models.Processo.id == processo_id).first()
        if not processo_to_add:
            raise HTTPException(status_code=404, detail=f"Processo com ID {processo_id} não encontrado.")
        
        existing_assoc = db.query(models.FolderProcessAssociation).filter_by(folder_id=folder_id, processo_id=processo_id).first()
        if not existing_assoc:
            new_assoc = models.FolderProcessAssociation(folder_id=folder_id, processo_id=processo_id)
            db.add(new_assoc)
    
    db.commit()
    db.refresh(folder)
    return folder

class ObservationUpdateRequest(BaseModel):
    observation: str

@app.patch("/folders/{folder_id}/processos/{processo_id}", response_model=schemas.FolderProcessAssociationSchema)
def update_observation(folder_id: int, processo_id: int, request: ObservationUpdateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    assoc = db.query(models.FolderProcessAssociation).join(models.Folder).filter(
        models.FolderProcessAssociation.folder_id == folder_id,
        models.FolderProcessAssociation.processo_id == processo_id,
        models.Folder.owner_id == current_user.id
    ).first()
    if not assoc:
        raise HTTPException(status_code=404, detail="Associação entre pasta e processo não encontrada ou não pertence ao usuário.")
    
    assoc.observation = request.observation
    db.commit()
    db.refresh(assoc)
    return assoc

@app.delete("/folders/{folder_id}/processos/{processo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_processo_from_folder(folder_id: int, processo_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    assoc = db.query(models.FolderProcessAssociation).join(models.Folder).filter(
        models.FolderProcessAssociation.folder_id == folder_id,
        models.FolderProcessAssociation.processo_id == processo_id,
        models.Folder.owner_id == current_user.id
    ).first()
    if not assoc:
        raise HTTPException(status_code=404, detail="Associação entre pasta e processo não encontrada ou não pertence ao usuário.")
    db.delete(assoc)
    db.commit()
    return

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