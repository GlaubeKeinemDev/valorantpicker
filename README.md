# Valorant Agent Picker

### An instant agent picker for Valorant. This is a simple console application written in Python. This application uses the client wrapper valclient.py. With the usage of a client wrapper there is no need to add any type of credential it uses the local client.

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
  "region": "eu"
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
## Troubleshooting
If the program instantly closes after start:
* Be sure there is a config.json in the same directory 
* Be sure your region is available
* Be sure your agent set in the config is available
* Be sure your Valorant is running
* Try to run the .exe file as an administrative user
## Credits
* [Valclient.py](https://github.com/colinhartigan/valclient.py) - used as Valorant client wrapper
* [PyInstaller](https://pyinstaller.org/en/stable/) - used to transform Python Code to an .exe file