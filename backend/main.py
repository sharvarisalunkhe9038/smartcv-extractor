import os
import shutil
import json
from datetime import datetime
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from bson import ObjectId

from extractor import extract_resume_data
from config import UPLOAD_FOLDER
from database import resumes_collection

app = FastAPI(title="SMARTCV EXTRACTOR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Allowed file types
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def is_allowed(filename: str) -> bool:
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


# -------------------- HOME -------------------- #

@app.get("/")
def home():
    return {"message": "SMARTCV EXTRACTOR API Running 24/7"}


# -------------------- SINGLE UPLOAD -------------------- #

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...)):

    if not is_allowed(file.filename):
        raise HTTPException(status_code=400, detail="File type not supported. Use PDF, DOCX, JPG, or PNG.")

    file_path = f"{UPLOAD_FOLDER}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_data = extract_resume_data(file_path)

    document = {
        "filename": file.filename,
        "extracted_data": extracted_data,
        "uploaded_at": datetime.utcnow().isoformat()
    }
    await resumes_collection.insert_one(document)

    return {"success": True, "data": extracted_data}


# -------------------- BULK UPLOAD -------------------- #

@app.post("/upload-resumes/")
async def upload_multiple_resumes(files: List[UploadFile] = File(...)):

    results = []

    for file in files:
        if not is_allowed(file.filename):
            results.append({"filename": file.filename, "error": "File type not supported"})
            continue

        file_path = f"{UPLOAD_FOLDER}/{file.filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extracted_data = extract_resume_data(file_path)

        document = {
            "filename": file.filename,
            "extracted_data": extracted_data,
            "uploaded_at": datetime.utcnow().isoformat()
        }
        await resumes_collection.insert_one(document)

        results.append({"filename": file.filename, "data": extracted_data})

    return {"success": True, "total": len(results), "results": results}


# -------------------- STREAMING BULK UPLOAD -------------------- #

@app.post("/upload-resumes-stream/")
async def upload_resumes_stream(files: List[UploadFile] = File(...)):

    async def generate():
        for file in files:
            if not is_allowed(file.filename):
                result = {"filename": file.filename, "error": "File type not supported"}
                yield json.dumps(result) + "\n"
                continue

            file_path = f"{UPLOAD_FOLDER}/{file.filename}"

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            extracted_data = extract_resume_data(file_path)

            document = {
                "filename": file.filename,
                "extracted_data": extracted_data,
                "uploaded_at": datetime.utcnow().isoformat()
            }
            await resumes_collection.insert_one(document)

            result = {"filename": file.filename, "data": extracted_data}
            yield json.dumps(result) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")


# -------------------- GET ALL RESUMES -------------------- #

@app.get("/resumes/")
async def get_all_resumes():
    resumes = []
    async for doc in resumes_collection.find():
        doc["_id"] = str(doc["_id"])
        resumes.append(doc)
    return {"success": True, "total": len(resumes), "resumes": resumes}


# -------------------- DELETE RESUME -------------------- #

@app.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    result = await resumes_collection.delete_one({"_id": ObjectId(resume_id)})
    if result.deleted_count == 1:
        return {"success": True, "message": "Resume deleted"}
    return {"success": False, "message": "Resume not found"}