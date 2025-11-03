Omi: The Definitive Parcel Tracker for Dropshippers and Retailers

Overview: Knowing Where the Heck Your Parcel Is

I call her Omi, the she was created to as solution for dropshippers like myself, retailers, and anyone desperately needing to know where the heck their parcel is. Omi is not merely a tracking application;.

The agent's primary function is to process complex, unstructured inbound logistical queries, retrieve enriched tracking metadata from a production-grade database, and transform this data into concise, actionable status reports using the sophisticated reasoning of a Large Language Model (LLM), the agent leverages FastAPI for its asynchronous architecture, UV for hyper-efficient dependency management, the Gemini API for intelligent data processing, and Aiven-managed PostgreSQL for secure, scalable data persistence. Deployment is seamlessly integrated via the Telex agent platform and Railway.

Core Agent Capabilities:

Intelligent Data Serialization (Gemini): Omi uses the Gemini API with strict schema enforcement to reliably convert poorly formatted inbound parcel data (e.g., human-entered, semi-colon separated lists) into a structured JSON array, making it instantly usable for database queries.

Asynchronous Concurrency: Utilizes Python's non-blocking async/await pattern (implemented via FastAPI and the google-genai AsyncClient) to execute simultaneous network and database I/O operations without blocking the main event loop, ensuring superior throughput.

Actionable Reporting: A final, powerful Gemini call processes the raw database output and synthesizes it into a human-readable, scannable summary report tailored for operational staff, complete with calculated geolocation maps.

🛠️ Technology Stack & Architecture

Component

Role

Specific Technology

Rationale

Framework

High-performance Web Service

FastAPI

Chosen for its performance, automated documentation, and native support for Python's async/await.

LLM Engine

Data Structuring & Content Generation

Google Gemini API

Used for reliable, schema-enforced data extraction and sophisticated natural language report generation.

Package Manager

Dependency Resolution & Environment

UV

Utilized for its superior speed in virtual environment creation and dependency resolution, dramatically accelerating CI/CD and development setup.

Database

Managed Data Persistence

Aiven PostgreSQL

Provides a robust, scalable, and highly available relational database solution without manual maintenance overhead.

Agent Platform

Deployment & Execution Context

Telex

The specified platform providing the runtime environment and handling the asynchronous session injection.

Configuration

Security & Parameterization

.env (via python-dotenv)

Essential for securely separating sensitive credentials (API keys, DB connection strings) from the codebase.

🚀 Project Setup: Establishing the Omi Environment

This guide assumes the prerequisites of git and the uv package manager are installed on your system.

1. Repository Initialization and UV Setup

Execute the following sequence of commands to clone the repository and establish a clean, reproducible development environment using UV:

# Clone the repository containing the Omi agent code
git clone <YOUR_REPO_URL>
cd omi-parcel-tracker

# Create a new, isolated virtual environment using UV
# The .venv directory ensures environment-specific dependencies are contained.
uv venv

# Activate the virtual environment to ensure all subsequent commands use the isolated environment
source .venv/bin/activate

# Install all necessary dependencies (FastAPI, google-genai, db connectors, etc.)
# UV processes this significantly faster than traditional package managers.
uv pip install -r requirements.txt || uv sync


2. Configuration (.env File)

Omi requires secure access keys and connection parameters. Create a file named .env in the project root directory and populate it meticulously with the following secure credentials:

# --- Gemini API Key ---
# Required for making authenticated calls for data serialization and report generation.
GOOGLE_GEMENI_AI_KEY="YOUR_GEMINI_API_KEY_HERE"

# --- Aiven PostgreSQL Database Connection Details ---
# These are the credentials provided directly by your Aiven service dashboard.
# The agent relies on these to construct the database session connection string.
POSTGRES_USER="your_db_user"
POSTGRES_PASSWORD="your_db_password"
POSTGRES_HOST="your-aiven-host.aivencloud.com"
POSTGRES_PORT=19999
POSTGRES_DB="defaultdb"

3. Testing Methodology: The Necessity of Mock Data

For the purpose of rigorous functional testing and demonstrating the end-to-end capabilities of Omi, the retrieve_parcel_meta_by_id function was initially implemented with mock parcel data generation. This simulated data faithfully reproduces the complex structure, including datetime objects and nested location details, that a real-world logistics API would return.

This methodological choice stemmed from the practical constraint that procuring live, trackable parcel data—which would necessitate the immediate ordering and tracking of a physical item—was infeasible for a proof-of-concept environment. The current implementation thus showcases Omi's processing, LLM-driven serialization, and report generation logic. All that is required for immediate production use is to replace the internal mock implementation of retrieve_parcel_meta_by_id with an actual connection to a carrier's live API (e.g., DHL, FedEx, or a specialized logistics tracking provider) to begin consuming real-world data.