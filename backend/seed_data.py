"""Seed data for Kavach - DPDPA Compliance Platform - Indian Banking Scenario"""
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt

def uid():
    return str(uuid.uuid4())

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def now():
    return datetime.now(timezone.utc)

def days_ago(d):
    return now() - timedelta(days=d)

def days_from_now(d):
    return now() + timedelta(days=d)

ORG_ID = uid()

def get_org():
    return {
        "id": ORG_ID,
        "name": "Bharatiya Sahkar Bank Ltd",
        "industry": "BANKING",
        "pan_number": "AABCB1234F",
        "registered_address": "45 MG Road, Fort, Mumbai 400001, Maharashtra, India",
        "dpo_name": "Meenakshi Rajan",
        "dpo_email": "dpo@bharatiyabank.example.com",
        "dpo_phone": "9876543210",
        "consent_manager_id": "CM-BSB-2024-001",
        "dpbi_registration_number": "DPBI-2024-BNK-00234",
        "created_at": days_ago(365).isoformat(),
        "updated_at": now().isoformat(),
    }

def get_users():
    pw = hash_pw("Kavach@2024")
    return [
        {"id": uid(), "org_id": ORG_ID, "email": "admin@bharatiyabank.example.com", "full_name": "System Administrator", "role": "ADMIN", "password_hash": pw, "is_active": True, "created_at": days_ago(365).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "email": "dpo@bharatiyabank.example.com", "full_name": "Meenakshi Rajan", "role": "DPO", "password_hash": pw, "is_active": True, "created_at": days_ago(365).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "email": "analyst@bharatiyabank.example.com", "full_name": "Arjun Patel", "role": "ANALYST", "password_hash": pw, "is_active": True, "created_at": days_ago(180).isoformat()},
    ]

# Data Source IDs
SRC_CBS = uid()
SRC_DWH = uid()
SRC_HRMS = uid()
SRC_S3 = uid()
SRC_LEGACY = uid()

def get_data_sources():
    return [
        {"id": SRC_CBS, "org_id": ORG_ID, "name": "Core Banking System (CBS)", "source_type": "ORACLE", "host": "cbs-oracle-prod.internal", "port": 1521, "database_name": "CBSDB", "username": "cbs_reader", "connection_status": "CONNECTED", "is_active": True, "last_connected_at": days_ago(1).isoformat(), "created_at": days_ago(300).isoformat()},
        {"id": SRC_DWH, "org_id": ORG_ID, "name": "Customer Data Warehouse", "source_type": "POSTGRESQL", "host": "dwh-postgres.internal", "port": 5432, "database_name": "customer_dwh", "username": "dwh_reader", "connection_status": "CONNECTED", "is_active": True, "last_connected_at": days_ago(1).isoformat(), "created_at": days_ago(280).isoformat()},
        {"id": SRC_HRMS, "org_id": ORG_ID, "name": "HR Management System", "source_type": "MSSQL", "host": "hrms-sql.internal", "port": 1433, "database_name": "HRMSDB", "username": "hrms_reader", "connection_status": "CONNECTED", "is_active": True, "last_connected_at": days_ago(2).isoformat(), "created_at": days_ago(250).isoformat()},
        {"id": SRC_S3, "org_id": ORG_ID, "name": "Document Storage", "source_type": "S3", "host": "bharatiya-bank-kyc-docs", "database_name": "ap-south-1", "connection_status": "CONNECTED", "is_active": True, "last_connected_at": days_ago(1).isoformat(), "created_at": days_ago(200).isoformat()},
        {"id": SRC_LEGACY, "org_id": ORG_ID, "name": "Legacy Loan System (1994)", "source_type": "MAINFRAME", "host": "mainframe-ibm.internal", "database_name": "LOANFILE", "connection_status": "CONNECTED", "is_active": True, "last_connected_at": days_ago(3).isoformat(), "created_at": days_ago(400).isoformat()},
    ]

# Asset IDs
ASSET_CUST = uid()
ASSET_ACCT = uid()
ASSET_TXN = uid()
ASSET_LOAN = uid()
ASSET_EMP = uid()
ASSET_LEAVE = uid()
ASSET_360 = uid()
ASSET_KYC = uid()
ASSET_LEGACY = uid()

def get_data_assets():
    return [
        {"id": ASSET_CUST, "org_id": ORG_ID, "source_id": SRC_CBS, "asset_type": "TABLE", "asset_name": "CBS.CUSTOMER_MASTER", "schema_name": "CBS", "row_count": 2847392, "size_bytes": 4832000000, "risk_tier": "CRITICAL", "encryption_status": "PARTIAL", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": True, "has_children_data": True, "access_level": "RESTRICTED", "retention_policy_days": None, "tags": ["core", "kyc", "customer"], "last_scanned_at": days_ago(1).isoformat(), "created_at": days_ago(300).isoformat(), "updated_at": days_ago(1).isoformat()},
        {"id": ASSET_ACCT, "org_id": ORG_ID, "source_id": SRC_CBS, "asset_type": "TABLE", "asset_name": "CBS.ACCOUNT_MASTER", "schema_name": "CBS", "row_count": 4123847, "size_bytes": 3200000000, "risk_tier": "CRITICAL", "encryption_status": "PARTIAL", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": True, "has_children_data": False, "access_level": "RESTRICTED", "retention_policy_days": 3650, "tags": ["accounts", "financial"], "last_scanned_at": days_ago(1).isoformat(), "created_at": days_ago(300).isoformat(), "updated_at": days_ago(1).isoformat()},
        {"id": ASSET_TXN, "org_id": ORG_ID, "source_id": SRC_CBS, "asset_type": "TABLE", "asset_name": "CBS.TRANSACTION_HISTORY", "schema_name": "CBS", "row_count": 187432891, "size_bytes": 89000000000, "risk_tier": "HIGH", "encryption_status": "UNENCRYPTED", "has_personal_data": True, "has_sensitive_data": False, "has_financial_data": True, "has_children_data": False, "access_level": "INTERNAL", "retention_policy_days": 2920, "tags": ["transactions", "financial"], "last_scanned_at": days_ago(1).isoformat(), "created_at": days_ago(300).isoformat(), "updated_at": days_ago(1).isoformat()},
        {"id": ASSET_LOAN, "org_id": ORG_ID, "source_id": SRC_CBS, "asset_type": "TABLE", "asset_name": "CBS.LOAN_ACCOUNTS", "schema_name": "CBS", "row_count": 432891, "size_bytes": 520000000, "risk_tier": "CRITICAL", "encryption_status": "PARTIAL", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": True, "has_children_data": False, "access_level": "CONFIDENTIAL", "retention_policy_days": 3650, "tags": ["loans", "financial", "cibil"], "last_scanned_at": days_ago(1).isoformat(), "created_at": days_ago(300).isoformat(), "updated_at": days_ago(1).isoformat()},
        {"id": ASSET_EMP, "org_id": ORG_ID, "source_id": SRC_HRMS, "asset_type": "TABLE", "asset_name": "HRMS.EMPLOYEE_MASTER", "schema_name": "HRMS", "row_count": 8432, "size_bytes": 12000000, "risk_tier": "CRITICAL", "encryption_status": "UNENCRYPTED", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": True, "has_children_data": False, "access_level": "CONFIDENTIAL", "retention_policy_days": 2555, "tags": ["hr", "employees", "sensitive"], "last_scanned_at": days_ago(2).isoformat(), "created_at": days_ago(250).isoformat(), "updated_at": days_ago(2).isoformat()},
        {"id": ASSET_LEAVE, "org_id": ORG_ID, "source_id": SRC_HRMS, "asset_type": "TABLE", "asset_name": "HRMS.LEAVE_MEDICAL_RECORDS", "schema_name": "HRMS", "row_count": 124832, "size_bytes": 45000000, "risk_tier": "CRITICAL", "encryption_status": "UNENCRYPTED", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": False, "has_children_data": False, "access_level": "CONFIDENTIAL", "retention_policy_days": None, "tags": ["hr", "medical", "health"], "last_scanned_at": days_ago(2).isoformat(), "created_at": days_ago(250).isoformat(), "updated_at": days_ago(2).isoformat()},
        {"id": ASSET_360, "org_id": ORG_ID, "source_id": SRC_DWH, "asset_type": "TABLE", "asset_name": "DWH.CUSTOMER_360_VIEW", "schema_name": "DWH", "row_count": 2847392, "size_bytes": 6800000000, "risk_tier": "CRITICAL", "encryption_status": "PARTIAL", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": True, "has_children_data": False, "access_level": "RESTRICTED", "retention_policy_days": None, "tags": ["analytics", "customer360"], "last_scanned_at": days_ago(1).isoformat(), "created_at": days_ago(200).isoformat(), "updated_at": days_ago(1).isoformat()},
        {"id": ASSET_KYC, "org_id": ORG_ID, "source_id": SRC_S3, "asset_type": "OBJECT_STORE", "asset_name": "S3.KYC_DOCUMENTS", "schema_name": None, "row_count": 8432891, "size_bytes": 230000000000, "risk_tier": "CRITICAL", "encryption_status": "ENCRYPTED", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": False, "has_children_data": True, "access_level": "CONFIDENTIAL", "retention_policy_days": None, "tags": ["kyc", "documents", "biometric"], "last_scanned_at": days_ago(1).isoformat(), "created_at": days_ago(200).isoformat(), "updated_at": days_ago(1).isoformat()},
        {"id": ASSET_LEGACY, "org_id": ORG_ID, "source_id": SRC_LEGACY, "asset_type": "FILE", "asset_name": "LEGACY.LOAN_FLAT_FILE", "schema_name": None, "row_count": 43291, "size_bytes": 5500000, "risk_tier": "CRITICAL", "encryption_status": "UNENCRYPTED", "has_personal_data": True, "has_sensitive_data": True, "has_financial_data": True, "has_children_data": False, "access_level": "RESTRICTED", "retention_policy_days": None, "tags": ["legacy", "cobol", "loans"], "last_scanned_at": days_ago(3).isoformat(), "created_at": days_ago(400).isoformat(), "updated_at": days_ago(3).isoformat()},
    ]

def get_column_classifications():
    cols = []
    # CBS.CUSTOMER_MASTER columns
    cm_cols = [
        ("CUST_ID", "VARCHAR(20)", "PERSONAL", "identifier", 88, "MEDIUM"),
        ("FULL_NAME", "VARCHAR(100)", "PERSONAL", "full_name", 99, "HIGH"),
        ("FATHER_NAME", "VARCHAR(100)", "PERSONAL", "relative_name", 94, "MEDIUM"),
        ("DATE_OF_BIRTH", "DATE", "PERSONAL", "date_of_birth", 98, "HIGH"),
        ("GENDER", "VARCHAR(10)", "PERSONAL", "gender", 96, "MEDIUM"),
        ("AADHAAR_NUM", "VARCHAR(12)", "SENSITIVE_PERSONAL", "aadhaar", 99, "CRITICAL"),
        ("PAN_NUMBER", "VARCHAR(10)", "SENSITIVE_PERSONAL", "pan_card", 99, "CRITICAL"),
        ("MOBILE_PRIMARY", "VARCHAR(15)", "PERSONAL", "phone_number", 99, "HIGH"),
        ("EMAIL_ID", "VARCHAR(200)", "PERSONAL", "email", 98, "HIGH"),
        ("ADDRESS_LINE1", "VARCHAR(200)", "PERSONAL", "address", 96, "HIGH"),
        ("CITY", "VARCHAR(100)", "PERSONAL", "city", 88, "MEDIUM"),
        ("STATE", "VARCHAR(50)", "PERSONAL", "state", 87, "MEDIUM"),
        ("PINCODE", "VARCHAR(6)", "PERSONAL", "postal_code", 85, "MEDIUM"),
        ("RELIGION", "VARCHAR(50)", "SENSITIVE_PERSONAL", "religion", 82, "CRITICAL"),
        ("CASTE_CATEGORY", "VARCHAR(20)", "SENSITIVE_PERSONAL", "caste", 91, "CRITICAL"),
        ("ANNUAL_INCOME", "DECIMAL(15,2)", "FINANCIAL", "income", 94, "CRITICAL"),
        ("KYC_STATUS", "VARCHAR(20)", "OPERATIONAL", "status", 89, "LOW"),
    ]
    for i, (name, dt, cat, sub, conf, risk) in enumerate(cm_cols):
        cols.append({"id": uid(), "asset_id": ASSET_CUST, "column_name": name, "data_type": dt, "position": i+1, "dpdpa_category": cat, "subcategory": sub, "confidence_score": conf, "risk_tier": risk, "is_pii": cat in ("PERSONAL","SENSITIVE_PERSONAL","FINANCIAL"), "classified_at": days_ago(1).isoformat(), "updated_at": days_ago(1).isoformat(), "dpdpa_section_ref": f"Section {'8(4)' if cat == 'SENSITIVE_PERSONAL' else '8' if cat == 'FINANCIAL' else '6'}"})

    # CBS.ACCOUNT_MASTER columns
    am_cols = [
        ("ACCOUNT_NO", "VARCHAR(20)", "FINANCIAL", "account_number", 99, "CRITICAL"),
        ("CUST_ID", "VARCHAR(20)", "PERSONAL", "identifier", 88, "MEDIUM"),
        ("ACCOUNT_TYPE", "VARCHAR(20)", "OPERATIONAL", "account_type", 92, "LOW"),
        ("IFSC_CODE", "VARCHAR(11)", "FINANCIAL", "ifsc_code", 99, "HIGH"),
        ("BALANCE", "DECIMAL(15,2)", "FINANCIAL", "account_balance", 97, "CRITICAL"),
        ("NOMINEE_NAME", "VARCHAR(100)", "PERSONAL", "nominee_name", 93, "HIGH"),
        ("DEBIT_CARD_NO", "VARCHAR(16)", "FINANCIAL", "card_number", 99, "CRITICAL"),
        ("INTERNET_PWD", "VARCHAR(64)", "SENSITIVE_PERSONAL", "password", 94, "CRITICAL"),
    ]
    for i, (name, dt, cat, sub, conf, risk) in enumerate(am_cols):
        cols.append({"id": uid(), "asset_id": ASSET_ACCT, "column_name": name, "data_type": dt, "position": i+1, "dpdpa_category": cat, "subcategory": sub, "confidence_score": conf, "risk_tier": risk, "is_pii": cat in ("PERSONAL","SENSITIVE_PERSONAL","FINANCIAL"), "classified_at": days_ago(1).isoformat(), "updated_at": days_ago(1).isoformat(), "dpdpa_section_ref": f"Section {'8(4)' if cat == 'SENSITIVE_PERSONAL' else '8'}"})

    # CBS.TRANSACTION_HISTORY
    txn_cols = [
        ("TXN_ID", "VARCHAR(30)", "OPERATIONAL", "identifier", 92, "LOW"),
        ("ACCOUNT_NO", "VARCHAR(20)", "FINANCIAL", "account_number", 99, "HIGH"),
        ("AMOUNT", "DECIMAL(15,2)", "FINANCIAL", "transaction_amount", 97, "HIGH"),
        ("UPI_VPA", "VARCHAR(100)", "FINANCIAL", "upi_id", 97, "HIGH"),
        ("IP_ADDRESS", "VARCHAR(45)", "PERSONAL", "ip_address", 94, "MEDIUM"),
        ("DEVICE_ID", "VARCHAR(100)", "PERSONAL", "device_identifier", 86, "MEDIUM"),
    ]
    for i, (name, dt, cat, sub, conf, risk) in enumerate(txn_cols):
        cols.append({"id": uid(), "asset_id": ASSET_TXN, "column_name": name, "data_type": dt, "position": i+1, "dpdpa_category": cat, "subcategory": sub, "confidence_score": conf, "risk_tier": risk, "is_pii": cat != "OPERATIONAL", "classified_at": days_ago(1).isoformat(), "updated_at": days_ago(1).isoformat(), "dpdpa_section_ref": "Section 8"})

    # HRMS.EMPLOYEE_MASTER
    emp_cols = [
        ("EMP_ID", "VARCHAR(10)", "PERSONAL", "identifier", 91, "MEDIUM"),
        ("FULL_NAME", "VARCHAR(100)", "PERSONAL", "full_name", 99, "HIGH"),
        ("SALARY", "DECIMAL(12,2)", "FINANCIAL", "salary", 97, "CRITICAL"),
        ("AADHAAR_NUM", "VARCHAR(12)", "SENSITIVE_PERSONAL", "aadhaar", 99, "CRITICAL"),
        ("PAN_NUMBER", "VARCHAR(10)", "SENSITIVE_PERSONAL", "pan_card", 99, "CRITICAL"),
        ("BLOOD_GROUP", "VARCHAR(5)", "SENSITIVE_PERSONAL", "health", 87, "CRITICAL"),
        ("RELIGION", "VARCHAR(50)", "SENSITIVE_PERSONAL", "religion", 83, "CRITICAL"),
    ]
    for i, (name, dt, cat, sub, conf, risk) in enumerate(emp_cols):
        cols.append({"id": uid(), "asset_id": ASSET_EMP, "column_name": name, "data_type": dt, "position": i+1, "dpdpa_category": cat, "subcategory": sub, "confidence_score": conf, "risk_tier": risk, "is_pii": True, "classified_at": days_ago(2).isoformat(), "updated_at": days_ago(2).isoformat(), "dpdpa_section_ref": f"Section {'8(4)' if cat == 'SENSITIVE_PERSONAL' else '8'}"})

    return cols

def get_risk_flags():
    return [
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_CUST, "flag_type": "AADHAAR_STORED_IN_PLAIN_TEXT", "description": "Aadhaar numbers stored without encryption in CUSTOMER_MASTER.AADHAAR_NUM column. 2.8M records exposed.", "dpdpa_section": "Section 8(4) — Security safeguards", "severity": "CRITICAL", "remediation_advice": "Implement AES-256 encryption for Aadhaar field immediately. Use masked display (XXXX-XXXX-1234) in UI.", "created_at": days_ago(30).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_TXN, "flag_type": "FINANCIAL_DATA_OVER_RETAINED", "description": "Transaction history older than 8 years found. 12.3M records exceed retention limit per RBI guidelines.", "dpdpa_section": "Section 8(7) — Data retention", "severity": "HIGH", "remediation_advice": "Transaction history older than 8 years should be anonymised or deleted per RBI guidelines and DPDPA purpose limitation.", "created_at": days_ago(25).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_LEAVE, "flag_type": "UNENCRYPTED_SENSITIVE_DATA", "description": "Medical diagnosis codes stored in plain text in LEAVE_MEDICAL_RECORDS.DIAGNOSIS_CODE. 124K health records exposed.", "dpdpa_section": "Section 8(4) — Health data security", "severity": "CRITICAL", "remediation_advice": "Medical diagnosis codes are sensitive personal data requiring encryption at rest and strict access controls.", "created_at": days_ago(20).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_CUST, "flag_type": "CHILDREN_DATA_UNPROTECTED", "description": "12,847 accounts identified as minors (DOB < 18 years). Parental consent not verified.", "dpdpa_section": "Section 9 — Children's data", "severity": "CRITICAL", "remediation_advice": "Parental consent must be verified via DigiLocker age verification for all minor accounts.", "created_at": days_ago(18).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_KYC, "flag_type": "RETENTION_POLICY_MISSING", "description": "8.4M KYC documents have no defined retention policy. Documents accumulating since 2010.", "dpdpa_section": "Section 8(7) — Purpose limitation", "severity": "HIGH", "remediation_advice": "Define retention period and implement automated deletion workflow for KYC documents.", "created_at": days_ago(15).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_360, "flag_type": "CROSS_BORDER_TRANSFER_UNLOGGED", "description": "THIRD_PARTY_SHARED flag indicates data sharing but destination countries not logged.", "dpdpa_section": "Section 16 — Cross-border transfers", "severity": "HIGH", "remediation_advice": "All cross-border transfers must be catalogued with destination countries and legal basis.", "created_at": days_ago(12).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_360, "flag_type": "UNCONTRACTED_THIRD_PARTY_SHARING", "description": "Data shared with third parties without verified Data Processing Agreements on file.", "dpdpa_section": "Section 8(2) — Processor obligations", "severity": "CRITICAL", "remediation_advice": "Establish Data Processing Agreements with all third parties before sharing personal data.", "created_at": days_ago(10).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_CUST, "flag_type": "NO_CONSENT_RECORD_FOUND", "description": "847,291 customer records predate digital consent collection. No consent audit trail exists.", "dpdpa_section": "Section 6 — Consent requirements", "severity": "HIGH", "remediation_advice": "Fresh consent must be obtained or legitimate interest documented for pre-DPDPA customers.", "created_at": days_ago(8).isoformat()},
    ]

def get_consent_purposes():
    return [
        {"id": uid(), "org_id": ORG_ID, "purpose_name": "Account Operations", "purpose_description": "Processing personal data for maintaining and operating bank accounts, transactions, and core banking services.", "legal_basis": "CONTRACT", "data_categories_used": ["PERSONAL", "FINANCIAL"], "retention_days": 3650, "is_active": True, "created_at": days_ago(365).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "purpose_name": "Marketing Communications", "purpose_description": "Sending promotional offers, product updates, and marketing communications via SMS, email, and push notifications.", "legal_basis": "CONSENT", "data_categories_used": ["PERSONAL"], "retention_days": 365, "is_active": True, "created_at": days_ago(365).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "purpose_name": "Credit Assessment", "purpose_description": "Evaluating creditworthiness using financial history, CIBIL scores, and income verification for loan processing.", "legal_basis": "LEGITIMATE_INTEREST", "data_categories_used": ["PERSONAL", "FINANCIAL", "SENSITIVE_PERSONAL"], "retention_days": 2555, "is_active": True, "created_at": days_ago(300).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "purpose_name": "KYC Verification", "purpose_description": "Know Your Customer verification as mandated by RBI and PMLA including Aadhaar, PAN, and address verification.", "legal_basis": "LEGAL_OBLIGATION", "data_categories_used": ["PERSONAL", "SENSITIVE_PERSONAL"], "retention_days": 3650, "is_active": True, "created_at": days_ago(365).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "purpose_name": "Analytics & Profiling", "purpose_description": "Customer behaviour analytics, segmentation, and profiling for service improvement and risk assessment.", "legal_basis": "CONSENT", "data_categories_used": ["PERSONAL", "FINANCIAL"], "retention_days": 730, "is_active": True, "created_at": days_ago(200).isoformat()},
    ]

def get_consent_stats():
    return {
        "total": 2847392,
        "active": 1943201,
        "withdrawn": 284739,
        "expired": 423891,
        "pending": 195561,
    }

def get_rights_requests():
    return [
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Rajesh Kumar Sharma", "principal_email": "rajesh.sharma@example.com", "request_type": "ERASURE", "status": "IN_PROGRESS", "description": "Customer requesting deletion of all marketing data and communication preferences.", "due_date": days_from_now(15).isoformat(), "sla_breached": False, "created_at": days_ago(75).isoformat(), "updated_at": days_ago(2).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Sunita Devi", "principal_email": "sunita.devi@example.com", "request_type": "ACCESS", "status": "COMPLETED", "description": "Customer requested copy of all personal data held across all systems.", "due_date": days_ago(10).isoformat(), "completed_at": days_ago(3).isoformat(), "sla_breached": False, "created_at": days_ago(30).isoformat(), "updated_at": days_ago(3).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Mohammed Imran Khan", "principal_email": "imran.khan@example.com", "request_type": "CORRECTION", "status": "SUBMITTED", "description": "Wrong date of birth in records, requesting correction with supporting documents.", "due_date": days_from_now(25).isoformat(), "sla_breached": False, "created_at": days_ago(5).isoformat(), "updated_at": days_ago(5).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Lakshmi Narasimhan", "principal_email": "lakshmi.n@example.com", "request_type": "GRIEVANCE", "status": "ESCALATED", "description": "Consent withdrawal not processed after 30 days. Multiple follow-ups ignored.", "due_date": days_ago(5).isoformat(), "sla_breached": True, "created_at": days_ago(35).isoformat(), "updated_at": days_ago(1).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Priya Mehta", "principal_email": "priya.mehta@example.com", "request_type": "PORTABILITY", "status": "IN_PROGRESS", "description": "Customer switching to another bank, requesting data portability of all financial records.", "due_date": days_from_now(20).isoformat(), "sla_breached": False, "created_at": days_ago(10).isoformat(), "updated_at": days_ago(2).isoformat()},
    ]

def get_breach_events():
    return [
        {"id": uid(), "org_id": ORG_ID, "title": "Customer Data Exposure via Unsecured API Endpoint", "description": "An unsecured API endpoint on the mobile banking app exposed customer personal and financial data. The endpoint lacked authentication and was discovered by a security researcher.", "breach_type": "UNAUTHORIZED_ACCESS", "severity": "CRITICAL", "status": "NOTIFIED", "affected_principals_count": 12432, "data_categories_affected": ["PERSONAL", "FINANCIAL"], "detected_at": days_ago(45).isoformat(), "contained_at": days_ago(44).isoformat(), "dpbi_notification_deadline": days_ago(42).isoformat(), "dpbi_notified_at": days_ago(43).isoformat(), "dpbi_reference_number": "DPBI-2024-INC-0892", "principal_notification_required": True, "principal_notified_at": days_ago(40).isoformat(), "created_at": days_ago(45).isoformat(), "updated_at": days_ago(5).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "title": "Ransomware Attack on HR Server", "description": "Ransomware infection detected on HRMS server. Encryption of files began but was contained before any data exfiltration. Backup restoration completed within 4 hours.", "breach_type": "RANSOMWARE", "severity": "HIGH", "status": "CONTAINED", "affected_principals_count": 0, "data_categories_affected": ["SENSITIVE_PERSONAL"], "detected_at": days_ago(12).isoformat(), "contained_at": days_ago(12).isoformat(), "dpbi_notification_deadline": days_ago(9).isoformat(), "dpbi_notified_at": days_ago(10).isoformat(), "dpbi_reference_number": "DPBI-2024-INC-0915", "principal_notification_required": False, "created_at": days_ago(12).isoformat(), "updated_at": days_ago(5).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "title": "Suspicious Bulk Data Export Detected", "description": "Anomalous bulk export of customer records detected from data warehouse. Investigation ongoing to determine if unauthorized access occurred.", "breach_type": "DATA_LEAK", "severity": "HIGH", "status": "INVESTIGATING", "affected_principals_count": 0, "data_categories_affected": ["PERSONAL", "FINANCIAL"], "detected_at": days_ago(2).isoformat(), "dpbi_notification_deadline": days_from_now(1).isoformat(), "principal_notification_required": False, "created_at": days_ago(2).isoformat(), "updated_at": days_ago(0).isoformat()},
    ]

def get_anomaly_detections():
    return [
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_360, "anomaly_type": "BULK_EXPORT", "description": "Unusual bulk data export: 45,000 customer records exported in single query at 2:30 AM IST", "severity": "HIGH", "detected_at": days_ago(2).isoformat(), "is_false_positive": False, "escalated_to_breach": True},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_CUST, "anomaly_type": "ACCESS_PATTERN", "description": "Service account accessing customer PAN numbers outside business hours (3:15 AM IST)", "severity": "MEDIUM", "detected_at": days_ago(5).isoformat(), "is_false_positive": False, "escalated_to_breach": False},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_EMP, "anomaly_type": "PRIVILEGE_ESCALATION", "description": "Junior analyst account attempted to access employee salary data without authorization", "severity": "HIGH", "detected_at": days_ago(7).isoformat(), "is_false_positive": False, "escalated_to_breach": False},
        {"id": uid(), "org_id": ORG_ID, "asset_id": ASSET_TXN, "anomaly_type": "QUERY_PATTERN", "description": "SELECT * queries on transaction history from unrecognized IP range 103.x.x.x", "severity": "CRITICAL", "detected_at": days_ago(1).isoformat(), "is_false_positive": False, "escalated_to_breach": False},
    ]

def get_vendors():
    return [
        {"id": uid(), "org_id": ORG_ID, "vendor_name": "Finacle (Infosys)", "vendor_type": "TECHNOLOGY", "country": "India", "is_cross_border": False, "contact_name": "Vikram Singh", "contact_email": "vikram.s@infosys.example.com", "risk_score": 15.0, "risk_tier": "LOW", "contract_status": "ACTIVE", "contract_type": "DPA", "contract_end_date": days_from_now(365).isoformat(), "is_active": True, "created_at": days_ago(365).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "vendor_name": "AWS India", "vendor_type": "CLOUD", "country": "India", "is_cross_border": False, "contact_name": "Neha Kapoor", "contact_email": "neha.k@aws.example.com", "risk_score": 20.0, "risk_tier": "LOW", "contract_status": "ACTIVE", "contract_type": "DPA", "contract_end_date": days_from_now(730).isoformat(), "is_active": True, "created_at": days_ago(365).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "vendor_name": "TransUnion CIBIL", "vendor_type": "ANALYTICS", "country": "India", "is_cross_border": False, "contact_name": "Ramesh Iyer", "contact_email": "ramesh.i@cibil.example.com", "risk_score": 45.0, "risk_tier": "MEDIUM", "contract_status": "ACTIVE", "contract_type": "DPA", "contract_end_date": days_from_now(200).isoformat(), "data_shared": ["CIBIL scores", "Loan data"], "is_active": True, "created_at": days_ago(300).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "vendor_name": "Google Analytics", "vendor_type": "MARKETING", "country": "USA", "is_cross_border": True, "contact_name": "Support Team", "contact_email": "support@google.example.com", "risk_score": 72.0, "risk_tier": "HIGH", "contract_status": "ACTIVE", "contract_type": "STANDARD_CLAUSES", "contract_end_date": days_from_now(180).isoformat(), "data_shared": ["Customer behaviour data", "Session data"], "is_active": True, "created_at": days_ago(200).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "vendor_name": "Legacy SMS Vendor", "vendor_type": "COMMUNICATION", "country": "India", "is_cross_border": False, "contact_name": "Ajay Gupta", "contact_email": "ajay@legacysms.example.com", "risk_score": 92.0, "risk_tier": "CRITICAL", "contract_status": "EXPIRED", "contract_type": "DPA", "contract_end_date": days_ago(180).isoformat(), "data_shared": ["Customer phone numbers", "OTPs"], "is_active": True, "created_at": days_ago(730).isoformat()},
    ]

def get_compliance_scores():
    return {
        "id": uid(),
        "org_id": ORG_ID,
        "overall_score": 61.0,
        "data_discovery_score": 78.0,
        "consent_score": 55.0,
        "rights_score": 70.0,
        "breach_readiness_score": 72.0,
        "vendor_score": 44.0,
        "children_protection_score": 38.0,
        "recommendations": [
            {"priority": "CRITICAL", "text": "Encrypt all Aadhaar numbers stored in plain text across CBS systems", "module": "Data Discovery"},
            {"priority": "CRITICAL", "text": "Establish DPA with Legacy SMS Vendor or terminate data sharing immediately", "module": "Vendor Trust"},
            {"priority": "HIGH", "text": "Implement parental consent verification for 12,847 minor accounts", "module": "Children Protection"},
            {"priority": "HIGH", "text": "Collect fresh consent from 847,291 pre-DPDPA customers", "module": "Consent Management"},
            {"priority": "HIGH", "text": "Define retention policies for KYC documents and medical records", "module": "Data Discovery"},
            {"priority": "MEDIUM", "text": "Log all cross-border data transfers with destination countries", "module": "Vendor Trust"},
        ],
        "score_history": [
            {"month": "Sep 2024", "score": 42},
            {"month": "Oct 2024", "score": 48},
            {"month": "Nov 2024", "score": 53},
            {"month": "Dec 2024", "score": 55},
            {"month": "Jan 2025", "score": 58},
            {"month": "Feb 2025", "score": 61},
        ],
        "calculated_at": now().isoformat(),
    }

def get_scan_jobs():
    return [
        {"id": uid(), "org_id": ORG_ID, "source_id": SRC_CBS, "job_type": "FULL", "status": "COMPLETED", "progress_percent": 100, "assets_scanned": 4, "columns_classified": 31, "risk_flags_created": 4, "started_at": days_ago(1).isoformat(), "completed_at": days_ago(1).isoformat(), "created_at": days_ago(1).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "source_id": SRC_HRMS, "job_type": "FULL", "status": "COMPLETED", "progress_percent": 100, "assets_scanned": 2, "columns_classified": 16, "risk_flags_created": 1, "started_at": days_ago(2).isoformat(), "completed_at": days_ago(2).isoformat(), "created_at": days_ago(2).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "source_id": SRC_DWH, "job_type": "DELTA", "status": "COMPLETED", "progress_percent": 100, "assets_scanned": 1, "columns_classified": 10, "risk_flags_created": 2, "started_at": days_ago(1).isoformat(), "completed_at": days_ago(1).isoformat(), "created_at": days_ago(1).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "source_id": SRC_S3, "job_type": "FULL", "status": "COMPLETED", "progress_percent": 100, "assets_scanned": 1, "columns_classified": 6, "risk_flags_created": 1, "started_at": days_ago(1).isoformat(), "completed_at": days_ago(1).isoformat(), "created_at": days_ago(1).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "source_id": SRC_LEGACY, "job_type": "SINGLE_ASSET", "status": "COMPLETED", "progress_percent": 100, "assets_scanned": 1, "columns_classified": 9, "risk_flags_created": 0, "started_at": days_ago(3).isoformat(), "completed_at": days_ago(3).isoformat(), "created_at": days_ago(3).isoformat()},
    ]


def get_child_records():
    return [
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Aarav Sharma", "principal_id": "CUST-MIN-001", "date_of_birth": "2012-03-15", "age": 13, "guardian_name": "Rajesh Kumar Sharma", "guardian_phone": "9876543201", "guardian_email": "rajesh.sharma@example.com", "account_type": "MINOR_SAVINGS", "account_number": "BSB-MIN-00001", "data_sources": ["CBS.CUSTOMER_MASTER", "CBS.ACCOUNT_MASTER"], "consent_status": "VERIFIED", "verification_status": "VERIFIED", "verification_method": "DIGILOCKER", "data_blocked": False, "created_at": days_ago(200).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Diya Patel", "principal_id": "CUST-MIN-002", "date_of_birth": "2010-07-22", "age": 15, "guardian_name": "Anita Patel", "guardian_phone": "9876543202", "guardian_email": "anita.patel@example.com", "account_type": "MINOR_SAVINGS", "account_number": "BSB-MIN-00002", "data_sources": ["CBS.CUSTOMER_MASTER", "CBS.ACCOUNT_MASTER", "S3.KYC_DOCUMENTS"], "consent_status": "PENDING", "verification_status": "PENDING", "verification_method": None, "data_blocked": True, "created_at": days_ago(180).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Vivaan Reddy", "principal_id": "CUST-MIN-003", "date_of_birth": "2014-11-08", "age": 11, "guardian_name": "Suresh Reddy", "guardian_phone": "9876543203", "guardian_email": "suresh.reddy@example.com", "account_type": "MINOR_SAVINGS", "account_number": "BSB-MIN-00003", "data_sources": ["CBS.CUSTOMER_MASTER"], "consent_status": "PENDING", "verification_status": "FAILED", "verification_method": "AADHAAR_OTP", "data_blocked": True, "created_at": days_ago(150).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Ananya Singh", "principal_id": "CUST-MIN-004", "date_of_birth": "2009-01-30", "age": 17, "guardian_name": "Vikram Singh", "guardian_phone": "9876543204", "guardian_email": "vikram.singh@example.com", "account_type": "MINOR_SAVINGS", "account_number": "BSB-MIN-00004", "data_sources": ["CBS.CUSTOMER_MASTER", "CBS.ACCOUNT_MASTER"], "consent_status": "VERIFIED", "verification_status": "VERIFIED", "verification_method": "DIGILOCKER", "data_blocked": False, "created_at": days_ago(300).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Kabir Joshi", "principal_id": "CUST-MIN-005", "date_of_birth": "2015-06-12", "age": 10, "guardian_name": "Meera Joshi", "guardian_phone": "9876543205", "guardian_email": "meera.joshi@example.com", "account_type": "MINOR_SAVINGS", "account_number": "BSB-MIN-00005", "data_sources": ["CBS.CUSTOMER_MASTER"], "consent_status": "PENDING", "verification_status": "PENDING", "verification_method": None, "data_blocked": True, "created_at": days_ago(90).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Ishaan Gupta", "principal_id": "CUST-MIN-006", "date_of_birth": "2011-09-25", "age": 14, "guardian_name": "Priya Gupta", "guardian_phone": "9876543206", "guardian_email": "priya.gupta@example.com", "account_type": "MINOR_SAVINGS", "account_number": "BSB-MIN-00006", "data_sources": ["CBS.CUSTOMER_MASTER", "S3.KYC_DOCUMENTS"], "consent_status": "EXPIRED", "verification_status": "EXPIRED", "verification_method": "DIGILOCKER", "data_blocked": True, "created_at": days_ago(400).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "principal_name": "Saanvi Nair", "principal_id": "CUST-MIN-007", "date_of_birth": "2013-04-18", "age": 12, "guardian_name": "Ramesh Nair", "guardian_phone": "9876543207", "guardian_email": "ramesh.nair@example.com", "account_type": "MINOR_FD", "account_number": "BSB-MIN-00007", "data_sources": ["CBS.CUSTOMER_MASTER", "CBS.ACCOUNT_MASTER"], "consent_status": "VERIFIED", "verification_status": "VERIFIED", "verification_method": "MANUAL", "data_blocked": False, "created_at": days_ago(250).isoformat()},
    ]


def get_child_verifications():
    return [
        {"id": uid(), "org_id": ORG_ID, "child_name": "Aarav Sharma", "guardian_name": "Rajesh Kumar Sharma", "verification_method": "DIGILOCKER", "status": "VERIFIED", "initiated_at": days_ago(190).isoformat(), "completed_at": days_ago(189).isoformat(), "guardian_age_confirmed": True, "child_age_confirmed": True},
        {"id": uid(), "org_id": ORG_ID, "child_name": "Vivaan Reddy", "guardian_name": "Suresh Reddy", "verification_method": "AADHAAR_OTP", "status": "FAILED", "initiated_at": days_ago(145).isoformat(), "completed_at": days_ago(145).isoformat(), "failure_reason": "OTP verification timed out. Guardian did not complete verification within 10 minutes."},
        {"id": uid(), "org_id": ORG_ID, "child_name": "Ananya Singh", "guardian_name": "Vikram Singh", "verification_method": "DIGILOCKER", "status": "VERIFIED", "initiated_at": days_ago(295).isoformat(), "completed_at": days_ago(294).isoformat(), "guardian_age_confirmed": True, "child_age_confirmed": True},
        {"id": uid(), "org_id": ORG_ID, "child_name": "Saanvi Nair", "guardian_name": "Ramesh Nair", "verification_method": "MANUAL", "status": "VERIFIED", "initiated_at": days_ago(245).isoformat(), "completed_at": days_ago(240).isoformat(), "guardian_age_confirmed": True, "child_age_confirmed": True},
    ]


def get_audit_reports():
    return [
        {"id": uid(), "org_id": ORG_ID, "report_type": "MONTHLY", "title": "Monthly DPDPA Compliance Report - January 2025", "status": "READY", "generated_at": days_ago(35).isoformat(), "ai_summary": "Overall compliance score improved from 58 to 61. Key improvements in data discovery (+3) and breach readiness (+2). Critical actions: 3 unresolved Aadhaar encryption flags, 1 vendor with expired DPA. Consent management remains the weakest area at 55/100.", "report_data": {"period": "Jan 2025", "score": 61, "flags_resolved": 3, "flags_created": 2, "rights_completed": 8, "breaches": 0}, "created_at": days_ago(35).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "report_type": "QUARTERLY", "title": "Q4 2024 DPDPA Compliance Assessment", "status": "READY", "generated_at": days_ago(65).isoformat(), "ai_summary": "Quarterly assessment shows steady improvement trajectory. Score increased from 48 to 58. Significant progress in data discovery with 9 assets scanned and 38 columns classified. Vendor management remains critical concern with Legacy SMS Vendor operating on expired DPA for 3+ months.", "report_data": {"period": "Q4 2024", "score": 58, "flags_resolved": 7, "flags_created": 8, "rights_completed": 15, "breaches": 1}, "created_at": days_ago(65).isoformat()},
        {"id": uid(), "org_id": ORG_ID, "report_type": "INCIDENT", "title": "Incident Report - Customer Data Exposure", "status": "READY", "generated_at": days_ago(40).isoformat(), "ai_summary": "Critical breach involving unauthorized API access exposed 12,432 customer records. Breach detected and contained within 24 hours. DPBI notified within 72-hour window. Root cause: Missing authentication on mobile banking API endpoint. Corrective measures implemented including API gateway security audit and mandatory auth middleware.", "report_data": {"incident_ref": "DPBI-2024-INC-0892", "affected": 12432, "categories": ["PERSONAL", "FINANCIAL"], "contained_in_hours": 24}, "created_at": days_ago(40).isoformat()},
    ]


async def seed_database(db):
    """Seed the database with initial data if not already seeded."""
    existing_org = await db.organisations.find_one({"name": "Bharatiya Sahkar Bank Ltd"})
    if existing_org:
        return False  # Already seeded

    # Insert all data
    await db.organisations.insert_one(get_org())
    await db.users.insert_many(get_users())
    await db.data_sources.insert_many(get_data_sources())
    await db.data_assets.insert_many(get_data_assets())
    await db.column_classifications.insert_many(get_column_classifications())
    await db.risk_flags.insert_many(get_risk_flags())
    await db.consent_purposes.insert_many(get_consent_purposes())
    await db.consent_stats.insert_one({"org_id": ORG_ID, **get_consent_stats()})
    await db.rights_requests.insert_many(get_rights_requests())
    await db.breach_events.insert_many(get_breach_events())
    await db.anomaly_detections.insert_many(get_anomaly_detections())
    await db.vendors.insert_many(get_vendors())
    await db.compliance_scores.insert_one(get_compliance_scores())
    await db.scan_jobs.insert_many(get_scan_jobs())
    await db.child_records.insert_many(get_child_records())
    await db.child_verifications.insert_many(get_child_verifications())
    await db.audit_reports.insert_many(get_audit_reports())

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.data_sources.create_index("org_id")
    await db.data_assets.create_index("org_id")
    await db.data_assets.create_index("source_id")
    await db.column_classifications.create_index("asset_id")
    await db.risk_flags.create_index("org_id")
    await db.breach_events.create_index("org_id")
    await db.vendors.create_index("org_id")

    return True
