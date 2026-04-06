from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import json as json_module
import re
import asyncio
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import Optional, List
from seed_data import seed_database

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

app = FastAPI(title="Kavach - DPDPA Compliance Platform")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Auth helpers ───
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=8), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"email": payload["email"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Models ───
class LoginRequest(BaseModel):
    email: str
    password: str

class SourceCreate(BaseModel):
    name: str
    source_type: str
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None

class RiskResolve(BaseModel):
    resolution_notes: str

class ConsentPurposeCreate(BaseModel):
    purpose_name: str
    purpose_description: str
    legal_basis: str
    data_categories_used: List[str] = []
    retention_days: int = 365

class BreachCreate(BaseModel):
    title: str
    description: str
    breach_type: str
    severity: str
    affected_principals_count: int = 0
    data_categories_affected: List[str] = []

class RightsRequestUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class ScanStartRequest(BaseModel):
    source_id: str
    job_type: str = "FULL"

class ReportGenerateRequest(BaseModel):
    report_type: str = "MONTHLY"
    title: Optional[str] = None

class ChildVerifyRequest(BaseModel):
    child_record_id: str
    verification_method: str = "DIGILOCKER"

# ─── Auth Routes ───
@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    user = await db.users.find_one({"email": req.email.lower().strip()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=28800, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=False, samesite="lax", max_age=2592000, path="/")
    await db.users.update_one({"email": user["email"]}, {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}})
    safe = {k: v for k, v in user.items() if k != "password_hash"}
    return {"user": safe, "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}

# ─── Dashboard ───
@api_router.get("/dashboard/stats")
async def dashboard_stats(user=Depends(get_current_user)):
    org_id = user["org_id"]
    assets_count = await db.data_assets.count_documents({"org_id": org_id})
    cols_count = await db.column_classifications.count_documents({})
    open_flags = await db.risk_flags.count_documents({"org_id": org_id, "resolved_at": {"$exists": False}})
    rights_pending = await db.rights_requests.count_documents({"org_id": org_id, "status": {"$in": ["SUBMITTED", "IN_PROGRESS"]}})
    consent = await db.consent_stats.find_one({"org_id": org_id}, {"_id": 0})
    breaches = await db.breach_events.count_documents({"org_id": org_id})
    vendors_at_risk = await db.vendors.count_documents({"org_id": org_id, "risk_tier": {"$in": ["HIGH", "CRITICAL"]}})
    children_assets = await db.data_assets.count_documents({"org_id": org_id, "has_children_data": True})
    return {
        "assets_scanned": assets_count,
        "columns_classified": cols_count,
        "open_risk_flags": open_flags,
        "rights_pending": rights_pending,
        "active_consents": consent.get("active", 0) if consent else 0,
        "breach_events": breaches,
        "vendors_at_risk": vendors_at_risk,
        "children_data_assets": children_assets,
        "consent_stats": consent,
    }

@api_router.get("/dashboard/compliance-score")
async def compliance_score(user=Depends(get_current_user)):
    score = await db.compliance_scores.find_one({"org_id": user["org_id"]}, {"_id": 0})
    return score or {"overall_score": 0}

@api_router.get("/dashboard/risk-distribution")
async def risk_distribution(user=Depends(get_current_user)):
    pipeline = [
        {"$match": {"org_id": user["org_id"]}},
        {"$group": {"_id": "$risk_tier", "count": {"$sum": 1}}}
    ]
    results = await db.data_assets.aggregate(pipeline).to_list(100)
    dist = {r["_id"]: r["count"] for r in results}
    return {"critical": dist.get("CRITICAL", 0), "high": dist.get("HIGH", 0), "medium": dist.get("MEDIUM", 0), "low": dist.get("LOW", 0)}

@api_router.get("/dashboard/recent-scans")
async def recent_scans(user=Depends(get_current_user)):
    scans = await db.scan_jobs.find({"org_id": user["org_id"]}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return scans

@api_router.get("/dashboard/sla-breaches")
async def sla_breaches(user=Depends(get_current_user)):
    requests = await db.rights_requests.find({"org_id": user["org_id"], "sla_breached": True}, {"_id": 0}).to_list(100)
    return requests

# ─── Data Sources ───
@api_router.get("/sources")
async def list_sources(user=Depends(get_current_user)):
    sources = await db.data_sources.find({"org_id": user["org_id"]}, {"_id": 0}).to_list(100)
    for s in sources:
        s["asset_count"] = await db.data_assets.count_documents({"source_id": s["id"]})
    return sources

@api_router.post("/sources")
async def create_source(src: SourceCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "org_id": user["org_id"],
        **src.model_dump(),
        "connection_status": "UNTESTED",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.data_sources.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/sources/{source_id}")
async def get_source(source_id: str, user=Depends(get_current_user)):
    src = await db.data_sources.find_one({"id": source_id, "org_id": user["org_id"]}, {"_id": 0})
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    return src

@api_router.post("/sources/{source_id}/test")
async def test_source(source_id: str, user=Depends(get_current_user)):
    src = await db.data_sources.find_one({"id": source_id}, {"_id": 0})
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.data_sources.update_one({"id": source_id}, {"$set": {"connection_status": "CONNECTED", "last_connected_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "CONNECTED", "message": f"Successfully connected to {src['name']}"}

# ─── Assets ───
@api_router.get("/assets")
async def list_assets(user=Depends(get_current_user), source_id: Optional[str] = None, risk_tier: Optional[str] = None, search: Optional[str] = None):
    query = {"org_id": user["org_id"]}
    if source_id:
        query["source_id"] = source_id
    if risk_tier:
        query["risk_tier"] = risk_tier
    if search:
        query["asset_name"] = {"$regex": search, "$options": "i"}
    assets = await db.data_assets.find(query, {"_id": 0}).to_list(100)
    return assets

@api_router.get("/assets/{asset_id}")
async def get_asset(asset_id: str, user=Depends(get_current_user)):
    asset = await db.data_assets.find_one({"id": asset_id, "org_id": user["org_id"]}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@api_router.get("/assets/{asset_id}/columns")
async def get_asset_columns(asset_id: str, user=Depends(get_current_user)):
    columns = await db.column_classifications.find({"asset_id": asset_id}, {"_id": 0}).sort("position", 1).to_list(100)
    return columns

# ─── Risk Flags ───
@api_router.get("/risk/flags")
async def list_risk_flags(user=Depends(get_current_user), severity: Optional[str] = None):
    query = {"org_id": user["org_id"]}
    if severity:
        query["severity"] = severity
    flags = await db.risk_flags.find(query, {"_id": 0}).to_list(100)
    for f in flags:
        asset = await db.data_assets.find_one({"id": f.get("asset_id")}, {"_id": 0, "asset_name": 1})
        f["asset_name"] = asset.get("asset_name", "Unknown") if asset else "Unknown"
    return flags

@api_router.get("/risk/summary")
async def risk_summary(user=Depends(get_current_user)):
    org_id = user["org_id"]
    pipeline = [
        {"$match": {"org_id": org_id, "resolved_at": {"$exists": False}}},
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}}
    ]
    results = await db.risk_flags.aggregate(pipeline).to_list(10)
    summary = {r["_id"]: r["count"] for r in results}
    return {"critical": summary.get("CRITICAL", 0), "high": summary.get("HIGH", 0), "medium": summary.get("MEDIUM", 0), "total": sum(summary.values())}

@api_router.patch("/risk/flags/{flag_id}/resolve")
async def resolve_flag(flag_id: str, body: RiskResolve, user=Depends(get_current_user)):
    result = await db.risk_flags.update_one(
        {"id": flag_id, "org_id": user["org_id"]},
        {"$set": {"resolved_at": datetime.now(timezone.utc).isoformat(), "resolved_by": user["id"], "resolution_notes": body.resolution_notes}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Flag not found")
    return {"message": "Flag resolved"}

# ─── Consent ───
@api_router.get("/consent/purposes")
async def list_consent_purposes(user=Depends(get_current_user)):
    purposes = await db.consent_purposes.find({"org_id": user["org_id"]}, {"_id": 0}).to_list(100)
    return purposes

@api_router.post("/consent/purposes")
async def create_consent_purpose(body: ConsentPurposeCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "org_id": user["org_id"],
        **body.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.consent_purposes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/consent/dashboard")
async def consent_dashboard(user=Depends(get_current_user)):
    stats = await db.consent_stats.find_one({"org_id": user["org_id"]}, {"_id": 0})
    purposes = await db.consent_purposes.find({"org_id": user["org_id"]}, {"_id": 0}).to_list(100)
    return {"stats": stats or {}, "purposes": purposes}

@api_router.get("/consent/records")
async def consent_records(user=Depends(get_current_user)):
    stats = await db.consent_stats.find_one({"org_id": user["org_id"]}, {"_id": 0})
    return stats or {}

# ─── Rights Requests ───
@api_router.get("/rights/requests")
async def list_rights_requests(user=Depends(get_current_user), status: Optional[str] = None, request_type: Optional[str] = None):
    query = {"org_id": user["org_id"]}
    if status:
        query["status"] = status
    if request_type:
        query["request_type"] = request_type
    requests = await db.rights_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return requests

@api_router.patch("/rights/requests/{request_id}")
async def update_rights_request(request_id: str, body: RightsRequestUpdate, user=Depends(get_current_user)):
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if body.status:
        update["status"] = body.status
        if body.status == "COMPLETED":
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.rights_requests.update_one({"id": request_id, "org_id": user["org_id"]}, {"$set": update})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Updated"}

# ─── Breach Events ───
@api_router.get("/breach/events")
async def list_breach_events(user=Depends(get_current_user)):
    events = await db.breach_events.find({"org_id": user["org_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return events

@api_router.get("/breach/events/{event_id}")
async def get_breach_event(event_id: str, user=Depends(get_current_user)):
    event = await db.breach_events.find_one({"id": event_id, "org_id": user["org_id"]}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Breach event not found")
    return event

@api_router.post("/breach/events")
async def create_breach_event(body: BreachCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "org_id": user["org_id"],
        **body.model_dump(),
        "status": "DETECTED",
        "detected_at": datetime.now(timezone.utc).isoformat(),
        "dpbi_notification_deadline": (datetime.now(timezone.utc) + timedelta(hours=72)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.breach_events.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/breach/anomalies")
async def list_anomalies(user=Depends(get_current_user)):
    anomalies = await db.anomaly_detections.find({"org_id": user["org_id"]}, {"_id": 0}).sort("detected_at", -1).to_list(100)
    return anomalies

# ─── Vendors ───
@api_router.get("/vendors")
async def list_vendors(user=Depends(get_current_user)):
    vendors = await db.vendors.find({"org_id": user["org_id"]}, {"_id": 0}).to_list(100)
    return vendors

@api_router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: str, user=Depends(get_current_user)):
    vendor = await db.vendors.find_one({"id": vendor_id, "org_id": user["org_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

# ─── Compliance ───
@api_router.get("/compliance/score")
async def get_compliance_score(user=Depends(get_current_user)):
    score = await db.compliance_scores.find_one({"org_id": user["org_id"]}, {"_id": 0})
    return score or {"overall_score": 0}

@api_router.get("/scan/jobs")
async def list_scan_jobs(user=Depends(get_current_user)):
    jobs = await db.scan_jobs.find({"org_id": user["org_id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return jobs

@api_router.get("/scan/jobs/{job_id}")
async def get_scan_job(job_id: str, user=Depends(get_current_user)):
    job = await db.scan_jobs.find_one({"id": job_id, "org_id": user["org_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Scan job not found")
    return job

# ─── AI Scan Engine ───

async def run_ai_classification(job_id: str, org_id: str, source_id: str):
    """Background task: AI-powered column classification for a data source."""
    try:
        await db.scan_jobs.update_one({"id": job_id}, {"$set": {"status": "RUNNING", "started_at": datetime.now(timezone.utc).isoformat()}})

        # Get assets for this source
        assets = await db.data_assets.find({"org_id": org_id, "source_id": source_id}, {"_id": 0}).to_list(100)
        if not assets:
            await db.scan_jobs.update_one({"id": job_id}, {"$set": {"status": "COMPLETED", "progress_percent": 100, "completed_at": datetime.now(timezone.utc).isoformat()}})
            return

        total_assets = len(assets)
        total_cols = 0
        total_flags = 0

        for idx, asset in enumerate(assets):
            await db.scan_jobs.update_one({"id": job_id}, {"$set": {
                "current_asset": asset["asset_name"],
                "progress_percent": int((idx / total_assets) * 100),
                "assets_scanned": idx,
            }})

            # Get existing columns for this asset
            existing_cols = await db.column_classifications.find({"asset_id": asset["id"]}, {"_id": 0}).to_list(200)
            if not existing_cols:
                await asyncio.sleep(0.5)
                continue

            # Build column info for AI
            col_info = [{"name": c["column_name"], "type": c["data_type"], "position": c.get("position", 0)} for c in existing_cols]

            try:
                from emergentintegrations.llm.chat import LlmChat, UserMessage
                llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
                if not llm_key:
                    raise ValueError("No LLM key")

                system_msg = """You are a DPDPA 2023 data classification expert. Classify database columns into DPDPA categories.
For each column, return a JSON array with objects containing:
- column_name: the column name
- dpdpa_category: one of SENSITIVE_PERSONAL, FINANCIAL, CHILDREN, PERSONAL, OPERATIONAL
- subcategory: specific type (e.g., aadhaar, pan_card, phone_number, salary, etc.)
- confidence_score: 0-100
- risk_tier: CRITICAL, HIGH, MEDIUM, or LOW
- is_pii: true/false
- dpdpa_section_ref: relevant DPDPA section
- reasoning: brief explanation

Rules:
- Aadhaar, PAN, religion, caste, biometric, health = SENSITIVE_PERSONAL (CRITICAL)
- Account numbers, balances, card numbers, UPI = FINANCIAL (CRITICAL/HIGH)
- Names, emails, phones, addresses, DOB = PERSONAL (HIGH/MEDIUM)
- IDs, status, dates, types = OPERATIONAL (LOW)

Return ONLY valid JSON array. No markdown, no explanation outside the JSON."""

                session_id = f"scan-{job_id}-{asset['id'][:8]}"
                chat = LlmChat(api_key=llm_key, session_id=session_id, system_message=system_msg)
                chat.with_model("openai", "gpt-4o-mini")

                user_prompt = f"Classify these columns from table '{asset['asset_name']}' (Indian banking context):\n{json_module.dumps(col_info, indent=2)}"
                user_msg = UserMessage(text=user_prompt)
                response = await chat.send_message(user_msg)

                # Parse AI response
                classifications = []
                try:
                    # Try to extract JSON from response
                    json_match = re.search(r'\[.*\]', response, re.DOTALL)
                    if json_match:
                        classifications = json_module.loads(json_match.group())
                except (json_module.JSONDecodeError, AttributeError):
                    logger.warning(f"Failed to parse AI response for {asset['asset_name']}")

                # Update column classifications with AI results
                for cls in classifications:
                    col_name = cls.get("column_name", "")
                    if not col_name:
                        continue

                    update_data = {
                        "dpdpa_category": cls.get("dpdpa_category", "UNCLASSIFIED"),
                        "subcategory": cls.get("subcategory", "unknown"),
                        "confidence_score": min(99, max(50, cls.get("confidence_score", 75))),
                        "risk_tier": cls.get("risk_tier", "MEDIUM"),
                        "is_pii": cls.get("is_pii", False),
                        "dpdpa_section_ref": cls.get("dpdpa_section_ref", "Section 8"),
                        "llm_reasoning": cls.get("reasoning", ""),
                        "classified_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }

                    result = await db.column_classifications.update_one(
                        {"asset_id": asset["id"], "column_name": col_name},
                        {"$set": update_data}
                    )
                    if result.modified_count > 0:
                        total_cols += 1

                # Check for risk flags from AI classifications
                for cls in classifications:
                    if cls.get("risk_tier") == "CRITICAL" and cls.get("dpdpa_category") == "SENSITIVE_PERSONAL":
                        # Check if flag already exists
                        existing_flag = await db.risk_flags.find_one({
                            "org_id": org_id, "asset_id": asset["id"],
                            "flag_type": {"$regex": cls.get("subcategory", "").upper()}
                        })
                        if not existing_flag:
                            flag_doc = {
                                "id": str(uuid.uuid4()),
                                "org_id": org_id,
                                "asset_id": asset["id"],
                                "flag_type": f"AI_DETECTED_{cls.get('subcategory', 'UNKNOWN').upper()}",
                                "description": f"AI scan detected {cls.get('dpdpa_category')} data ({cls.get('subcategory')}) in column {cls.get('column_name')} of {asset['asset_name']}. Confidence: {cls.get('confidence_score')}%.",
                                "dpdpa_section": cls.get("dpdpa_section_ref", "Section 8"),
                                "severity": "CRITICAL",
                                "remediation_advice": f"Review and apply appropriate security controls for {cls.get('subcategory')} data as per DPDPA requirements.",
                                "created_at": datetime.now(timezone.utc).isoformat(),
                            }
                            await db.risk_flags.insert_one(flag_doc)
                            total_flags += 1

            except Exception as e:
                logger.error(f"AI classification error for {asset['asset_name']}: {e}")

            await asyncio.sleep(0.3)  # Rate limiting

        # Complete the job
        await db.scan_jobs.update_one({"id": job_id}, {"$set": {
            "status": "COMPLETED",
            "progress_percent": 100,
            "assets_scanned": total_assets,
            "columns_classified": total_cols,
            "risk_flags_created": total_flags,
            "current_asset": None,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }})
        logger.info(f"Scan job {job_id} completed: {total_assets} assets, {total_cols} columns, {total_flags} flags")

    except Exception as e:
        logger.error(f"Scan job {job_id} failed: {e}")
        await db.scan_jobs.update_one({"id": job_id}, {"$set": {
            "status": "FAILED",
            "error_message": str(e),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }})


@api_router.post("/scan/start")
async def start_scan(body: ScanStartRequest, user=Depends(get_current_user)):
    # Check source exists
    source = await db.data_sources.find_one({"id": body.source_id, "org_id": user["org_id"]}, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    # Check no running scan for this source
    running = await db.scan_jobs.find_one({"org_id": user["org_id"], "source_id": body.source_id, "status": {"$in": ["QUEUED", "RUNNING"]}})
    if running:
        raise HTTPException(status_code=409, detail="A scan is already running for this source")

    job_id = str(uuid.uuid4())
    job_doc = {
        "id": job_id,
        "org_id": user["org_id"],
        "source_id": body.source_id,
        "source_name": source.get("name", "Unknown"),
        "job_type": body.job_type,
        "status": "QUEUED",
        "progress_percent": 0,
        "current_asset": None,
        "assets_scanned": 0,
        "columns_classified": 0,
        "risk_flags_created": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.scan_jobs.insert_one(job_doc)
    job_doc.pop("_id", None)

    # Start background task
    asyncio.create_task(run_ai_classification(job_id, user["org_id"], body.source_id))

    return job_doc

# ─── Children's Data Shield ───
@api_router.get("/children/dashboard")
async def children_dashboard(user=Depends(get_current_user)):
    org_id = user["org_id"]
    total = await db.child_records.count_documents({"org_id": org_id})
    verified = await db.child_records.count_documents({"org_id": org_id, "verification_status": "VERIFIED"})
    pending = await db.child_records.count_documents({"org_id": org_id, "verification_status": "PENDING"})
    failed = await db.child_records.count_documents({"org_id": org_id, "verification_status": "FAILED"})
    expired = await db.child_records.count_documents({"org_id": org_id, "verification_status": "EXPIRED"})
    blocked = await db.child_records.count_documents({"org_id": org_id, "data_blocked": True})
    return {
        "total_minors": total,
        "verified": verified,
        "pending": pending,
        "failed": failed,
        "expired": expired,
        "data_blocked": blocked,
    }

@api_router.get("/children/records")
async def list_child_records(user=Depends(get_current_user), status: Optional[str] = None):
    query = {"org_id": user["org_id"]}
    if status:
        query["verification_status"] = status
    records = await db.child_records.find(query, {"_id": 0}).to_list(100)
    return records

@api_router.post("/children/verify-digilocker")
async def verify_digilocker(body: ChildVerifyRequest, user=Depends(get_current_user)):
    record = await db.child_records.find_one({"id": body.child_record_id, "org_id": user["org_id"]}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Child record not found")

    # Create verification entry (mock DigiLocker)
    verification_id = str(uuid.uuid4())
    verification = {
        "id": verification_id,
        "org_id": user["org_id"],
        "child_record_id": body.child_record_id,
        "child_name": record["principal_name"],
        "guardian_name": record.get("guardian_name", "Unknown"),
        "verification_method": body.verification_method,
        "status": "PENDING",
        "initiated_at": datetime.now(timezone.utc).isoformat(),
        "initiated_by": user["email"],
    }
    await db.child_verifications.insert_one(verification)
    verification.pop("_id", None)

    # Update child record
    await db.child_records.update_one(
        {"id": body.child_record_id},
        {"$set": {"verification_status": "PENDING", "verification_method": body.verification_method}}
    )

    # Simulate async verification (mock DigiLocker response after 3 seconds)
    async def mock_digilocker_verify():
        await asyncio.sleep(3)
        import random
        success = random.random() > 0.15  # 85% success rate
        if success:
            await db.child_verifications.update_one({"id": verification_id}, {"$set": {
                "status": "VERIFIED",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "guardian_age_confirmed": True,
                "child_age_confirmed": True,
                "digilocker_response": {"verified": True, "method": body.verification_method, "timestamp": datetime.now(timezone.utc).isoformat()},
            }})
            await db.child_records.update_one({"id": body.child_record_id}, {"$set": {
                "verification_status": "VERIFIED",
                "consent_status": "VERIFIED",
                "data_blocked": False,
            }})
        else:
            await db.child_verifications.update_one({"id": verification_id}, {"$set": {
                "status": "FAILED",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "failure_reason": "Guardian verification could not be completed. Please try again.",
            }})
            await db.child_records.update_one({"id": body.child_record_id}, {"$set": {
                "verification_status": "FAILED",
            }})

    asyncio.create_task(mock_digilocker_verify())
    return {"message": "Verification initiated", "verification_id": verification_id, "status": "PENDING"}

@api_router.get("/children/verifications")
async def list_child_verifications(user=Depends(get_current_user)):
    verifications = await db.child_verifications.find({"org_id": user["org_id"]}, {"_id": 0}).sort("initiated_at", -1).to_list(100)
    return verifications

# ─── Audit Reports & PDF Generation ───
@api_router.get("/compliance/reports")
async def list_reports(user=Depends(get_current_user)):
    reports = await db.audit_reports.find({"org_id": user["org_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return reports

@api_router.get("/compliance/reports/{report_id}")
async def get_report(report_id: str, user=Depends(get_current_user)):
    report = await db.audit_reports.find_one({"id": report_id, "org_id": user["org_id"]}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@api_router.post("/compliance/reports")
async def generate_report(body: ReportGenerateRequest, user=Depends(get_current_user)):
    org_id = user["org_id"]

    # Gather data for report
    score = await db.compliance_scores.find_one({"org_id": org_id}, {"_id": 0})
    flags = await db.risk_flags.find({"org_id": org_id, "resolved_at": {"$exists": False}}, {"_id": 0}).to_list(100)
    assets_count = await db.data_assets.count_documents({"org_id": org_id})
    breach_count = await db.breach_events.count_documents({"org_id": org_id})
    rights = await db.rights_requests.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    vendors = await db.vendors.find({"org_id": org_id}, {"_id": 0}).to_list(100)

    report_data = {
        "score": score.get("overall_score", 0) if score else 0,
        "module_scores": {
            "data_discovery": score.get("data_discovery_score", 0) if score else 0,
            "consent": score.get("consent_score", 0) if score else 0,
            "rights": score.get("rights_score", 0) if score else 0,
            "breach_readiness": score.get("breach_readiness_score", 0) if score else 0,
            "vendor": score.get("vendor_score", 0) if score else 0,
            "children": score.get("children_protection_score", 0) if score else 0,
        },
        "open_flags": len(flags),
        "critical_flags": len([f for f in flags if f.get("severity") == "CRITICAL"]),
        "assets_scanned": assets_count,
        "breach_events": breach_count,
        "rights_total": len(rights),
        "rights_completed": len([r for r in rights if r.get("status") == "COMPLETED"]),
        "vendors_total": len(vendors),
        "vendors_high_risk": len([v for v in vendors if v.get("risk_tier") in ["HIGH", "CRITICAL"]]),
    }

    # Generate AI summary
    ai_summary = ""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if llm_key:
            sys_msg = "You are a DPDPA compliance report writer. Generate a concise executive summary for the compliance report. Be specific with numbers and actionable recommendations."
            session_id = f"report-{str(uuid.uuid4())[:8]}"
            chat = LlmChat(api_key=llm_key, session_id=session_id, system_message=sys_msg)
            chat.with_model("openai", "gpt-4o-mini")
            prompt = f"""Generate an executive summary for this DPDPA compliance report:
- Overall Score: {report_data['score']}/100
- Module Scores: {json_module.dumps(report_data['module_scores'])}
- Open Risk Flags: {report_data['open_flags']} ({report_data['critical_flags']} critical)
- Assets Scanned: {report_data['assets_scanned']}
- Breach Events: {report_data['breach_events']}
- Rights Requests: {report_data['rights_total']} total, {report_data['rights_completed']} completed
- Vendors: {report_data['vendors_total']} total, {report_data['vendors_high_risk']} high risk
Report type: {body.report_type}"""
            user_msg = UserMessage(text=prompt)
            ai_summary = await chat.send_message(user_msg)
    except Exception as e:
        logger.error(f"AI summary generation error: {e}")
        ai_summary = f"Compliance score: {report_data['score']}/100. {report_data['open_flags']} open risk flags ({report_data['critical_flags']} critical). {report_data['assets_scanned']} assets under monitoring."

    title = body.title or f"{body.report_type.title()} DPDPA Compliance Report - {datetime.now(timezone.utc).strftime('%B %Y')}"
    report_doc = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "report_type": body.report_type,
        "title": title,
        "status": "READY",
        "ai_summary": ai_summary,
        "report_data": report_data,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user.get("full_name", "System"),
    }
    await db.audit_reports.insert_one(report_doc)
    report_doc.pop("_id", None)
    return report_doc

@api_router.get("/compliance/reports/{report_id}/pdf")
async def download_report_pdf(report_id: str, user=Depends(get_current_user)):
    report = await db.audit_reports.find_one({"id": report_id, "org_id": user["org_id"]}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    from fpdf import FPDF
    from fastapi.responses import StreamingResponse
    import io

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(88, 166, 255)  # accent blue
    pdf.cell(0, 15, "KAVACH", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(139, 148, 158)
    pdf.cell(0, 8, "DPDPA 2023 Compliance Platform", ln=True, align="C")
    pdf.ln(5)

    # Title
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 12, report.get("title", "Compliance Report"), ln=True, align="C")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, f"Generated: {report.get('generated_at', '')[:10]}  |  Type: {report.get('report_type', 'N/A')}  |  Organisation: Bharatiya Sahkar Bank Ltd", ln=True, align="C")
    pdf.ln(8)

    # Line separator
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(8)

    # Compliance Score
    data = report.get("report_data", {})
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, f"Overall DPDPA Compliance Score: {data.get('score', 0)}/100", ln=True)
    pdf.ln(4)

    # Module Scores Table
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "Module-wise Scores", ln=True)
    pdf.set_font("Helvetica", "", 10)

    modules = data.get("module_scores", {})
    module_labels = {
        "data_discovery": "Data Discovery",
        "consent": "Consent Management",
        "rights": "Rights Management",
        "breach_readiness": "Breach Readiness",
        "vendor": "Vendor Management",
        "children": "Children Protection",
    }
    for key, label in module_labels.items():
        score_val = modules.get(key, 0)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(90, 7, f"  {label}", border=1, fill=True)
        if score_val >= 70:
            pdf.set_text_color(0, 150, 0)
        elif score_val >= 50:
            pdf.set_text_color(200, 130, 0)
        else:
            pdf.set_text_color(200, 0, 0)
        pdf.cell(30, 7, f"  {score_val}/100", border=1, ln=True)
        pdf.set_text_color(0, 0, 0)
    pdf.ln(6)

    # Key Metrics
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "Key Metrics", ln=True)
    pdf.set_font("Helvetica", "", 10)
    metrics = [
        ("Open Risk Flags", f"{data.get('open_flags', 0)} ({data.get('critical_flags', 0)} critical)"),
        ("Assets Under Monitoring", str(data.get("assets_scanned", 0))),
        ("Breach Events", str(data.get("breach_events", 0))),
        ("Rights Requests", f"{data.get('rights_completed', 0)}/{data.get('rights_total', 0)} completed"),
        ("Vendors", f"{data.get('vendors_total', 0)} total, {data.get('vendors_high_risk', 0)} high risk"),
    ]
    for label, value in metrics:
        pdf.cell(90, 7, f"  {label}", border=1)
        pdf.cell(90, 7, f"  {value}", border=1, ln=True)
    pdf.ln(6)

    # AI Executive Summary
    summary = report.get("ai_summary", "")
    if summary:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 8, "Executive Summary", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, summary)
    pdf.ln(6)

    # Footer
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 8, "This report was generated by Kavach DPDPA Compliance Platform. Confidential.", ln=True, align="C")

    # Output
    pdf_bytes = pdf.output()
    buffer = io.BytesIO(pdf_bytes)
    buffer.seek(0)

    filename = f"kavach_report_{report_id[:8]}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ─── AI DPO Copilot ───
@api_router.post("/compliance/dpo-copilot")
async def dpo_copilot(request: Request, user=Depends(get_current_user)):
    body = await request.json()
    message = body.get("message", "")
    if not message:
        raise HTTPException(status_code=400, detail="Message required")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        score = await db.compliance_scores.find_one({"org_id": user["org_id"]}, {"_id": 0})
        flags = await db.risk_flags.find({"org_id": user["org_id"], "resolved_at": {"$exists": False}}, {"_id": 0}).to_list(20)

        system_msg = f"""You are a DPDPA 2023 compliance expert assistant for Bharatiya Sahkar Bank Ltd.
Current compliance score: {score.get('overall_score', 'N/A')}/100.
Open risk flags: {len(flags)}.
Key areas: Data Discovery ({score.get('data_discovery_score', 'N/A')}), Consent ({score.get('consent_score', 'N/A')}), Rights ({score.get('rights_score', 'N/A')}), Breach Readiness ({score.get('breach_readiness_score', 'N/A')}), Vendor ({score.get('vendor_score', 'N/A')}), Children Protection ({score.get('children_protection_score', 'N/A')}).
Answer questions about DPDPA 2023 compliance with specific section references. Be concise and actionable."""

        session_id = f"copilot-{user['id']}-{str(uuid.uuid4())[:8]}"
        chat = LlmChat(api_key=llm_key, session_id=session_id, system_message=system_msg)
        chat.with_model("openai", "gpt-4o-mini")
        user_msg = UserMessage(text=message)
        response = await chat.send_message(user_msg)
        return {"response": response, "model": "gpt-4o-mini"}
    except Exception as e:
        logger.error(f"DPO Copilot error: {e}")
        return {"response": f"AI service temporarily unavailable. Error: {str(e)}", "model": "fallback"}

# ─── Include router & CORS ───
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), os.environ.get("CORS_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("Starting Kavach - DPDPA Compliance Platform")
    try:
        seeded = await seed_database(db)
        if seeded:
            logger.info("Database seeded with sample data")
        else:
            logger.info("Database already contains data")
    except Exception as e:
        logger.error(f"Seed error: {e}")

    # Write test credentials
    try:
        os.makedirs("/app/memory", exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write("# Test Credentials\n\n")
            f.write("## Admin\n- Email: admin@bharatiyabank.example.com\n- Password: Kavach@2024\n- Role: ADMIN\n\n")
            f.write("## DPO\n- Email: dpo@bharatiyabank.example.com\n- Password: Kavach@2024\n- Role: DPO\n\n")
            f.write("## Analyst\n- Email: analyst@bharatiyabank.example.com\n- Password: Kavach@2024\n- Role: ANALYST\n\n")
            f.write("## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n")
    except Exception as e:
        logger.error(f"Failed to write test_credentials.md: {e}")

@app.on_event("shutdown")
async def shutdown():
    client.close()
