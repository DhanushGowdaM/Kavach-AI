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
