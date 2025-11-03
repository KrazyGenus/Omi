

# **Omi: A Parcel Tracker for Dropshippers and Retailers**

## “Knowing Where the Heck Your Parcel Is”

Meet **Omi** — your intelligent parcel-tracking assistant.
She was designed as a solution for **dropshippers**, **retailers**, and **everyday users** who desperately need to know *where the heck their parcel is*.

Omi isn’t just another tracking app.
She’s a **logistics-aware AI agent** capable of understanding messy, human-style parcel inquiries, fetching relevant tracking metadata, and producing **actionable, human-readable reports** powered by the reasoning of a **Large Language Model (LLM)**.

Under the hood, Omi combines:

* **FastAPI** for asynchronous request handling
* **UV** for lightning-fast dependency management
* **Gemini API** for structured data extraction and AI-powered summaries
* **Aiven-managed PostgreSQL** for scalable, secure data persistence
* **Telex** for agent deployment and runtime orchestration
* **Railway** for seamless hosting and CI/CD integration

---

## 🚨 **IMPORTANT NOTICE FOR MENTORS AND TESTERS**

> ⚠️ **CRITICAL TESTING ALERT**
> Due to the nature of parcel-tracking APIs (which require *purchasing an actual product* to obtain a valid tracking number),
> I had to use **mock data** to simulate responses from the **Universal Parcel API** during development and testing.
>
> This mock data **mimics the exact structure** of real-world tracking responses, including datetime fields, carrier info, and nested location objects.
>
> **You can test the Telex agent using the following valid sample package details:**
>
> ```
> Parcel ID: PKG002NG  
> Carrier: DHL  
> ```
>
> Simply send these values through Telex to the agent — it will simulate a real parcel tracking session.

When connected to a production API, this same logic will handle real parcel data without modification.

---

## Core Agent Capabilities

### **1. Intelligent Data Serialization (Gemini)**

Omi leverages the **Google Gemini API** with **strict schema enforcement** to transform poorly formatted inbound parcel data — even human-entered or semi-structured text — into **clean, structured JSON** suitable for database queries and downstream processing.

### **2. Asynchronous Concurrency**

Built with **FastAPI** and **AsyncClient (google-genai)**, Omi performs **non-blocking** I/O operations — enabling simultaneous API calls, DB queries, and AI reasoning without blocking the event loop.

### **3. Actionable Reporting**

A final Gemini-powered step converts raw tracking data into **human-readable summaries**, including parcel status, expected delivery estimates, and geolocation insights — making it ideal for operations dashboards or customer notifications.

---

## Technology Stack & Architecture

| **Component**       | **Role**                             | **Technology**           | **Rationale**                                                      |
| ------------------- | ------------------------------------ | ------------------------ | ------------------------------------------------------------------ |
| **Framework**       | High-performance Web Service         | FastAPI                  | Modern async-first web framework with automatic OpenAPI docs       |
| **LLM Engine**      | Data Structuring & Report Generation | Google Gemini API        | For schema-enforced data extraction and natural-language summaries |
| **Package Manager** | Dependency & Environment Setup       | UV                       | Extremely fast environment creation and dependency resolution      |
| **Database**        | Managed Data Persistence             | Aiven PostgreSQL         | Reliable, scalable cloud-hosted relational DB                      |
| **Agent Platform**  | Deployment & Session Handling        | Telex                    | Provides async runtime environment for AI agents                   |
| **Configuration**   | Secure Parameter Management          | `.env` via python-dotenv | Keeps API keys and DB credentials out of codebase                  |

---

## Project Setup: Establishing the Omi Environment

### **1. Repository Initialization and UV Setup**

```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd omi-parcel-tracker

# Create and activate a virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv sync
```

---

### **2. Configuration (`.env` File)**

Create a `.env` file in the project root with the following variables:

```bash
# --- Gemini API Key ---
GOOGLE_GEMENI_AI_KEY="YOUR_GEMINI_API_KEY_HERE"

# --- PostgreSQL (Aiven) Connection ---
POSTGRES_USER="your_db_user"
POSTGRES_PASSWORD="your_db_password"
POSTGRES_HOST="your-aiven-host.aivencloud.com"
POSTGRES_PORT=19999
POSTGRES_DB="defaultdb"
```

---

### **3. Testing Methodology — The Necessity of Mock Data**

For demonstration purposes, **`retrieve_parcel_meta_by_id()`** is currently implemented with **mock parcel data** that simulates realistic responses from a logistics API.
This includes datetime serialization, nested JSON structures, and carrier-specific tracking formats.

This choice was made because obtaining a **live tracking number** from DHL or any universal API would require **buying a physical product online**, which was impractical within the scope of this project.

Once you integrate a real carrier API (e.g., DHL, FedEx, or Universal Parcel API), simply **replace the mock implementation** with the live data retrieval call — all other parts of the system (Gemini processing, report generation, and Telex integration) will remain fully compatible.

---

## Summary

Omi demonstrates:

* **LLM-powered logistics reasoning**
* **Async-first architecture**
* **Mock-driven testing realism**
* **Telex integration for AI-agent deployment**

Even without a real-world parcel, you can fully experience Omi’s reasoning and report generation via the provided **mock parcel details**.
mi will respond with a simulated but realistic parcel tracking summary.
