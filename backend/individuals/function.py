import json
from individuals import IndividualService

def handler(event: dict = None, context: object = None) -> dict:
    """
    AWS Lambda handler that returns all individuals.
    """

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
