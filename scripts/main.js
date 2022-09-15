import { Scene, Obj } from "./game/index.js"

let versionID = document.getElementById("versionID")
let hardMobile = document.getElementById("hardMobile")
let theme = document.getElementById("theme")

window.parent = document.getElementById("scene")

window.livesMeter = document.getElementById("livesMeter")

window.mobile = false

window.highScore = 0
window.highMeter = document.getElementById("highScore")
let muteButton = document.getElementById("muteButton")
muteButton.addEventListener("click", muteUnMute)
hardMobile.addEventListener("click", switchMobile)
if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    )
) {
    mobile = true
}
let mute = true

hardMobile.checked = mobile

const gitVersion = new XMLHttpRequest()
gitVersion.open(
    "GET",
    "https://api.github.com/repos/wowkoltyy/metaballs2.0/commits/main"
)
gitVersion.send()
gitVersion.onreadystatechange = (e) => {
    versionID.innerHTML = "v. 2.0." + gitVersion.responseText.substring(12, 19)
}

function switchMobile() {
    mobile = hardMobile.checked
}

function muteUnMute() {
    if (mute) {
        mute = false
        muteButton.innerHTML = "🔊"
        theme.play()
    } else {
        mute = true
        muteButton.innerHTML = "🔈"
        theme.pause()
    }
}

window.scene = new Scene()

addEventListener("keydown", (e) => {
    scene.keys.add(e.code)
})
addEventListener("keyup", (e) => {
    scene.keys.delete(e.code)
})
addEventListener("mousemove", (e) => {
    scene.mouse.x = e.clientX
    scene.mouse.y = e.clientY
})

window.parent.addEventListener("mousedown", () => {
    if (!window.parent.classList.contains("playing")) {
        scene.start()
    }
})
