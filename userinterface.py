import sys
from PyQt5.QtWebChannel import QWebChannel
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl, QObject, pyqtSlot, QTimer
from PyQt5.QtGui import QIcon
from valoranthelper import ValorantHelper
import os
import appdirs
import json
import requests

app = QApplication(sys.argv)

val_helper = ValorantHelper()
val_helper.checkIfRunning()

class Configuration:

    def __init__(self):
        appdata_dir = appdirs.user_data_dir('ValorantPicker')
        os.makedirs(appdata_dir, exist_ok=True)
        self.__config_path = os.path.join(appdata_dir, 'config.json')

        self.__config = {}

        if not os.path.exists(self.__config_path):
            # first available agent
            agent = requests.get("https://valorant-api.com/v1/agents?isPlayableCharacter=True").json()['data'][0][
                'uuid']

            self.__config = {
                'lockEnabled': True,
                'lockType': 'Instalock',
                'lockAgent': agent
            }

            with open(self.__config_path, 'w') as f:
                json.dump(self.__config, f, indent=4)

        with open(self.__config_path, 'r') as f:
            self.__config = json.load(f)

    def setLockEnabled(self, value):
        self.__config['lockEnabled'] = value

    def setLockType(self, value):
        self.__config['lockType'] = value

    def setLockAgent(self, value):
        self.__config['lockAgent'] = value

    def isLockEnabled(self):
        return self.__config['lockEnabled']

    def getLockType(self):
        return self.__config['lockType']

    def getLockAgent(self):
        return self.__config['lockAgent']

    def saveConfig(self):
        with open(self.__config_path, 'w') as f:
            json.dump(self.__config, f, indent=4)


class Bridge(QObject):

    def __init__(self):
        super().__init__()
        self.__config = Configuration()

    def getConfig(self):
        return self.__config

    @pyqtSlot(bool)
    def updateLockEnable(self, value):
        print("hier klingelts ", value)
        self.__config.setLockEnabled(value)

    @pyqtSlot(str)
    def updateLockType(self, value):
        self.__config.setLockType(value)

    @pyqtSlot(str)
    def updateLockableAgent(self, value):
        self.__config.setLockAgent(value)

    @pyqtSlot()
    def saveConfig(self):
        self.__config.saveConfig()

    @pyqtSlot(result=bool)
    def checkIfClientRunning(self):
        x = val_helper.checkIfRunning()
        return x

    @pyqtSlot(result=str)
    def getName(self):
        return val_helper.getName()

    @pyqtSlot(result=str)
    def getLockAgent(self):
        return self.__config.getLockAgent()

    @pyqtSlot(result=str)
    def getLockType(self):
        return self.__config.getLockType()

    @pyqtSlot(result=bool)
    def isLockEnabled(self):
        return self.__config.isLockEnabled()

    @pyqtSlot(str)
    def printConsole(self, value):
        print(value)


class MainWindow(QMainWindow):

    def __init__(self):
        super().__init__()
        self.initUi()

    def initUi(self):
        width = 1000
        height = 650

        self.setWindowTitle("Agent Picker")
        self.setGeometry(0, 0, width, height)
        self.setWindowIcon(QIcon('ui/assets/app_icon.png'))
        self.setFixedSize(width, height)

        # Zentrieren des Fensters
        window_frame = self.frameGeometry()
        center_point = QApplication.desktop().availableGeometry().center()
        window_frame.moveCenter(center_point)
        self.move(window_frame.topLeft())

        self.web_view = QWebEngineView()
        self.setCentralWidget(self.web_view)

        ui_path = "/ui/index.html"
        self.web_view.setUrl(QUrl.fromLocalFile(ui_path))

        # JavaScript-Objekt als Brücke zwischen HTML und Python
        self.bridge = Bridge()
        self.web_channel = QWebChannel()
        self.web_channel.registerObject("clientbridge", self.bridge)
        self.web_view.page().setWebChannel(self.web_channel)

        self.hookIntoMainLoop()

    def hookIntoMainLoop(self):
        self.timer = QTimer()
        self.timer.timeout.connect(self.mainloop)
        self.timer.start(10000)

    def mainloop(self):
        #self.web_view.page().runJavaScript("showAlert({});")

        if val_helper:
            if self.bridge.getConfig().isLockEnabled():
                try:
                    val_helper.selectAgent(self.bridge.getConfig().getLockAgent())

                    if self.bridge.getConfig().getLockType() == 'Instalock':
                        val_helper.lockAgent(self.bridge.getConfig().getLockAgent())
                except:
                    print("Vermutlich kein pregame!")


if __name__ == "__main__":
    history = val_helper.client.fetch_match_history(queue_id="competitive")
    matchId = history["History"][0]["MatchID"]
    details = val_helper.client.fetch_match_details(matchId)
    print(val_helper.getFullMatchJsonString(details))
    window = MainWindow()
    window.show()

    sys.exit(app.exec_())
