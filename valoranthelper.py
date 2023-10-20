import json
from datetime import datetime
import pytz
import valclient
from valclient.exceptions import HandshakeError
import requests


class ValorantHelper:
    def __init__(self):
        self.client = valclient.Client(region='eu')
        self.client_running = False

        self.puuid = None
        self.fetchedCompetitveUpdates = None

        self.__agentsData = requests.get("https://valorant-api.com/v1/agents",
                                         params={'isPlayableCharacter': True, "language": "de-DE"}).json()['data']
        self.__seasonInfo = requests.get(f"https://valorant-api.com/v1/seasons/competitive/").json()['data']
        self.__mapInfo = requests.get(f"https://valorant-api.com/v1/maps").json()['data']
        self.__competitiveInfo = requests.get(f"https://valorant-api.com/v1/competitivetiers/").json()['data']


    def checkIfRunning(self):
        try:
            self.client.activate()
            self.puuid = self.client.puuid
            self.fetchedCompetitveUpdates = self.client.fetch_competitive_updates()
            self.client_running = True
        except HandshakeError:
            self.client_running = False
        return self.client_running


    def getName(self):
        if self.checkIfRunning():
            return self.client.player_name
        else:
            return ""


    def selectAgent(self, agent):
        self.client.pregame_select_character(agent)


    def lockAgent(self, agent):
        self.client.pregame_lock_character(agent)

    # matchDetails = client.coregame_fetch_match
    def getCoreMatchJsonString(self, matchDetails):
        if not self.client_running:
            return {}

        mapUrl = matchDetails["MapID"]
        playerDetails = matchDetails["Players"]

        localPlayerDetails = {}

        team_blue = []
        team_red = []

        for player in playerDetails:
            agentInfo = self.getAgentInfo(player["CharacterID"])
            playerrank = self.getRankInfo(player["SeasonalBadgeInfo"]["Rank"], player["SeasonalBadgeInfo"]["SeasonID"],
                                          False)

            if not self.puuid is None and player["Subject"] == self.puuid:
                localPlayerDetails = {
                    "id": player["Subject"],
                    "playername": self.client.player_name,
                    "playeragent": player["CharacterID"],
                    "playeragenticon": agentInfo["icon"],
                    "playerrank": playerrank["name"],
                    "playerrankicon": playerrank["icon"],
                    "team": player["TeamID"],
                }

            data = {
                "id": player["Subject"],
                "name": self.getPlayerNameByUUID(player["Subject"]),
                "team": player["TeamID"],
                "rank": playerrank,
                "agent": agentInfo,
            }
            if player["TeamID"] == "Red":
                team_blue.append(data)
            else:
                team_red.append(data)

        json_raw = {
            "gameId": matchDetails["MatchID"],
            "mode": matchDetails["MatchmakingData"]["QueueID"],
            "player": localPlayerDetails,
            "map": self.getMapInfo(mapUrl),
            "team_blue": team_blue,
            "team_red": team_red
        }

        return json.dumps(json_raw)


    # matchDetails = client.fetch_match_details(matchId)
    def getFullMatchJsonString(self, matchDetails):
        if not self.client_running:
            return {}

        mapUrl = matchDetails["matchInfo"]["mapId"]
        seasonId = matchDetails["matchInfo"]["seasonId"]
        playerDetails = matchDetails["players"]

        localPlayerDetails = {}

        team_blue = []
        team_red = []

        playerDamageCache = []

        for player in playerDetails:
            agentInfo = self.getAgentInfo(player["characterId"])
            playerrank = self.getRankInfo(player["competitiveTier"], seasonId, False)
            stats = self.getStatsInfo(player)

            if not self.puuid is None and player["subject"] == self.puuid:
                compUpdates = self.getCompetiveUpdates(matchDetails["matchInfo"]["matchId"])

                localPlayerDetails = {
                    "id": player["subject"],
                    "playername": player["gameName"],
                    "playeragent": player["characterId"],
                    "playeragenticon": agentInfo["icon"],
                    "playerrank": playerrank["name"],
                    "playerrankicon": playerrank["icon"],
                    "team": player["teamId"],
                    "competitveupdates": compUpdates,
                    "stats": stats
                }

            data = {
                "id": player["subject"],
                "name": player["gameName"],
                "team": player["teamId"],
                "rank": playerrank,
                "agent": agentInfo,
                "stats": stats
            }
            if player["teamId"] == "Red":
                team_blue.append(data)
            else:
                team_red.append(data)

            playerDamageCache.append({stats["avg_damage"]: data})

        playerDamageSorted = sorted(playerDamageCache, key=lambda d: list(d.keys())[0])

        json_raw = {
            "startTime": matchDetails["matchInfo"]["gameStartMillis"],
            "gameLength": matchDetails["matchInfo"]["gameLengthMillis"],
            "gameId": matchDetails["matchInfo"]["matchId"],
            "mode": matchDetails["matchInfo"]["queueID"],
            "player": localPlayerDetails,
            "map": self.getMapInfo(mapUrl),
            "team_blue": team_blue,
            "team_red": team_red,
            "teamstats": self.getTeamStats(matchDetails),
            "playerPerformance": [list(d.values())[0] for d in playerDamageSorted]
        }

        return json.dumps(json_raw)


    def getRankInfo(self, input, seasonId, extractTier=True):
        if seasonId == "" or seasonId == "{}":
            seasonId = None

        tier = input

        if extractTier:
            tier = input["QueueSkills"]["competitive"]["SeasonalInfoBySeasonID"][seasonId]["CompetitiveTier"]

        competitiveUuid = None

        for s in self.__seasonInfo:
            if seasonId is not None:
                if s['seasonUuid'] == seasonId:
                    competitiveUuid = s['competitiveTiersUuid']
                    break
            else:
                if self.isCurrentlyActive(s['startTime'], s['endTime']):
                    competitiveUuid = s['competitiveTiersUuid']
                    break

        if competitiveUuid:
            competitiveRanks = None

            for info in self.__competitiveInfo:
                if info['uuid'] == competitiveUuid:
                    competitiveRanks = info['tiers']

            if not competitiveRanks:
                return {}

            for t in competitiveRanks:
                if t['tier'] == tier:
                    return {
                        "name": t["tierName"],
                        "color": t["color"],
                        "background": t["backgroundColor"],
                        "icon": t["largeIcon"]
                    }
        return {}


    def isCurrentlyActive(self, start, end):
        start_time = datetime.strptime(start, "%Y-%m-%dT%H:%M:%SZ")
        end_time = datetime.strptime(end, "%Y-%m-%dT%H:%M:%SZ")

        utc = pytz.timezone("UTC")
        start_time = utc.localize(start_time)
        end_time = utc.localize(end_time)

        current_time = datetime.now(pytz.utc)

        return start_time <= current_time <= end_time


    def getMapInfo(self, mapUrl):
        for info in self.__mapInfo:
            if info["mapUrl"] == mapUrl:
                return {
                    "name": info["displayName"],
                    "icon": info["listViewIcon"]
                }
        return {}


    def getAgentInfo(self, uuid):
        for agent in self.__agentsData:
            if agent["uuid"] == uuid:
                return {
                    "name": agent["displayName"],
                    "icon": agent["displayIcon"]
                }
        return {}


    def getStatsInfo(self, playerObject):
        if not "stats" in playerObject or not "roundDamage" in playerObject:
            return {}

        allDamage = 0
        rounds = 0

        for damage in playerObject["roundDamage"]:
            allDamage += damage["damage"]
            rounds += 1

        avgDamage = allDamage / rounds

        return {
            "kills": playerObject["stats"]["kills"],
            "deaths": playerObject["stats"]["deaths"],
            "assists": playerObject["stats"]["assists"],
            "avg_damage": int(avgDamage)
        }


    def getCompetiveUpdates(self, matchId):
        for updates in self.fetchedCompetitveUpdates['Matches']:
            if updates['MatchID'] == matchId:
                return {
                    "ratingBefore": updates["RankedRatingBeforeUpdate"],
                    "ratingAfter": updates["RankedRatingAfterUpdate"],
                    "ratingDifference": updates["RankedRatingEarned"]
                }

        return {}


    def getTeamStats(self, matchDetails):
        team_stats = matchDetails["teams"]
        raw_data = {}

        for teams in team_stats:
            data = {
                "won": teams["won"],
                "roundsWon": teams["roundsWon"]
            }
            raw_data[teams["teamId"]] = data

        return raw_data


    def getPlayerNameByUUID(self, puuid):
        history = self.client.fetch_match_history(puuid, 0, 1)
        if len(history) < 1:
            return "N/A"

        details = self.client.fetch_match_details(history["History"][0]["MatchID"])

        if details is None:
            return "N/A"

        for player in details["players"]:
            if player["subject"] == puuid:
                return player["gameName"]
