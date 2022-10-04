"use strict";
function changeStatus(newStatus) {
    chrome.storage.local.set({ status: newStatus }, function () {
        return
    })
}

function appendToLog(message) {
    chrome.storage.local.get(['logqueue'], function (result) {
        console.log("atl:" + result.logqueue)
        var newLog = undefined
        //TODO: test
        if (!result.logqueue) newLog = []
        else newLog = result.logqueue

        newLog.push(message)
        chrome.storage.local.set({ "logqueue": newLog }, function () {
            return
        });
    })
}

async function reloadAfterError() {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    var botTab = tabs[0]
    await chrome.tabs.reload(botTab.id)
    chrome.scripting.executeScript(
        {
            files: ["inject.js"],
            target: {
                tabId: botTab.id
            }
        }
    )
}

chrome.runtime.onMessage.addListener( //FROM CONTENT SCRIPT
    async function (request, sender, sendResponse) {
        if (request.status == "start-success") {
            appendToLog("Bot started successfully.")
            changeStatus("Running")
            return true
        }
        if (request.status == "start-failure") {
            appendToLog("Bot failed to start with error: " + request.error)
            changeStatus("Start Failure, please retry")
            return true
        }
        if (request.status == "periodic-error") {
            appendToLog("Bot encountered an error it will try to recover from: " + request.error)
            return true
        }
        if (request.status == "bot-done") {
            appendToLog("Bot has finished")
            changeStatus("Finished")
            return true
        }
        if (request.status == "form-not-found") {
            appendToLog("Reloading page to solve apparent issue...")
            changeStatus("Reloading...")
            await reloadAfterError()
            changeStatus("Running")
            return true
        }
    }
);

chrome.storage.onChanged.addListener(
    async function () {
        console.log("storage changed")
        chrome.storage.local.get("pendingcommandforbackground", async function (result) {
            console.log(result)
            if (result.pendingcommandforbackground == "start-bot") {
                try {
                    let tabs = await chrome.tabs.query({ active: true, currentWindow: true })
                    var botTab = tabs[0]
                    console.log("executing...")
                    chrome.scripting.executeScript(
                        {
                            target: { tabId: botTab.id },
                            files: ["inject.js"]
                        }
                    )
                    console.log("working")
                    changeStatus("Running")
                    appendToLog("Started.")
                    chrome.storage.local.set({pendingcommandforbackground: ""}, () => {})
                } catch (error) {
                    changeStatus("Not Running")
                    appendToLog(error)
                    console.log("start bot error " + error)
                }
            }
            if (result.pendingcommandforbackground == "stop-bot") {
                chrome.runtime.sendMessage({ command: "stop" }, function (response) {
                    if (response == undefined) {
                        changeStatus("No Response From Content Script")
                        return
                    }
                    if (response.status == "stop-success") {
                        changeStatus("Stopped")
                    } else {
                        changeStatus("Stop Failure, Please Retry")
                        appendToLog(response.error)
                    }
                })
            }
        })
    }
)