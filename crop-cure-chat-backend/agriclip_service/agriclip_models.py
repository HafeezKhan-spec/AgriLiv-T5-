import io
import time
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from PIL import Image
import torch
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    AutoTokenizer,
    AutoModelForSeq2SeqLM
)

# --------------------------------------------------
# FastAPI App
# --------------------------------------------------
app = FastAPI(title="AgriCLIP Custom Model Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# --------------------------------------------------
# Lazy Loaded Models
# --------------------------------------------------
image_processor = None
image_model = None

tokenizer = None
text_model = None


def load_models():
    global image_processor, image_model, tokenizer, text_model

    if image_model is None:
        image_processor = AutoImageProcessor.from_pretrained(
            "HafeezKing/agriclip-plantvillage-15k"
        )
        image_model = AutoModelForImageClassification.from_pretrained(
            "HafeezKing/agriclip-plantvillage-15k"
        ).to(DEVICE)
        image_model.eval()

    if text_model is None:
        tokenizer = AutoTokenizer.from_pretrained(
            "HafeezKing/t5-plant-disease-detector-v2"
        )
        text_model = AutoModelForSeq2SeqLM.from_pretrained(
            "HafeezKing/t5-plant-disease-detector-v2"
        ).to(DEVICE)
        text_model.eval()


# --------------------------------------------------
# Utilities
# --------------------------------------------------
def read_image(upload: UploadFile) -> Image.Image:
    contents = upload.file.read()
    return Image.open(io.BytesIO(contents)).convert("RGB")


def classify_plant_disease(image: Image.Image) -> Dict[str, Any]:
    load_models()

    inputs = image_processor(images=image, return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        outputs = image_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1)
        confidence, predicted_class = probs.max(dim=1)

    label = image_model.config.id2label[predicted_class.item()]
    conf = float(confidence.item())

    return {
        "disease": label,
        "confidence": int(conf * 100)
    }


def generate_disease_report(disease_name: str) -> str:
    load_models()

    prompt = (
        f"Generate disease name, causes, symptoms, cure and precautions "
        f"for plant disease: {disease_name}"
    )

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True).to(DEVICE)

    with torch.no_grad():
        outputs = text_model.generate(
            **inputs,
            max_length=256,
            num_beams=4
        )

    return tokenizer.decode(outputs[0], skip_special_tokens=True)


# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.get("/health")
def health():
    load_models()
    return {
        "success": True,
        "models": {
            "vision": "HafeezKing/agriclip-plantvillage-15k",
            "text": "HafeezKing/t5-plant-disease-detector-v2"
        }
    }


@app.post("/classify")
def classify(
    file: UploadFile = File(...),
    cropType: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
):
    start_time = time.time()

    try:
        image = read_image(file)

        # Step 1: Image Classification
        cls_result = classify_plant_disease(image)

        disease_name = cls_result["disease"]
        confidence = cls_result["confidence"]

        # Step 2: T5 Report Generation
        report = generate_disease_report(disease_name)

        severity = (
            "high" if confidence >= 80
            else "medium" if confidence >= 60
            else "low"
        )

        processing_time = int((time.time() - start_time) * 1000)

        return JSONResponse({
            "success": True,
            "message": "Plant disease analysis completed",
            "data": {
                "classification": {
                    "diseaseDetected": disease_name.lower() != "healthy",
                    "diseaseName": disease_name,
                    "confidence": confidence,
                    "severity": severity,
                    "processingTime": processing_time,
                    "model": "AgriCLIP + T5 Custom Pipeline"
                },
                "report": report
            }
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error during processing",
                "error": str(e)
            }
        )


# --------------------------------------------------
# Run Server
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
