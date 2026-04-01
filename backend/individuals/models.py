class Individual:
    def __init__(self, name: str, email: str, password: str, location: str, position: str):
        self.name = name
        self.email = email
        self.password = password
        self.location = location
        self.position = position

class Team: 
    def __init__(self, location: str, team_lead: Individual, organization: str):
        self.location = location
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