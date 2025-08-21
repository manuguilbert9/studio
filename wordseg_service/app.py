from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from wordseg.syllabify import Syllabifier
import re
import os
import google.oauth2.id_token
import google.auth.transport.requests

app = FastAPI(title="wordseg-service")

# --- Sécurité ---
http_bearer = HTTPBearer()

def verify_google_id_token(
    token: HTTPAuthorizationCredentials = Depends(http_bearer),
) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    # In a deployed App Hosting environment, BACKEND_URL is set automatically
    expected_audience = os.environ.get("BACKEND_URL")
    
    if not expected_audience:
        # In local dev, we don't need to validate the token
        print("Bypassing token validation for local development.")
        return {"email": "local-dev@example.com"}

    try:
        request = google.auth.transport.requests.Request()
        payload = google.oauth2.id_token.verify_oauth2_token(
            token.credentials, request, audience=expected_audience
        )
        return payload
    except ValueError as e:
        # This will be raised if the token is invalid or expired.
        raise HTTPException(
            status_code=401, detail=f"Invalid or expired token: {e}"
        )


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
@app.post("/syllabify", response_model=SegResponse, dependencies=[Depends(verify_google_id_token)])
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
        if re.match(r"[\w'-]+", tok) and not re.match(r"^\d+$", tok): # Si c'est un mot (et pas juste des chiffres)
            # wordseg traite en minuscules, on garde la casse originale pour plus tard si besoin
            syls = syllabifier(tok.lower())
            segmented_word = req.sep.join(syls)
            segmented_words.append(segmented_word)
            output_parts.append(segmented_word)
        else: # Espace, ponctuation, nombres...
            output_parts.append(tok)
            
    return SegResponse(
        original=text,
        segmented_text="".join(output_parts),
        words=segmented_words
    )

@app.get("/healthz", status_code=200)
def health_check():
    return {"status": "ok"}

    