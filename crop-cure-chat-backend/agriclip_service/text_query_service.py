import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import re

router = APIRouter()

# -------------------------------------------------
# Global variables
# -------------------------------------------------
tokenizer = None
model = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

OUT_OF_SCOPE_MSG = (
    "I can help only with plant, fruit, livestock, and fish related questions."
)

# -------------------------------------------------
# Load model
# -------------------------------------------------
def load_text_model():
    global tokenizer, model
    if model is None:
        model_name = "google/flan-t5-small"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(DEVICE)
        model.eval()

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
# Domain keywords
# -------------------------------------------------
DOMAIN_KEYWORDS = {
    "plant": [
        "plant", "leaf", "crop", "tree", "flower",
        "banana plant", "tomato plant", "rice", "wheat", "cotton"
    ],
    "fruit": [
        "fruit", "banana", "apple", "mango", "orange", "grapes"
    ],
    "livestock": [
        "cow", "goat", "sheep", "horse", "hen", "chicken",
        "lion", "tiger", "animal"
    ],
    "fish": [
        "fish", "tilapia", "carp", "shrimp", "pond", "aquaculture"
    ]
}

# -------------------------------------------------
# Helpers
# -------------------------------------------------
def detect_domain(text: str) -> Optional[str]:
    for domain, words in DOMAIN_KEYWORDS.items():
        for w in words:
            if re.search(rf"\b{w}\b", text.lower()):
                return domain
    return None

def detect_image_intent(text: str) -> bool:
    return bool(re.search(r"(image|photo|picture|pic)", text.lower()))

# -------------------------------------------------
# Route
# -------------------------------------------------
@router.post("/text/query", response_model=TextQueryResponse)
async def text_query(request: TextQueryRequest):
    load_text_model()

    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty query")

    domain = detect_domain(text)
    if not domain:
        return TextQueryResponse(
            type="text",
            domain="plant",
            answer=OUT_OF_SCOPE_MSG
        )

    # Image intent
    if detect_image_intent(text):
        return TextQueryResponse(
            type="image",
            domain=domain,
            imageQuery=text,
            answer=f"This image is related to {text} in the {domain} domain."
        )

    # ---------------- IMPROVED PROMPT ----------------
    prompt = f"""
You are an agricultural and veterinary domain specialist.

You have expertise in:
- Plants and crops
- Fruits
- Livestock and poultry
- Fish and aquaculture

Domain: {domain}

Rules:
- Clearly explain prevention methods
- You MAY suggest commonly used pesticides, bio-pesticides, fungicides,
  insecticides, or treatments
- Do NOT mention dosage, concentration, or brand names
- Prefer organic, bio, and traditional methods first
- Use simple farmer-friendly language
- Avoid technical and AI terms

Answer format:
Causes:
Symptoms:
Prevention:
Recommended treatments or pesticides:
General care tips:

Question:
{text}
"""

    try:
        inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)

        outputs = model.generate(
            **inputs,
            max_length=300,
            num_beams=5,
            no_repeat_ngram_size=2
        )

        answer = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        if len(answer) < 20:
            answer = (
                "Causes: Pest attack or environmental stress.\n"
                "Symptoms: Damage to leaves, slow growth, or disease signs.\n"
                "Prevention: Crop rotation, field sanitation, and regular monitoring.\n"
                "Recommended treatments or pesticides: Neem-based products, bio-pesticides, "
                "commonly used insecticides or fungicides as advised locally.\n"
                "General care tips: Maintain soil health and consult an agriculture officer if needed."
            )

        return TextQueryResponse(
            type="text",
            domain=domain,
            answer=answer
        )

    except Exception as e:
        print(e)
        return TextQueryResponse(
            type="text",
            domain=domain,
            answer="Unable to process your question at the moment."
        )
