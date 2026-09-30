# Google Cloud, GPU Models & Remote Tablet Setup Guide

> **Document Created:** October 1, 2026  
> **Project:** Openzess Full-Stack AI Assistant  
> **Topic:** Google Cloud $300 Trial, Colab GPU Tiers, Tablet Remote Access, and Architecture Breakdown

---

## Table of Contents
1. [Google Cloud $300 Credit & The RBI Verification Issue](#1-google-cloud-300-credit--the-rbi-verification-issue)
2. [Google Colab: Free T4 GPU vs Paid A100 GPU](#2-google-colab-free-t4-gpu-vs-paid-a100-gpu)
3. [How Tablet Access Was Activated (Without Google Cloud)](#3-how-tablet-access-was-activated-without-google-cloud)
4. [Current Live Links & Daily Usage Guide](#4-current-live-links--daily-usage-guide)
5. [Colab Notebook Script: Serving GLM-4 on Free T4 GPU](#5-colab-notebook-script-serving-glm-4-on-free-t4-gpu)
6. [Zero-Cost Alternatives Summary](#6-zero-cost-alternatives-summary)

---

## 1. Google Cloud $300 Credit & The RBI Verification Issue

### What is the Google Cloud Free Trial?
* Google Cloud offers **$300 (₹24,000+ INR)** in free credits to test cloud products (Compute Engine VMs, Cloud Run, Vertex AI) for 90 days.
* **Guarantee from Google:** Google Cloud explicitly guarantees **no automatic charges**. Once the $300 credit runs out or the 90 days end, services simply pause. Google does not charge your bank card unless you manually click *"Upgrade to Paid Account"*.

### Why Did the Verification Fail? (`[OR_BACR2_59]`)
During Step 2 of 2 (*Payment Information Verification*), Google Cloud returned:
```text
Billing setup can't be completed
We were unable to set up your account. [OR_BACR2_59]
```
This is a standard issue in India caused by **Reserve Bank of India (RBI) regulations** on recurring e-mandates:

| Payment Method | Acceptance Status | Reason |
| :--- | :---: | :--- |
| **UPI / QR Code** | ❌ **Rejected** | Google Cloud does not permit UPI for cloud trial identity verification. |
| **RuPay Debit Cards** | ❌ **Rejected** | Domestic network; lacks international recurring authorization protocols. |
| **SBI / Public Sector Debit Cards** | ❌ **Rejected** | International e-mandates and cross-border billing are blocked by default. |
| **Prepaid / Paytm / Airtel Cards** | ❌ **Rejected** | Virtual / prepaid wallets cannot establish automated recurring verification. |
| **International Credit Cards** | ✅ **Accepted** | Visa / Mastercard from HDFC, ICICI, Axis, SBI Card, Kotak, etc. |
| **Global Private Bank Debit Cards** | ✅ **Accepted** | HDFC, ICICI, or Axis debit cards **only if International Transactions are toggled ON** in the banking app. |

### How to Claim the $300 Credit (If you have an eligible card):
1. Open your Bank App (e.g., HDFC MobileBanking, iMobile, Axis Mobile).
2. Navigate to: **Cards ➔ Card Controls / Limits**.
3. Enable **International Transactions** and **Online / E-Commerce**.
4. Set a temporary limit (e.g. ₹500).
5. Enter the card in Google Cloud. Google executes a temporary verification transaction of ₹2 (immediately refunded), and your $300 credit activates.

---

## 2. Google Colab: Free T4 GPU vs Paid A100 GPU

### Understanding the Colab "Change Runtime" Screen
When opening **Google Colab ➔ Runtime ➔ Change runtime type**:
* **A100, H100, L4, TPUs** are grayed out because they require a paid **Colab Pro** or **Google AI Ultra** subscription.
* **T4 GPU is 100% FREE** with **ZERO credit card** or billing required.

### What Can You Run on the Free T4 GPU?
The T4 GPU provides **16 GB of high-speed GDDR6 VRAM**:
* ✅ **GLM-4-9B-Chat** (4-bit quantization via `bitsandbytes` or AWQ — uses ~6 GB to 8 GB VRAM).
* ✅ **Qwen 2.5 Coder 7B / 14B-AWQ** (Premier open coding models).
* ✅ **DeepSeek-R1-Distill-Qwen-7B / 8B** (Reasoning and logic).
* ✅ **Llama 3.1 8B Instruct**.

---

## 3. How Tablet Access Was Activated (Without Google Cloud)

Instead of relying on Google Cloud Run (which was blocked by the billing card verification), we activated direct, secure remote access using your laptop's existing hardware and Cloudflare.

### Architecture Diagram:
```
+-------------------------------------------------------------+
|                     Your Tablet / Phone                     |
|           (At college, on mobile data, or anywhere)         |
+-------------------------------------------------------------+
                              |
                              | HTTPS (Encrypted)
                              v
+-------------------------------------------------------------+
|             Cloudflare Global Edge Network                  |
|        (URL: https://...trycloudflare.com)                  |
+-------------------------------------------------------------+
                              |
                              | Secure Argo Tunnel
                              v
+-------------------------------------------------------------+
|             Your Laptop (Local Host Machine)                |
|                                                             |
|  [Port 8000] FastAPI Unified Server                         |
|    - Serves compiled React UI (/frontend/dist) at "/"       |
|    - Serves AI Agent & Brain API endpoints at "/api/..."     |
|    - Handles WebSockets and Tool Execution                  |
+-------------------------------------------------------------+
```

### Key Technical Achievements:
1. **Single-Port Production Serving:**
   * Vite compiles the entire React frontend into static assets in `frontend/dist`.
   * FastAPI mounts `frontend/dist` at the root path (`/`).
   * **Result:** The UI and API share the exact same origin, completely eliminating CORS errors and port conflicts.
2. **Cloudflare Quick Tunnel (`cloudflared`):**
   * Downloaded `scripts/cloudflared.exe`.
   * Creates an outbound reverse tunnel from your laptop to Cloudflare's nearest edge server.
   * **Zero accounts, zero configuration, zero cost, and zero firewall issues.**

---

## 4. Current Live Links & Daily Usage Guide

### Active Links:
* **Internet / College / Anywhere:**  
  👉 **`https://donald-feeding-guided-chamber.trycloudflare.com`**
* **Home Wi-Fi (Same Network):**  
  👉 **`http://192.168.1.15:8000`**

### Daily 1-Click Launching:
You do not need to remember any terminal commands. We created a dedicated launcher:
1. Open the project folder on your laptop.
2. Double-click **`openzess_tablet.bat`**.
3. It boots the FastAPI server, connects Cloudflare, and saves the fresh URL to **`TABLET_LINK.txt`**.
4. Open the link on your tablet or smartphone!

---

## 5. Colab Notebook Script: Serving GLM-4 on Free T4 GPU

If you want to run **GLM-4** on Google Colab's free T4 GPU and connect it to Openzess or Roo Code:

### Cell 1: Install Dependencies
```bash
!pip install -q transformers accelerate bitsandbytes fastapi uvicorn pydantic pycloudflared
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
!dpkg -i cloudflared-linux-amd64.deb
```

### Cell 2: Launch GLM-4 and Public API Endpoint
```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import threading
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import subprocess
import time
import re

# 1. Load GLM-4-9B in 4-bit (Fits comfortably in 16GB T4 VRAM)
model_id = "THUDM/glm-4-9b-chat"
print("Loading GLM-4-9B...")

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)

tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True
)

# 2. FastAPI OpenAI-compatible API
app = FastAPI()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "glm-4-9b-chat"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatCompletionRequest):
    prompt_history = [{"role": m.role, "content": m.content} for m in req.messages]
    inputs = tokenizer.apply_chat_template(prompt_history, add_generation_prompt=True, tokenize=True, return_tensors="pt").to("cuda")
    
    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=req.max_tokens or 1024,
            do_sample=(req.temperature > 0),
            temperature=req.temperature,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
    return {
        "id": "chatcmpl-colab",
        "object": "chat.completion",
        "model": req.model,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": response},
            "finish_reason": "stop"
        }]
    }

def run_api():
    uvicorn.run(app, host="127.0.0.1", port=8000)

threading.Thread(target=run_api, daemon=True).start()
time.sleep(2)

# Start Cloudflare Tunnel
tunnel = subprocess.Popen(["cloudflared", "tunnel", "--url", "http://127.0.0.1:8000"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
for line in tunnel.stdout:
    match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
    if match:
        print(f"\nYour Public GLM-4 API URL: {match.group(0)}/v1")
        break
```

---

## 6. Zero-Cost Alternatives Summary

| Tool | Capability | Cost | Credit Card Required? |
| :--- | :--- | :---: | :---: |
| **Openzess Remote Tunnel** | Access full app & agent on tablet | **$0** | ❌ No |
| **Google Colab (T4 GPU)** | 16GB VRAM GPU inference (GLM, Qwen) | **$0** | ❌ No |
| **Kaggle GPU** | 30 hours/week dual T4 GPUs | **$0** | ❌ No |
| **OpenRouter Free Tier** | Free models (`:free` endpoints) | **$0** | ❌ No |
| **Google Cloud Trial ($300)** | Cloud VMs, A100 GPU, Cloud Run 24/7 | **$0** (Trial) | ✅ Yes (RBI card required) |
