"""
SmartSeat AI — Firebase / Firestore Database Layer
"""
import os
import firebase_admin
from firebase_admin import credentials
from google.cloud.firestore import AsyncClient as FirestoreAsyncClient
from google.oauth2 import service_account

_db: FirestoreAsyncClient = None


import json

def init_firebase() -> FirestoreAsyncClient:
    global _db
    if _db is not None:
        return _db

    env_cred = os.environ.get("FIREBASE_CRED_JSON")
    if env_cred:
        # Load credentials from environment variable for production (e.g. Render/Railway)
        cred_dict = json.loads(env_cred)
        cred = credentials.Certificate(cred_dict)
        svc_creds = service_account.Credentials.from_service_account_info(
            cred_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform",
                    "https://www.googleapis.com/auth/datastore"],
        )
    else:
        # Load from file for local development
        cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase_credentials.json")
        cred = credentials.Certificate(cred_path)
        svc_creds = service_account.Credentials.from_service_account_file(
            cred_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform",
                    "https://www.googleapis.com/auth/datastore"],
        )

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    _db = FirestoreAsyncClient(project="smartseat-ai-9b63e", credentials=svc_creds)
    return _db


def get_mongodb():
    """Alias kept for backward compat — returns Firestore AsyncClient."""
    return init_firebase()


async def get_db():
    """FastAPI dependency — yields the Firestore client."""
    yield init_firebase()
