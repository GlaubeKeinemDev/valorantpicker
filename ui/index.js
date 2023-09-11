/* TOAST NOTIFICATION */
function showAlert(options) {
    const mainBody = document.getElementById("main_content");

    const title = options.title || "Default Title";
    const message = options.message || "Default Message";

    const notification = document.createElement("div");
    notification.classList.add("toast");

    notification.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-solid fa-check check"></i>

            <div class="message">
                <span class="text text-1">${title}</span>
                <span class="text text-2">${message}</span>
            </div>
        </div>
        <i class="fa-solid fa-xmark close"></i>
    
            <!-- Remove 'active' class, this is just to show in Codepen thumbnail -->
        <div class="progress active">
        </div>
    `;

    mainBody.append(notification);

    notification.classList.add("alive");
    updateNotificationPositions();
    notification.classList.add("custom-transition");
    notification.classList.add("active");

    setTimeout(() => {
        notification.classList.remove("active");
        notification.classList.remove("alive");
        updateNotificationPositions();
    }, 5000);

    setTimeout(() => {
        notification.remove();
    }, 5400);
}

function updateNotificationPositions() {
    const notifications = document.querySelectorAll('.toast.alive');
    let topOffset = 0;

    notifications.forEach(notification => {
        notification.style.top = `${topOffset}px`;
        topOffset += notification.offsetHeight + 10; // 10px Abstand zwischen den Benachrichtigungen
    });
}

/* Check if clientbridge could be found */
var clientbridge;

if (typeof QWebChannel !== 'undefined') {
    new QWebChannel(qt.webChannelTransport, function (channel) {
        clientbridge = channel.objects.clientbridge;
        setClientName();
        checkIfClientIsRunning(false);
        initializeConfigSettings();
    });
} else {
    setClientName();
    /**checkIfClientIsRunning(false);*/
}

/* Sets the client name in the ui */
async function setClientName() {
    var name = ""
    if (clientbridge) {
        name = await clientbridge.getName();
    }
    $('#playername').text("Willkommen " + name);
}

/* Loads saved settings from python application into the gui */
async function initializeConfigSettings() {
    var lockAgent = await clientbridge.getLockAgent();
    var lockType = await clientbridge.getLockType();
    var isLockEnabled = await clientbridge.isLockEnabled();

    $('#agent-holder img').each(function () {
        if ($(this).attr('data-target') == lockAgent) {
            $(this).addClass('active')
        }
    });

    if (lockType == 'Instalock') {
        $('#instalock_switch').prop('checked', true);
    }

    if (isLockEnabled) {
        $('#instalock_enable_switch').prop('checked', true);
    }
}

/* Checks if client is running -> shows modal to refresh if client isn't running */
async function checkIfClientIsRunning(click) {
    if (clientbridge) {
        if (await clientbridge.checkIfClientRunning()) {
            $('#main_content').removeClass('blur_out');
            $('#modal_clientrunning').modal('hide');
            setClientName();
        } else if (!click) {
            $('#modal_clientrunning').modal('show');
            if (!$('#main_content').hasClass('blur_out')) {
                $('#main_content').addClass('blur_out');
            }
        }
    } else {
        if (!click) {
            $('#modal_clientrunning').modal();
            if (!$('#main_content').hasClass('blur_out')) {
                $('#main_content').addClass('blur_out');
            }
        }
    }

    if (click) {
        $('#clientrunning_refresh').addClass('d-none');
        $('#modal_clientrunning .spinner').removeClass('d-none');

        setTimeout(function () {
            $('#clientrunning_refresh').removeClass('d-none');
            $('#modal_clientrunning .spinner').addClass('d-none');
        }, 2000)
    }
}

document.addEventListener("DOMContentLoaded", function () {
    /* Fetch agents */
    const url = "https://valorant-api.com/v1/agents?isPlayableCharacter=True";

    fetch(url, {
        method: "GET",
    })
        .then((response) => response.json())
        .then((jsonResponse) => {
            rawObjects = jsonResponse.data;
            htmlObject = document.getElementById('agent-holder')

            rawObjects.forEach(object => {
                let appendedCode = "<div class=\"col-1 mt-5\"><img alt='" + object.displayName + "' src='"
                    + object.displayIcon + "' data-target='" + object.uuid + "' class='w-100 p-1'></div>"

                htmlObject.insertAdjacentHTML("beforeend", appendedCode)
            });

            $('#agent-holder img').on('click', function () {
                $('#agent-holder img').each(function () {
                    $(this).removeClass('active')
                })

                $(this).addClass('active')
            });
        })
        .catch((error) => {
            console.error("Fehler bei der Anfrage:", error);
        });


    /* Saves instalock settings */
    $('#instalock_save_btn').click(function () {
        if (clientbridge) {
            clientbridge.updateLockEnable($('#instalock_enable_switch').prop('checked'));
            if ($('#instalock_switch').prop('checked')) {
                clientbridge.updateLockType('Instalock');
            } else {
                clientbridge.updateLockType('Select');
            }
            clientbridge.updateLockableAgent($('#agent-holder img.active').attr('data-target'));
            clientbridge.saveConfig();

            showAlert({
                title: "Gespeichert",
                message: "Einstellungen wurden gespeichert"
            });
            /* success */
        } else {
            /* Error */
        }
    });
});

/* Tab navigation */
function openPage(event, pageId) {
    $('.tab-page').each(function () {
        $(this).addClass('d-none')
    })

    document.getElementById(pageId).classList.remove('d-none')

    $('#tab_navigation button').each(function () {
        $(this).removeClass('btn-secondary')
    })

    event.target.classList.add('btn-secondary')
}

function getMatchOverview(jsonMatchInfo) {
    if (jsonMatchInfo == undefined) {
        return "";
    }

    jsonConverted = JSON.parse(jsonMatchInfo);
    isCompetitveUpdates = false;
    if(jsonConverted.player.competitveupdates && Object.keys(jsonConverted.player.competitveupdates).length > 0) {
        isCompetitveUpdates = true;
    }

    html = `<div class='col-12 row' id='match_overview_${jsonMatchInfo.gameId}'>`;
    if(isCompetitveUpdates) {
        html = html + `<div class='col-9'>`
    }

    html = html + `<div class="match_overview_image">`;
    html = html + `<img src="${jsonConverted.map.icon}" alt="${jsonConverted.map.name}">`;
    html = html + `<img src="${jsonConverted.player.playeragenticon}" alt="${jsonConverted.player.playeragent}">`;

    html = html + `</div>`;

    if(isCompetitveUpdates) {
        html = html + `</div>`
        /* Kreis anzeigen mit richtiger Füllung */
        html = html + `<div class='match_overview_competitive_updates'>
        
        </div>`
    }
    html = html + "</div>";
}

/* Match info | detailed = Sortiert mit stats... */
function getMatchDetailsHtml(jsonMatchInfo, detailed) {
    if (jsonMatchInfo == undefined) {
        return "";
    }

    if (detailed == undefined) {
        detailed = false;
    }

    jsonConverted = JSON.parse(jsonMatchInfo);

    html = "<div class='row m-0 match_info " + (detailed ? "detailed" : "") +"'>";

    map = `<div class='col-12 d-flex map_info'><img class='w-100 mx-auto map_image' src='${jsonConverted.map.icon}' height="100"></div>`;
    html = html + map;

    if (!detailed) {
        team_blue = `<div class="col-6 team_blue">`

        for (var i = 0; i < jsonConverted.team_blue.length; i++) {
            var player = jsonConverted.team_blue[i];

            playerHtml = getPlayerHtml(player, detailed);
            team_blue = team_blue + playerHtml;
        }

        team_blue = team_blue + "</div>";
        html = html + team_blue;

        team_red = `<div class="col-6 team_red">`

        for (var i = 0; i < jsonConverted.team_red.length; i++) {
            var player = jsonConverted.team_red[i];

            playerHtml = getPlayerHtml(player);
            team_red = team_red + playerHtml;
        }

        team_red = team_red + "</div>";
        html = html + team_red;
    } else {

        for (var i = 0; i < jsonConverted.playerPerformance.length; i++) {
            var player = jsonConverted.playerPerformance[i];

            html = html + `<div class="col-12 team_${player.team.toLowerCase()}">`;
            playerHtml = getPlayerHtml(player, detailed);
            html = html + playerHtml + "</div>";
        }

    }

    html = html + "</div>";
    return html;
}

function getPlayerHtml(player, detailed) {
    statsDetails = ""

    if(detailed) {
        statsDetails = `
        <div class="d-flex px-4 my-auto playerstatistics vertical-line">
            <span class="avgdamage">${player.stats.avg_damage}</span>
            <div class="d-flex statsdetails vertical-line">
                <span class="pr-2 kills">${player.stats.kills}</span>
                <span class="seperator">/</span>
                <span class="pl-2 pr-2 deaths">${player.stats.deaths}</span>
                <span class="seperator">/</span>
                <span class="pl-2 assists">${player.stats.assists}</span>
            </div>
        </div>
        `
    }

    result = `<div class='px-5 mt-3 player_card'>
                <div class="d-flex w-100 player_card_inner">
                    <div class="player_agent pr-1">
                        <img class="image" src="${player.agent.icon}" width="50" height="50">
                    </div>
                    <span class="pl-2 w-100 my-auto player_name">${player.name}</span>
                    <img class="p-2 player_rank" src="${player.rank.icon}" width="50" height="50">
                    ${statsDetails}
                </div>
            </div>`;
    return result;
}

