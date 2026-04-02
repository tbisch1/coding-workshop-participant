import json

def handler(event, context):
    """
    Metadata API handler for team management system.
    Returns API metadata and available endpoints.
    """
    try:
        metadata = {
            "service": "coding-workshop-metadata",
            "version": "1.0.0",
            "endpoints": {
                "teams": "/teams",
                "individuals": "/individuals",
                "achievements": "/achievements"
            }
        }
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(metadata),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }

if __name__ == "__main__":
    print(handler(None, None))
