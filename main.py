import valclient
import requests
import time
import json
from valclient.exceptions import HandshakeError
import sys

# CONFIG START
config = None

try:
    config = json.load(open("config.json"))
except FileNotFoundError:
    pass

if config is None:
    print("Cannot find config.json file")
    sys.exit()

delayTime = config['time_between_requests']
agentShouldBe = config['agent_to_pick'].lower()
pickAgent = None
availableAgents = ""
clientRegion = config['region'].lower()
availableRegions = ["na", "eu", "latam", "br", "ap", "kr", "pbe"]

agentsData = requests.get("https://valorant-api.com/v1/agents", params={'isPlayableCharacter': True}).json()['data']
for agent in agentsData:
    availableAgents = availableAgents + agent['displayName'] + ", "
    if agent['displayName'].lower() == agentShouldBe:
        pickAgent = agent['uuid']
        break
availableAgents = availableAgents[0:len(availableAgents) - 2]

if pickAgent is None:
    print(agentShouldBe, "ist kein Valorant Agent")
    print("Verfügbare Agents: " + availableAgents)
    sys.exit()

if not clientRegion in availableRegions:
    print(clientRegion, "ist keine verfügbare Region. Verfügbare Regionen:", availableRegions)
    sys.exit()
# CONFIG END

# LOCALCLIENT
client = valclient.Client(region=clientRegion)

# CHECK IF VALORANT IS RUNNING
programRunning = True

activated = False
while not activated:
    try:
        client.activate()
        activated = True
    except HandshakeError:
        print("Valorant Instanz nicht gefunden!")
        result = input("Erneut versuchen? (y/n): ")
        if not result == 'y':
            activated = True
            programRunning = False

while programRunning:
    try:
        client.pregame_select_character(pickAgent)
        client.pregame_lock_character(pickAgent)
        print("Pregame Status")
    except:
        print("Aktuell kein Pregame Status")
    time.sleep(delayTime)
