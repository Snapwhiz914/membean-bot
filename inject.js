//Start

var timeoutId = 0


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

function sendMessageToExtension(obj) {
    try {
        chrome.runtime.sendMessage(obj)
    } catch (error) {
        console.log(error)
    }
}

function injectBotStatus() {
    console.log("injecting bot status text...")
    try {
        document.getSelection("#section1").anchorNode.appendChild(document.createTextNode("Bot running"))
    } catch {
        console.log("Failed injecting bot status text")
    }
}

function interval() {
    injectBotStatus()
    var forms = document.getElementsByTagName("form")
    console.log(forms)
    for (var form of forms) {
        if (form.getAttribute("name") == "Next" || form.getAttribute("name") == "Pass" || form.getAttribute("id") == "ext-gen377" || document.getElementById("ikt") || form.getAttribute("name") == "Click me to stop") {
            try {
                var ikt = document.getElementById("ikt")
                if (ikt) {
                    ikt.click()
                } else {
                    form.click()
                }
                if (form.getAttribute("name") == "Click me to stop") {
                    //Bot is done
                    sendMessageToExtension({ status: "bot-done" })
                    return
                }
                timeoutId = setTimeout(interval, getRandomInt(3, 9) * 1000)
                return
            } catch (error) {
                sendMessageToExtension({ status: "periodic-error", message: error })
                console.log()
            }
        }
    }
    //If it got here, no suitable form was found, therefore we must reload the page
    //send message to the extension to reload so it can reinjct this script
    /*
    try {
        sendMessageToExtension({ status: "form-not-found" })
    } catch (error) {
        console.log(error)
    }
    */
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.command == "stop") {
            try {
                clearTimeout(timeoutId)
                sendResponse({status: "stop-success"})
            } catch(error) {
                sendResponse({status: "stop-failure", error: error})
            }
        }
    }
);

try {
    injectBotStatus()
    var stb = document.getElementById("startTrainingBtn")
    if (stb) { stb.click() }
    var pb = document.getElementById("Proceed")
    if (pb) { pb.click() }
    console.log("Clicked start if it existed")
    console.log("proceed and start interval")
    timeoutId = setTimeout(interval, getRandomInt(3, 9) * 1000)
    sendMessageToExtension({ status: "start-success" })
} catch (error) {
    sendMessageToExtension({ status: "start-failure", message: error })
}