# Valorant Agent Picker

### An instant agent picker for Valorant. This is a simple console application written in Python. This application uses the client wrapper valclient.py. With the usage of a client wrapper there is no need to add any type of credential it uses the local client.
> NOTE: An instant agent selector is against the Valorant tos and you could get punished for using it.
## How to use
1. Download the zip file from the latest release
2. Extract the zip file into a folder on your computer
3. Edit the config.json to your needs
   * Be sure the region inside of the config is correct
4. Run the .exe file inside of the folder

> NOTE: Be sure your Valorant is running before starting the program

## Config
```json
{
  "time_between_requests": 1,
  "agent_to_pick": "Reyna",
  "region": "eu",
  "language_file": "lang_en.json"
}
```

1. time_between_requests
   * Time in seconds between requests to the Valorant API
   * Normally 1 second is enough delay
   * If you want to be safe to not get a timeout set it to 2 or 3
2. agent_to_pick
   * This is the agent which the program tries to instalock
   * Replace it with the default English name of your agent
   * This isn't case sensitive
3. region
   * Represents the region where your account was created in
   * The wrong region can break the whole program (at least it wont work)
   * Available regions are:
     * eu
     * na
     * latam
     * br
     * ap
     * kr
     * pbe
4. language_file
   * json file which includes all strings in a defined format 
## Language file
Example language file. If you want to implement your own language use a json file and stick to this key names
```json
{
  "invalid_agent": "is not a valid agent",
  "available_agents": "available agents:",
  "invalid_region": "isn't a valid region. Regions:",
  "valorant_not_running": "Valorant isn't running",
  "try_again": "Try again? (y/n): ",
  "pregame_state": "Pregame found",
  "pregame_not_found": "Currently not in a pregame"
}
```
## Troubleshooting
If the program instantly closes after start:
* Be sure there is a config.json in the same directory 
* Be sure your region is available
* Be sure your agent set in the config is available
* Be sure your Valorant is running
* Try to run the .exe file as an administrative user
* Be sure your defined language file inside the config exists
* Be sure your language file sticks to the default format of key names
## Credits
* [Valclient.py](https://github.com/colinhartigan/valclient.py) - used as Valorant client wrapper
* [PyInstaller](https://pyinstaller.org/en/stable/) - used to transform Python Code to an .exe file