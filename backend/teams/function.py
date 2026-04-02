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


class IndividualDatabase:
    def __init__(self):
        self._collection: Collection = connect_to_db("Individuals")

    def get_by_id(self, individual_id: str) -> Optional[dict]:
        doc = self._collection.find_one({"_id": ObjectId(individual_id)})
        if doc is None:
            return None
        return {
            "id": str(doc["_id"]),
            "name": doc.get("name"),
            "email": doc.get("email"),
            "position": doc.get("position"),
            "location": doc.get("location"),
        }


class TeamService:
    def __init__(self):
        self._db = TeamDatabase()
        self._individuals_db = IndividualDatabase()

    def _format_team(self, team: Team, include_lead: bool = False) -> dict:
        """Convert Team object to dict with proper formatting"""
        data = {
            "id": team.id,
            "name": team.name,
            "team_lead_id": team.team_lead_id,
            "organization": team.organization,
        }
        if include_lead and team.team_lead_id:
            team_lead = self._individuals_db.get_by_id(team.team_lead_id)
            if team_lead:
                data["team_lead"] = team_lead
        return data

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

    def get_team_with_lead(self, team_id: str) -> Optional[dict]:
        """Get team with fully populated team_lead object"""
        team = self.get_by_id(team_id)
        if not team:
            return None
        return self._format_team(team, include_lead=True)

    def get_all_teams_with_leads(self) -> list[dict]:
        """Get all teams with fully populated team_lead objects"""
        teams = self.get_all()
        return [self._format_team(team, include_lead=True) for team in teams]


# ─── Lambda Handler ───────────────────────────────────────────────────────────

def handler(event: dict = None, context: object = None) -> dict:
    """
    AWS Lambda handler for teams API (Lambda Function URL format).
    Supports GET (all/by-id), POST (create), PUT (update), DELETE operations.
    Returns team_lead as full object instead of just ID.
    """
    try:
        service = TeamService()
        
        # Parse Lambda Function URL event format
        http_method = event.get("requestContext", {}).get("http", {}).get("method", "GET") if event else "GET"
        raw_path = event.get("rawPath", "") if event else ""
        body = event.get("body", "") if event else ""
        
        # Parse path: /teams or /teams/{id}
        path_parts = [p for p in raw_path.split('/') if p]
        resource = path_parts[0] if path_parts else ""
        team_id = path_parts[1] if len(path_parts) > 1 else None
        
        # Validate it's the teams endpoint
        if resource != "teams":
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Endpoint not found"}),
            }
        
        # GET /teams - Get all teams with team_lead details
        if http_method == "GET" and not team_id:
            teams = service.get_all_teams_with_leads()
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(teams),
            }
        
        # GET /teams/{id} - Get single team with team_lead details
        elif http_method == "GET" and team_id:
            team = service.get_team_with_lead(team_id)
            if not team:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Team not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(team),
            }
        
        # POST /teams - Create new team
        elif http_method == "POST":
            print(f"POST request body: {body}")
            request_body = json.loads(body or "{}")
            print(f"Parsed body: {request_body}")
            team = Team(
                name=request_body.get("name"),
                team_lead_id=request_body.get("team_lead_id"),
                organization=request_body.get("organization"),
            )
            print(f"Creating team: name={team.name}, team_lead_id={team.team_lead_id}, organization={team.organization}")
            team_id = service.create(team)
            print(f"Team created with ID: {team_id}")
            return {
                "statusCode": 201,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"id": team_id, "message": "Team created"}),
            }
        
        # PUT /teams/{id} - Update team
        elif http_method == "PUT" and team_id:
            request_body = json.loads(body or "{}")
            team = Team(
                name=request_body.get("name"),
                team_lead_id=request_body.get("team_lead_id"),
                organization=request_body.get("organization"),
            )
            updated = service.update(team_id, team)
            if not updated:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Team not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": "Team updated"}),
            }
        
        # DELETE /teams/{id} - Delete team
        elif http_method == "DELETE" and team_id:
            deleted = service.delete(team_id)
            if not deleted:
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Team not found"}),
                }
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": "Team deleted"}),
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
        error_msg = str(e)
        traceback.print_exc()
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": error_msg}),
        }


if __name__ == "__main__":
    print(handler())
