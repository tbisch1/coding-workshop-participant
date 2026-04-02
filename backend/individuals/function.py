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
    """
    AWS Lambda handler for individuals API (Lambda Function URL format).
    Supports GET (all/by-id), POST (create), PUT (update), DELETE operations.
    """
    try:
        service = IndividualService()
        
        # Parse Lambda Function URL event format
        http_method = event.get("requestContext", {}).get("http", {}).get("method", "GET") if event else "GET"
        raw_path = event.get("rawPath", "") if event else ""
        body = event.get("body", "") if event else ""
        
        # Parse path: /individuals or /individuals/{id}
        path_parts = [p for p in raw_path.split('/') if p]
        resource = path_parts[0] if path_parts else ""
        individual_id = path_parts[1] if len(path_parts) > 1 else None
        
        # Validate it's the individuals endpoint
        if resource != "individuals":
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Endpoint not found"}),
            }
        
        # GET /individuals - Get all individuals
        if http_method == "GET" and not individual_id:
            individuals = service.get_all()
            body_list = [
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
                "body": json.dumps(body_list),
            }
        
        # GET /individuals/{id} - Get single individual
        elif http_method == "GET" and individual_id:
            individual = service.get_by_id(individual_id)
            if not individual:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Individual not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "id": individual.id,
                    "name": individual.name,
                    "email": individual.email,
                    "location": individual.location,
                    "position": individual.position,
                }),
            }
        
        # POST /individuals - Create new individual
        elif http_method == "POST":
            print(f"POST request body: {body}")
            request_body = json.loads(body or "{}")
            print(f"Parsed body: {request_body}")
            individual = Individual(
                name=request_body.get("name"),
                email=request_body.get("email"),
                password=request_body.get("password"),
                location=request_body.get("location"),
                position=request_body.get("position"),
            )
            print(f"Creating individual: name={individual.name}, email={individual.email}")
            individual_id = service.create(individual)
            print(f"Individual created with ID: {individual_id}")
            return {
                "statusCode": 201,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"id": individual_id, "message": "Individual created"}),
            }
        
        # PUT /individuals/{id} - Update individual
        elif http_method == "PUT" and individual_id:
            request_body = json.loads(body or "{}")
            individual = Individual(
                name=request_body.get("name"),
                email=request_body.get("email"),
                password=request_body.get("password"),
                location=request_body.get("location"),
                position=request_body.get("position"),
            )
            updated = service.update(individual_id, individual)
            if not updated:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Individual not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": "Individual updated"}),
            }
        
        # DELETE /individuals/{id} - Delete individual
        elif http_method == "DELETE" and individual_id:
            deleted = service.delete(individual_id)
            if not deleted:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Individual not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": "Individual deleted"}),
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
