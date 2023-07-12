import valclient
import requests
import time
import configparser

# CONFIG START
from valclient.exceptions import HandshakeError

config = configparser.ConfigParser()
config.read('config.ini')
delayTime = config.get('General', 'time_between_requests')
agentShouldBe = config.get('General', 'time_between_requests').lower()
pickAgent = "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc"

agentsData = requests.get("https://valorant-api.com/v1/agents", params={'isPlayableCharacter': True}).json()['data']
for agent in agentsData:
    if agent['displayName'].lower() == agentShouldBe:
        pickAgent = agent['uuid']
        break
# CONFIG END

# LOCALCLIENT
client = valclient.Client(region=config.get('General', 'region').lower())

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
    except:
        print("kein pregame")
    time.sleep(delayTime)
