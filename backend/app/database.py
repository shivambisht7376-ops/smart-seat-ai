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

    # 1. Check Environment Variable
    if env_cred:
        # Fix double-escaped newlines that some platforms (Render) introduce
        env_cred = env_cred.replace("\\\\n", "\\n")
        cred_dict = json.loads(env_cred)
        # Also fix private_key newlines if they were double-escaped
        if "private_key" in cred_dict:
            cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
        project_id = cred_dict.get("project_id", "smartseat-ai-9b63e")
        print(f"[Firebase] Using env var credentials, project={project_id}")
        cred = credentials.Certificate(cred_dict)
        svc_creds = service_account.Credentials.from_service_account_info(
            cred_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform",
                    "https://www.googleapis.com/auth/datastore"],
        )
    else:
        # 2. Check Render Secret Files path
        render_secret_path = "/etc/secrets/firebase_credentials.json"
        # 3. Check Local Development path
        local_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase_credentials.json")

        if os.path.exists(render_secret_path):
            cred_path = render_secret_path
            print(f"[Firebase] Using Render secret file: {render_secret_path}")
        else:
            cred_path = local_path
            print(f"[Firebase] Using local credentials: {local_path}")

        with open(cred_path) as f:
            cred_dict = json.load(f)
        project_id = cred_dict.get("project_id", "smartseat-ai-9b63e")
        print(f"[Firebase] project={project_id}")

        cred = credentials.Certificate(cred_path)
        svc_creds = service_account.Credentials.from_service_account_file(
            cred_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform",
                    "https://www.googleapis.com/auth/datastore"],
        )

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    _db = FirestoreAsyncClient(project=project_id, credentials=svc_creds)
    print(f"[Firebase] Firestore client initialised for project={project_id}")
    return _db


def get_mongodb():
    """Alias kept for backward compat — returns Firestore AsyncClient."""
    return init_firebase()


async def get_db():
    """FastAPI dependency — yields the Firestore client."""
    yield init_firebase()
