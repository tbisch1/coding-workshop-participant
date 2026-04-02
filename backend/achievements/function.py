import json
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
from typing import Optional
import os


# ─── Models ───────────────────────────────────────────────────────────────────

class Team:
    def __init__(self, name: str, team_lead_id: str, organization: str):
        self.name = name
        self.team_lead_id = team_lead_id
        self.organization = organization


class Achievement:
    def __init__(self, description: str, date: str, team_id: str):
        self.description = description
        self.date = date
        self.team_id = team_id


# ─── Database Connection ──────────────────────────────────────────────────────

def connect_to_db(collection_name: str) -> Collection:
    # Connect to MongoDB/DocumentDB and return the specified collection
    host = os.environ.get("MONGO_HOST", "172.17.0.1")
    port = int(os.environ.get("MONGO_PORT", "27017"))
    db_name = "TeamManagement"
    user = os.environ.get("MONGO_USER", "").strip()
    password = os.environ.get("MONGO_PASS", "").strip()
    is_local = os.environ.get("IS_LOCAL", "false").lower() == "true"

    if user and password:
        uri = f"mongodb://{user}:{password}@{host}:{port}/{db_name}"
    else:
        uri = f"mongodb://{host}:{port}/{db_name}"

    try:
        # Create client with connection timeout
        client = MongoClient(uri, tls=not is_local, serverSelectionTimeoutMS=5000, connectTimeoutMS=10000)
        # Verify the connection works
        client.admin.command('ping')
        print(f"Connected to MongoDB at {host}:{port}/{db_name}")
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        raise
    
    db = client[db_name]
    collection: Collection = db[collection_name]

    return collection


# ─── Achievement Service ──────────────────────────────────────────────────────

class AchievementDatabase:
    def __init__(self):
        print("Connecting to MongoDB for Achievements...")
        self._collection: Collection = connect_to_db("Achievements")

    def _serialize(self, achievement: Achievement) -> dict:
        return {
            "description": achievement.description,
            "date": achievement.date,
            "team_id": achievement.team_id,
        }

    def _deserialize(self, doc: dict) -> Achievement:
        achievement = Achievement(
            description=doc["description"],
            date=doc["date"],
            team_id=doc["team_id"],
        )
        achievement.id = str(doc["_id"])
        return achievement

    ### CRUD operations

    def create(self, achievement: Achievement) -> str:
        doc = self._serialize(achievement)
        result = self._collection.insert_one(doc)
        return str(result.inserted_id)

    def get_by_id(self, achievement_id: str) -> Optional[Achievement]:
        doc = self._collection.find_one({"_id": ObjectId(achievement_id)})
        if doc is None:
            return None
        return self._deserialize(doc)

    def get_all(self) -> list[Achievement]:
        docs = self._collection.find()
        return [self._deserialize(doc) for doc in docs]

    def update(self, achievement_id: str, achievement: Achievement) -> bool:
        # Returns True if the achievement was found and updated
        doc = self._serialize(achievement)
        result = self._collection.update_one(
            {"_id": ObjectId(achievement_id)},
            {"$set": doc},
        )
        return result.matched_count > 0

    def delete(self, achievement_id: str) -> bool:
        # Returns True if the achievement was found and deleted
        result = self._collection.delete_one({"_id": ObjectId(achievement_id)})
        return result.deleted_count > 0


class AchievementService:
    def __init__(self):
        self._db = AchievementDatabase()

    def create(self, achievement: Achievement) -> str:
        return self._db.create(achievement)

    def get_by_id(self, achievement_id: str) -> Optional[Achievement]:
        return self._db.get_by_id(achievement_id)

    def get_all(self) -> list[Achievement]:
        return self._db.get_all()

    def update(self, achievement_id: str, achievement: Achievement) -> bool:
        return self._db.update(achievement_id, achievement)

    def delete(self, achievement_id: str) -> bool:
        return self._db.delete(achievement_id)


# ─── Lambda Handler ───────────────────────────────────────────────────────────

def handler(event: dict = None, context: object = None) -> dict:
    """
    AWS Lambda handler for achievements API (Lambda Function URL format).
    Supports GET (all/by-id), POST (create), PUT (update), DELETE operations.
    """
    try:
        service = AchievementService()
        
        # Parse Lambda Function URL event format
        http_method = event.get("requestContext", {}).get("http", {}).get("method", "GET") if event else "GET"
        raw_path = event.get("rawPath", "") if event else ""
        body = event.get("body", "") if event else ""
        
        # Parse path: /achievements or /achievements/{id}
        path_parts = [p for p in raw_path.split('/') if p]
        resource = path_parts[0] if path_parts else ""
        achievement_id = path_parts[1] if len(path_parts) > 1 else None
        
        # Validate it's the achievements endpoint
        if resource != "achievements":
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Endpoint not found"}),
            }
        
        # GET /achievements - Get all achievements
        if http_method == "GET" and not achievement_id:
            achievements = service.get_all()
            body = [
                {
                    "id": achievement.id,
                    "description": achievement.description,
                    "date": achievement.date,
                    "team_id": achievement.team_id,
                }
                for achievement in achievements
            ]
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(body),
            }
        
        # GET /achievements/{id} - Get single achievement
        elif http_method == "GET" and achievement_id:
            achievement = service.get_by_id(achievement_id)
            if not achievement:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Achievement not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "id": achievement.id,
                    "description": achievement.description,
                    "date": achievement.date,
                    "team_id": achievement.team_id,
                }),
            }
        
        # POST /achievements - Create new achievement
        elif http_method == "POST":
            print(f"POST request body: {body}")
            request_body = json.loads(body or "{}")
            print(f"Parsed body: {request_body}")
            achievement = Achievement(
                description=request_body.get("description"),
                date=request_body.get("date"),
                team_id=request_body.get("team_id"),
            )
            print(f"Creating achievement: description={achievement.description}, date={achievement.date}, team_id={achievement.team_id}")
            achievement_id = service.create(achievement)
            print(f"Achievement created with ID: {achievement_id}")
            return {
                "statusCode": 201,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"id": achievement_id, "message": "Achievement created"}),
            }
        
        # PUT /achievements/{id} - Update achievement
        elif http_method == "PUT" and achievement_id:
            request_body = json.loads(body or "{}")
            achievement = Achievement(
                description=request_body.get("description"),
                date=request_body.get("date"),
                team_id=request_body.get("team_id"),
            )
            updated = service.update(achievement_id, achievement)
            if not updated:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Achievement not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": "Achievement updated"}),
            }
        
        # DELETE /achievements/{id} - Delete achievement
        elif http_method == "DELETE" and achievement_id:
            deleted = service.delete(achievement_id)
            if not deleted:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Achievement not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": "Achievement deleted"}),
            }
        
        # Method not allowed
        else:
            return {
                "statusCode": 405,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Method not allowed"}),
            }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }


if __name__ == "__main__":
    print(handler())
