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

languageFile = None

try:
    languageFile = json.load(open(config['language_file']))
except FileNotFoundError:
    pass

if languageFile is None:
    print("Cannot find the requested language file")
    sys.exit()

lang_invalid_agent = None
lang_available_agents = None
lang_invalid_region = None
lang_valorant_not_running = None
lang_try_again = None
lang_pregame_state = None
lang_not_pregame_state = None

try:
    lang_invalid_agent = languageFile['invalid_agent']
    lang_available_agents = languageFile['available_agents']
    lang_invalid_region = languageFile['invalid_region']
    lang_valorant_not_running = languageFile['valorant_not_running']
    lang_try_again = languageFile['try_again']
    lang_pregame_state = languageFile['pregame_state']
    lang_not_pregame_state = languageFile['pregame_not_found']
except:
    print("Your language file doesn't sticks to the default format!")
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
    print(agentShouldBe, lang_invalid_agent)
    print(lang_available_agents, availableAgents)
    sys.exit()

if not clientRegion in availableRegions:
    print(clientRegion, lang_invalid_region, availableRegions)
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
        print(lang_valorant_not_running)
        result = input(lang_try_again)
        if not result == 'y':
            activated = True
            programRunning = False

while programRunning:
    try:
        client.pregame_select_character(pickAgent)
        client.pregame_lock_character(pickAgent)
        print(lang_pregame_state)
    except:
        print(lang_not_pregame_state)
    time.sleep(delayTime)
