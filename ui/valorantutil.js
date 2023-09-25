/* Check if clientbridge could be found */
var clientbridge;

if (typeof QWebChannel !== 'undefined') {
    new QWebChannel(qt.webChannelTransport, function (channel) {
        clientbridge = channel.objects.clientbridge;
        initialStuff();
    });
} else {
    initialStuff();
}

async function test() {
    if (clientbridge) {
        jsonRaw = await clientbridge.getMatchDetails(0,12);
        jsonString = JSON.parse(jsonRaw);
        for  (var i = 0; i < jsonString.length; i++) {
            renderMatchOverview(jsonString[i], true);
        }
    }
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

/* Initial stuff for first load or after losing client connection */
function initialStuff() {
    if(clientbridge) {
        setClientName();
        checkIfClientIsRunning(false);
        initializeConfigSettings();


        /* Match test
        test();*/
    }
}

/* Checks if client is running -> shows modal to refresh if client isn't running */
async function checkIfClientIsRunning(click) {
    if (clientbridge) {
        if (await clientbridge.checkIfClientRunning()) {
            $('#main_content').removeClass('blur_out');
            $('#modal_clientrunning').modal('hide');
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

function renderMatchOverview(jsonMatchInfo, convert) {
    if (jsonMatchInfo === undefined) {
        return "";
    }

    jsonConverted = jsonMatchInfo;
    if(convert) {
        jsonMatchInfo = jsonMatchInfo.replace(/'/g, "\"");
        jsonConverted = JSON.parse(jsonMatchInfo);
    }
    console.log(jsonConverted)

    isCompetitveUpdates = !!(jsonConverted.player.competitveupdates && Object.keys(jsonConverted.player.competitveupdates).length > 0);

    html = `<div class='col-12 match_overview_result_wrapper' id='match_overview_${jsonConverted.gameId}'>`;

    if (isCompetitveUpdates) {
        html = `<div class='col-12 row m-0 match_overview_result_wrapper' id='match_overview_${jsonConverted.gameId}'>`;
        html = html + `<div class='col-9'>`
    }

    const date = new Date(jsonConverted.startTime);

    html = html + `<div class="d-flex match_overview_timestamp">`;
    html = html + `<p class="my-0 ml-4 light-gray">${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}</p>`;
    html = html + `<p class="m-0 pl-2 darker-gray">${date.getHours()}:${date.getMinutes()}</p>`;
    html = html + `</div>`;

    html = html + `<div class="d-flex match_overview_image">`;
    html = html + `<img src="${jsonConverted.map.icon}" alt="${jsonConverted.map.name}" class="map_image">`;
    html = html + `<img src="${jsonConverted.player.playeragenticon}" alt="${jsonConverted.player.playeragent}" height="100" class="agent_image">`;
    html = html + `<span class="headline font-anton">${jsonConverted.mode}</span>`;

    html = html + `</div>`;

    html = html + `<div class="mt-1 d-flex justify-content-center match_overview_details">`;

    const playerTeam = jsonConverted.player.team;

    html = html + `<p class="mb-0 green">${jsonConverted.teamstats[playerTeam].roundsWon}</p>`;
    html = html + `<p class="mb-0 mx-3 spacer">-</p>`;
    if (playerTeam === "Red") {
        html = html + `<p class="mb-0 red">${jsonConverted.teamstats.Blue.roundsWon}</p>`;
    } else {
        html = html + `<p class="mb-0 red">${jsonConverted.teamstats.Red.roundsWon}</p>`;
    }
    html = html + `</div>`;

    html = html + `<div class="mt-1 d-flex half-gray justify-content-center match_overview_stats">`;
    html = html + `<p class="mb-0 kills">${jsonConverted.player.stats.kills}</p>`;
    html = html + `<p class="mb-0 mx-2">/</p>`;
    html = html + `<p class="mb-0 deaths">${jsonConverted.player.stats.deaths}</p>`;
    html = html + `<p class="mb-0 mx-2">/</p>`;
    html = html + `<p class="mb-0 assists">${jsonConverted.player.stats.assists}</p>`;
    html = html + `</div>`;


    if (isCompetitveUpdates) {
        html = html + `</div>`

        html = html + `<div class='col-3 row match_overview_competitive_updates'>`;

        html = html + `<div class='col-5 my-auto match_overview_rating_updates'>`;

        let positiveRankUpdate = jsonConverted.player.competitveupdates.ratingAfter > jsonConverted.player.competitveupdates.ratingBefore;

        if (positiveRankUpdate) {
            html = html + `<span class="m-0 green match_overview_ratingdifference">+${jsonConverted.player.competitveupdates.ratingDifference}</span>`;
        } else {
            html = html + `<span class="m-0 red match_overview_ratingdifference">${jsonConverted.player.competitveupdates.ratingDifference}</span>`;
        }

        html = html + `<span class="my-0 match_overview_current_rating">${jsonConverted.player.competitveupdates.ratingAfter}</span>`;
        html = html + `</div>`;

        html = html + `<div class='col-7 d-flex match_overview_circle'>`;
        html = html + `<div class='circle_inner my-auto'>`;

        if (positiveRankUpdate) {
            let defaultValue = (360 / 100) * jsonConverted.player.competitveupdates.ratingBefore;
            let finishValue = (360 / 100) * jsonConverted.player.competitveupdates.ratingAfter;

            html = html + `<div class='circle' style="background: conic-gradient(#ccc ${defaultValue}deg, transparent 0deg)"></div>`;
            html = html + `<div class='circle second' style="background: conic-gradient(#407969 ${finishValue}deg, #5e5e5e 0deg)"></div>`;
        } else {
            let defaultValue = (360 / 100) * jsonConverted.player.competitveupdates.ratingAfter;
            let finishValue = (360 / 100) * jsonConverted.player.competitveupdates.ratingBefore;

            html = html + `<div class='circle' style="background: conic-gradient(#ccc ${defaultValue}deg, transparent 0deg)"></div>`;
            html = html + `<div class='circle second' style="background: conic-gradient(#f05c57 ${finishValue}deg, #5e5e5e 0deg)"></div>`;
        }

        html = html + `<img src='${jsonConverted.player.playerrankicon}' alt='${jsonConverted.player.playerrank}' height=60 width=60 class="match_overview_currentrank">`

        html = html + `</div>`;
        html = html + `</div>`;

        html = html + `</div>`;
    }

    var topOffset = 0
    $('#match_history .match_overview_result_wrapper').each(function () {
        topOffset += 180;
    });
    html = html + `<div class="hide match_overview_match_details" id="match_details_${jsonConverted.gameId}" style="top: -${topOffset}px">${getMatchDetailsHtml(jsonMatchInfo, true, true, convert)}</div>`;

    html = html + "</div>";

    document.getElementById("match_history").innerHTML += html;
}

/* Match info | detailed = Sortiert mit stats... | closebutton = soll ein schließen button angezeigt werden | convert = matchinfo erneut konvertieren? */
function getMatchDetailsHtml(jsonMatchInfo, detailed, closebutton, convert) {
    if (jsonMatchInfo === undefined) {
        return "";
    }

    if (detailed === undefined) {
        detailed = false;
    }

    jsonConverted = jsonMatchInfo;
    if (convert) {
        jsonConverted = JSON.parse(jsonMatchInfo);
    }

    html = "<div class='row m-0 match_info " + (detailed ? "detailed" : "") + "'>";

    html = html + `<div class='col-12 d-flex map_info'>`;
    html = html + `<div class='mx-auto image-wrapper'>`;
    html = html + `<img class='map_image' src='${jsonConverted.map.icon}' height="100">`;
    html = html + `<span class="headline font-anton">${jsonConverted.map.name}</span>`;
    html = html + `</div>`;
    if(closebutton) {
        html = html + `<i class="close-button fas fa-arrow-left" data-target="${jsonConverted.gameId}"></i>`
    }
    html = html + `</div>`;

    html = html + `<div class='col-12 d-flex justify-content-center mt-2 time_info'>`;
    const time = Math.floor(jsonMatchInfo.gameLength / 60000);
    html = html + `<span class="mr-2 light-gray">Dauer:</span>`
    html = html + `<span class="darker-gray">${time} Minuten</span>`
    html = html + `</div>`;

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

    if (detailed) {
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