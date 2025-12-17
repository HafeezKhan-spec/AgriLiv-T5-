import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import re

router = APIRouter()

# -------------------------------------------------
# Global variables for lazy loading
# -------------------------------------------------
tokenizer = None
model = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

OUT_OF_SCOPE_MSG = (
    "I can help only with plant, fruit, livestock, and fish related questions."
)

# -------------------------------------------------
# Load lightweight text model
# -------------------------------------------------
def load_text_model():
    global tokenizer, model
    if model is None:
        model_name = "google/flan-t5-small"
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(DEVICE)
            model.eval()
        except Exception as e:
            print(f"Error loading model {model_name}: {e}")
            raise HTTPException(status_code=500, detail="Failed to load text model")

# -------------------------------------------------
# Schemas
# -------------------------------------------------
class TextQueryRequest(BaseModel):
    text: str

class TextQueryResponse(BaseModel):
    type: Literal["text", "image"]
    domain: Literal["plant", "fruit", "livestock", "fish"]
    answer: str
    imageQuery: Optional[str] = None

# -------------------------------------------------
# Domain keywords (expanded & safe)
# -------------------------------------------------
DOMAIN_KEYWORDS = {
    "plant": [
        "plant", "leaf", "crop", "tree", "flower", "root", "stem", "weed", "grass",
        "vegetable", "wheat", "rice", "corn", "maize", "soybean", "cotton", "banana plant",
        "apple plant", "tomato plant"
    ],
    "fruit": [
        "fruit", "apple", "banana", "mango", "citrus", "berry", "grape", "melon",
        "papaya", "orange", "lemon"
    ],
    "livestock": [
        "livestock", "cow", "cattle", "sheep", "goat", "pig", "animal", "farm",
        "chicken", "poultry", "duck", "buffalo"
    ],
    "fish": [
        "fish", "salmon", "trout", "aquaculture", "pond", "shrimp",
        "seafood", "tilapia", "carp"
    ]
}

# -------------------------------------------------
# Helpers
# -------------------------------------------------
def detect_domain(text: str) -> Optional[str]:
    text_lower = text.lower()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for k in keywords:
            if re.search(rf"\b{k}s?\b", text_lower):
                return domain
    return None

def detect_image_intent(text: str) -> bool:
    pattern = r"(show|give|display|get|need|want).*(image|photo|picture|pic)|(image|photo|picture|pic)\s+of"
    return bool(re.search(pattern, text.lower()))

def clean_image_query(text: str) -> str:
    q = re.sub(
        r"(show|give|display|get|need|want)|(image|photo|picture|pic)|(of)",
        "",
        text.lower()
    )
    q = re.sub(r"[^\w\s]", "", q).strip()
    return q or text

# -------------------------------------------------
# Route
# -------------------------------------------------
@router.post("/text/query", response_model=TextQueryResponse)
async def text_query(request: TextQueryRequest):
    load_text_model()

    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty query")

    # 1. Domain detection
    domain = detect_domain(text)
    if not domain:
        return TextQueryResponse(
            type="text",
            domain="plant",
            answer=OUT_OF_SCOPE_MSG
        )

    # 2. Image intent
    if detect_image_intent(text):
        image_query = clean_image_query(text)
        return TextQueryResponse(
            type="image",
            domain=domain,
            imageQuery=image_query,
            answer=f"This image shows an example related to '{image_query}' in the {domain} domain."
        )

    # 3. Specialist Text QA
    try:
        prompt = f"""
You are an agricultural domain specialist.

You have expert knowledge ONLY in:
- Plants (banana plant, apple plant, crops, plant diseases, care)
- Fruits (fruit diseases, growth, prevention)
- Livestock (cow, goat, poultry health and care)
- Fish (aquaculture, fish diseases, pond management)

Domain: {domain}

Answer as a SPECIALIST.

Rules:
- Explain causes and symptoms if relevant
- Suggest prevention and general care methods
- Use simple, farmer-friendly language
- Do NOT give exact chemical names, dosages, or medical prescriptions
- Prefer natural methods and best practices
- Do NOT mention AI, models, or technical terms

Answer in 4 sections:
Causes:
Symptoms:
Prevention:
General care or treatment:

Question:
{text}
"""
        inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)

        outputs = model.generate(
            **inputs,
            max_length=240,
            num_beams=4,
            early_stopping=True,
            no_repeat_ngram_size=2
        )

        answer = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        if not answer or len(answer) < 10:
            answer = (
                "Causes: Environmental stress or nutrient imbalance.\n"
                "Symptoms: Yellowing, spots, or reduced growth.\n"
                "Prevention: Maintain hygiene, proper nutrition, and good water management.\n"
                "General care or treatment: Remove affected parts and consult a local specialist if the issue continues."
            )

        return TextQueryResponse(
            type="text",
            domain=domain,
            answer=answer
        )

    except Exception as e:
        print(f"Text generation error: {e}")
        return TextQueryResponse(
            type="text",
            domain=domain,
            answer="Sorry, I encountered an issue while answering your question."
        )
