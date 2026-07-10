"""
SmartSeat AI — Firebase / Firestore Database Layer
"""
import os
import firebase_admin
from firebase_admin import credentials
from google.cloud.firestore import AsyncClient as FirestoreAsyncClient
from google.oauth2 import service_account

_db: FirestoreAsyncClient = None


def init_firebase() -> FirestoreAsyncClient:
    global _db
    if _db is not None:
        return _db

    cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase_credentials.json")

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    svc_creds = service_account.Credentials.from_service_account_file(
        cred_path,
        scopes=["https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/datastore"],
    )
    _db = FirestoreAsyncClient(project="smartseat-ai-9b63e", credentials=svc_creds)
    return _db


def get_mongodb():
    """Alias kept for backward compat — returns Firestore AsyncClient."""
    return init_firebase()


async def get_db():
    """FastAPI dependency — yields the Firestore client."""
    yield init_firebase()
