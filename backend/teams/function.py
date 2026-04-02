import json
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
from typing import Optional
import os


# ─── Models ───────────────────────────────────────────────────────────────────

class Individual:
    def __init__(self, name: str, email: str, password: str, location: str, position: str):
        self.name = name
        self.email = email
        self.password = password
        self.location = location
        self.position = position


class Team:
    def __init__(self, name: str, team_lead_id: str, organization: str):
        self.name = name
        self.team_lead_id = team_lead_id
        self.organization = organization


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


# ─── Team Service ─────────────────────────────────────────────────────────────

class TeamDatabase:
    def __init__(self):
        print("Connecting to MongoDB for Teams...")
        self._collection: Collection = connect_to_db("Teams")

    def _serialize(self, team: Team) -> dict:
        return {
            "name": team.name,
            "team_lead_id": team.team_lead_id,
            "organization": team.organization,
        }

    def _deserialize(self, doc: dict) -> Team:
        team = Team(
            name=doc["name"],
            team_lead_id=doc["team_lead_id"],
            organization=doc["organization"],
        )
        team.id = str(doc["_id"])
        return team

    ### CRUD operations

    def create(self, team: Team) -> str:
        doc = self._serialize(team)
        result = self._collection.insert_one(doc)
        return str(result.inserted_id)

    def get_by_id(self, team_id: str) -> Optional[Team]:
        doc = self._collection.find_one({"_id": ObjectId(team_id)})
        if doc is None:
            return None
        return self._deserialize(doc)

    def get_all(self) -> list[Team]:
        docs = self._collection.find()
        return [self._deserialize(doc) for doc in docs]

    def update(self, team_id: str, team: Team) -> bool:
        # Returns True if the team was found and updated
        doc = self._serialize(team)
        result = self._collection.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": doc},
        )
        return result.matched_count > 0

    def delete(self, team_id: str) -> bool:
        # Returns True if the team was found and deleted
        result = self._collection.delete_one({"_id": ObjectId(team_id)})
        return result.deleted_count > 0


class TeamService:
    def __init__(self):
        self._db = TeamDatabase()

    def create(self, team: Team) -> str:
        return self._db.create(team)

    def get_by_id(self, team_id: str) -> Optional[Team]:
        return self._db.get_by_id(team_id)

    def get_all(self) -> list[Team]:
        return self._db.get_all()

    def update(self, team_id: str, team: Team) -> bool:
        return self._db.update(team_id, team)

    def delete(self, team_id: str) -> bool:
        return self._db.delete(team_id)


# ─── Lambda Handler ───────────────────────────────────────────────────────────

def handler(event: dict = None, context: object = None) -> dict:
    # AWS Lambda handler that returns all teams.
    service = TeamService()
    teams = service.get_all()

    body = [
        {
            "id": team.id,
            "name": team.name,
            "team_lead_id": team.team_lead_id,
            "organization": team.organization,
        }
        for team in teams
    ]

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


if __name__ == "__main__":
    print(handler())
