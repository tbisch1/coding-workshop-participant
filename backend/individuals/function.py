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
    def __init__(self, name: str, team_lead: Individual, organization: str):
        self.name = name
        self.team_lead = team_lead
        self.organization = organization


class Achievement:
    def __init__(self, description: str, date: str, team: Team):
        self.description = description
        self.date = date
        self.team = team


class TeamIndividual:
    def __init__(self, team: Team, individual: Individual):
        self.team = team
        self.individual = individual


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


# ─── Individual Service ───────────────────────────────────────────────────────

class IndividualDatabase:
    def __init__(self):
        print("Connecting to MongoDB for Individuals...")
        self._collection: Collection = connect_to_db("Individuals")

    def _serialize(self, individual: Individual) -> dict:
        return {
            "name": individual.name,
            "email": individual.email,
            "password": individual.password,
            "location": individual.location,
            "position": individual.position,
        }

    def _deserialize(self, doc: dict) -> Individual:
        individual = Individual(
            name=doc["name"],
            email=doc["email"],
            password=doc["password"],
            location=doc["location"],
            position=doc["position"],
        )
        individual.id = str(doc["_id"])
        return individual

    ### CRUD operations

    def create(self, individual: Individual) -> str:
        doc = self._serialize(individual)
        result = self._collection.insert_one(doc)
        return str(result.inserted_id)

    def get_by_id(self, individual_id: str) -> Optional[Individual]:
        doc = self._collection.find_one({"_id": ObjectId(individual_id)})
        if doc is None:
            return None
        return self._deserialize(doc)

    def get_all(self) -> list[Individual]:
        docs = self._collection.find()
        return [self._deserialize(doc) for doc in docs]

    def update(self, individual_id: str, individual: Individual) -> bool:
        # Returns True if the individual was found and updated
        doc = self._serialize(individual)
        result = self._collection.update_one(
            {"_id": ObjectId(individual_id)},
            {"$set": doc},
        )
        return result.matched_count > 0

    def delete(self, individual_id: str) -> bool:
        # Returns True if the individual was found and deleted
        result = self._collection.delete_one({"_id": ObjectId(individual_id)})
        return result.deleted_count > 0


class IndividualService:
    def __init__(self):
        self._db = IndividualDatabase()

    def create(self, individual: Individual) -> str:
        return self._db.create(individual)

    def get_by_id(self, individual_id: str) -> Optional[Individual]:
        return self._db.get_by_id(individual_id)

    def get_all(self) -> list[Individual]:
        return self._db.get_all()

    def update(self, individual_id: str, individual: Individual) -> bool:
        return self._db.update(individual_id, individual)

    def delete(self, individual_id: str) -> bool:
        return self._db.delete(individual_id)


# ─── Lambda Handler ───────────────────────────────────────────────────────────

def handler(event: dict = None, context: object = None) -> dict:
    # AWS Lambda handler that returns all individuals.
    service = IndividualService()
    individuals = service.get_all()

    body = [
        {
            "id": individual.id,
            "name": individual.name,
            "email": individual.email,
            "location": individual.location,
            "position": individual.position,
        }
        for individual in individuals
    ]

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


if __name__ == "__main__":
    print(handler())
