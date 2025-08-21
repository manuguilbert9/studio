from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from wordseg.syllabify import Syllabifier
import re
import os

app = FastAPI(title="wordseg-service")

# --- Logique de syllabification ---
VOWELS = "aeiouyàâäéèêëîïôöùûüAEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜ"
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
@app.post("/syllabify", response_model=SegResponse)
def syllabify_endpoint(req: SegRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text.")
    if len(text) > 10000: # Sécurité de base
        raise HTTPException(status_code=413, detail="Text is too long.")

    tokens = re.findall(r"[\w'-]+|[^\w\s]|\s+", text, re.UNICODE)
    
    segmented_words = []
    output_parts = []

    for tok in tokens:
        if re.match(r"[\w'-]+", tok) and not re.match(r"^\d+$", tok):
            syls = syllabifier(tok.lower())
            segmented_word = req.sep.join(syls)
            segmented_words.append(segmented_word)
            output_parts.append(segmented_word)
        else:
            output_parts.append(tok)
            
    return SegResponse(
        original=text,
        segmented_text="".join(output_parts),
        words=segmented_words
    )

@app.get("/healthz", status_code=200)
def health_check():
    return {"status": "ok"}
