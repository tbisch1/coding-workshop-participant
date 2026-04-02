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
    host = "172.17.0.1"
    port = 27017
    db_name = "TeamManagement"
    user = None
    password = None
    is_local = False

    if user and password:
        uri = f"mongodb://{user}:{password}@{host}:{port}/{db_name}"
    else:
        uri = f"mongodb://{host}:{port}/{db_name}"

    client = MongoClient(uri, tls=not is_local)
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
    # AWS Lambda handler that returns all achievements.
    service = AchievementService()
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


if __name__ == "__main__":
    print(handler())
