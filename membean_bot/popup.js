var st = document.getElementById("status-text")

var botTab = undefined
var currentUpdateIntervalID = 0

function appendToLog(message) {
    document.getElementById("console").innerHTML = document.getElementById("console").innerHTML + message + "\n"
    console.log("appended " + message)
}

function updatePopup() {
    //chrome.runtime.getBackgroundPage(function() { //ensure background page is loaded
        chrome.storage.local.get(['status', "logqueue", "lastupdatetime"], function (data) {
            if (data.status == "Running") {
                document.getElementById("startbot").disabled = true
                document.getElementById("stopbot").disabled = false
                st.style.color = "green"
                st.innerText = "The bot is running. The tab must be left open and the computer must not fall asleep"
            }
            if (data.status == "Not Running") {
                document.getElementById("startbot").disabled = false
                document.getElementById("stopbot").disabled = true
                st.style.color = "grey"
                st.innerText = "The bot is not running."
            }
            if (data.status == "Reloading") {
                st.style.color = "blue"
                st.innerText = "Reloading..."
            }
            if (data.status == "Finished") {
                document.getElementById("startbot").disabled = false
                document.getElementById("stopbot").disabled = true
                st.style.color = "green"
                st.innerText = "The bot has finished your membean for you."
            }
            if (data.status == "No Response From Content Script") {
                document.getElementById("startbot").disabled = false
                document.getElementById("stopbot").disabled = true
                st.style.color = "red"
                st.innerText = "The tab has been closed or the bot has failed, please retry if membean session is not complete."
            }
            if (Date.now() > data.lastupdatetime) {
                for (var message of data.logqueue) {
                    appendToLog(message)
                    console.log("appending " + message)
                }
                chrome.storage.local.set({ "logqueue": [] }, function () {
                    console.log("cleared log queue");
                });
            }
        })
    //})
}
document.addEventListener('DOMContentLoaded', updatePopup);
chrome.storage.onChanged.addListener(updatePopup)

document.getElementById("startbot").onclick = async function () {
    var st = document.getElementById("status-text")
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    console.log("start bot after tabs")
    if (tabs[0].url.startsWith("https://membean.com/training_sessions")) {
        botTab = tabs[0]
        chrome.storage.local.set({ pendingcommandforbackground: "start-bot", acc: document.getElementById("accuracy").value }, function () {
            console.log("Starting bot from bot")
            appendToLog("Starting bot...")
        })
    } else {
        st.style.color = "red"
        st.innerText = "Start a Membean session to start the bot"
    }
}

document.getElementById("stopbot").onclick = async function () {
    chrome.storage.local.set({ pendingcommandforbackground: "stop-bot" }, function () {
        appendToLog("Stopping bot...")
    })
}