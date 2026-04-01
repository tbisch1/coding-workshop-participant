from pymongo import MongoClient
from pymongo.collection import Collection
from urllib.parse import quote_plus
import os


def connect_to_db(collection_name: str) -> Collection:
    # """Connect to the MongoDB/DocumentDB database and return the specified collection."""
    host = "172.17.0.1"
    port = 27017
    db_name = "TeamManagement"
    user = None
    password = None
    is_local = False #os.environ.get("IS_LOCAL", "true").lower() == "true"

    if user and password:
        uri = f"mongodb://{user}:{password}@{host}:{port}/{db_name}"
    else:
        uri = f"mongodb://{host}:{port}/{db_name}"

    client = MongoClient(uri, tls=not is_local)
    db = client[db_name]
    collection: Collection = db[collection_name]

    return collection