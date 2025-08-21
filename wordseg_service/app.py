from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from wordseg.syllabify import Syllabifier
import re
import os

# --- Configuration ---
API_KEY = os.environ.get("SERVICE_API_KEY")
API_KEY_NAME = "x-api-key"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

app = FastAPI(title="wordseg-service")

# --- Sécurité ---
async def get_api_key(req: Request, key: str = Depends(api_key_header)):
    if not API_KEY:
        # Si aucune clé n'est configurée côté serveur, on laisse passer.
        # Idéal pour le développement local.
        return key

    if key != API_KEY:
        raise HTTPException(
            status_code=403, detail="Could not validate credentials"
        )
    return key

# --- Logique de syllabification ---
# listes FR de base (à affiner si besoin)
VOWELS = "aeiouyàâäéèêëîïôöùûüAEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜ"
# Note: 'qu' et 'gu' sont souvent gérés par l'algo, mais on peut les garder pour forcer
ONSETS = [
    "pr","pl","br","bl","tr","dr","cr","cl","gr","gl","fr","fl","vr",
    "qu","gu","gn","ch","ph","th","sch","sk","sp","st",
    "b","c","d","f","g","h","j","k","l","m","n","p","q","r","s","t","v","w","x","z"
]

syllabifier = Syllabifier(vowels=VOWELS, onsets=set(ONSETS))

# --- Modèles de données (Pydantic) ---
class SegRequest(BaseModel):
    text: str
    sep: str = "."

class SegResponse(BaseModel):
    original: str
    segmented_text: str
    words: list[str]

# --- Route principale ---
@app.post("/syllabify", response_model=SegResponse, dependencies=[Depends(get_api_key)])
def syllabify(req: SegRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text.")
    if len(text) > 5000: # Sécurité de base
        raise HTTPException(status_code=413, detail="Text is too long.")

    # Tokenisation qui conserve les mots et la ponctuation/espaces
    tokens = re.findall(r"[\w'-]+|[^\w\s]|\s+", text, re.UNICODE)
    
    segmented_words = []
    output_parts = []

    for tok in tokens:
        if re.match(r"[\w'-]+", tok): # Si c'est un mot
            # wordseg traite en minuscules, on garde la casse originale pour plus tard si besoin
            syls = syllabifier(tok.lower())
            segmented_word = req.sep.join(syls)
            segmented_words.append(segmented_word)
            output_parts.append(segmented_word)
        else: # Espace, ponctuation...
            output_parts.append(tok)
            
    return SegResponse(
        original=text,
        segmented_text="".join(output_parts),
        words=segmented_words
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}
