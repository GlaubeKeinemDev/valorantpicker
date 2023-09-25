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

    $('#match_history .match_overview_match_details .close-button').click(function (event) {
        event.stopPropagation();
        $('#match_history .match_overview_match_details').each(function () {
            if(!$(this).hasClass('hide')) {
                $(this).addClass('hide');
            }
        });
    });

    $('#match_history .match_overview_result_wrapper').click(function () {
        $('#match_history .match_overview_match_details').each(function () {
            if(!$(this).hasClass('hide')) {
                $(this).addClass('hide');
            }
        });

        const matchId = $(this).attr('id').split("_")[2];
        $('#match_details_' + matchId).removeClass('hide');
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

