let video = document.querySelector("video");
let recordBtnCont = document.querySelector(".record-btn-cont");
let recordBtn = document.querySelector(".record-btn");
let captureBtnCont = document.querySelector(".capture-btn-cont");
let captureBtn = document.querySelector(".capture-btn");
let recordFlag = false;
let transparentColor = "transparent";

let minzoom = 1;
let maxzoom = 3;
let currzoom = 1;

let recorder;
let chunks = []; // Media data in chunks

let constraints = {
    video: true,
    audio: true
}

// navigator -> global, browser info
navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
        video.srcObject = stream;

        recorder = new MediaRecorder(stream);
        recorder.addEventListener("start", (e) => {
            chunks = [];
        })
        recorder.addEventListener("dataavailable", (e) => {
            chunks.push(e.data);
        })
        recorder.addEventListener("stop", (e) => {
            // Conversion of media chunks data to video
            let blob = new Blob(chunks, { type: "video/mp4" });

            if (db) {
                let videoID = shortid();
                let dbTransaction = db.transaction("video", "readwrite");
                let videoStore = dbTransaction.objectStore("video");
                let videoEntry = {
                    id: `vid-${videoID}`,
                    blobData: blob
                }
                videoStore.add(videoEntry);
            }

            // let a = document.createElement("a");
            // a.href = videoURL;
            // a.download = "stream.mp4";
            // a.click();
        })
    })

recordBtnCont.addEventListener("click", (e) => {
    if (!recorder) return;

    recordFlag = !recordFlag;

    if (recordFlag) { // start
        recorder.start();
        recordBtn.classList.add("scale-record");
        startTimer();
    }
    else { // stop
        recorder.stop();
        recordBtn.classList.remove("scale-record");
        stopTimer();
    }
})

captureBtnCont.addEventListener("click", (e) => {
    captureBtn.classList.add("scale-capture");

    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let tool = canvas.getContext("2d");

    //Applying zooming
    tool.translate(canvas.width / 2, canvas.height / 2);
    tool.scale(currzoom, currzoom);
    tool.translate(-canvas.width / 2, -canvas.height / 2);

    tool.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Filtering 
    tool.fillStyle = transparentColor;
    tool.fillRect(0, 0, canvas.width, canvas.height);

    let imageURL = canvas.toDataURL();

    if (db) {
        let imageID = shortid();
        let dbTransaction = db.transaction("image", "readwrite");
        let imageStore = dbTransaction.objectStore("image");
        let imageEntry = {
            id: `img-${imageID}`,
            url: imageURL
        }
        imageStore.add(imageEntry);
    }

    setTimeout(() => {
        captureBtn.classList.remove("scale-capture");
    }, 500)
})

let timerID;
let counter = 0; // Represents total seconds
let timer = document.querySelector(".timer");
function startTimer() {
    timer.style.display = "block";
    function displayTimer() {
        let totalSeconds = counter;

        let hours = Number.parseInt(totalSeconds / 3600);
        totalSeconds = totalSeconds % 3600; // remaining value

        let minutes = Number.parseInt(totalSeconds / 60);
        totalSeconds = totalSeconds % 60; // remaining value

        let seconds = totalSeconds;

        hours = (hours < 10) ? `0${hours}` : hours;
        minutes = (minutes < 10) ? `0${minutes}` : minutes;
        seconds = (seconds < 10) ? `0${seconds}` : seconds;

        timer.innerText = `${hours}:${minutes}:${seconds}`;

        counter++;
    }

    timerID = setInterval(displayTimer, 1000);
}
function stopTimer() {
    clearInterval(timerID);
    timer.innerText = "00:00:00";
    timer.style.display = "none";
}


// Filtering logic
let filterLayer = document.querySelector(".filter-layer");
let allFilters = document.querySelectorAll(".filter");
allFilters.forEach((filterElem) => {
    filterElem.addEventListener("click", (e) => {
        // Get style
        transparentColor = getComputedStyle(filterElem).getPropertyValue("background-color");
        filterLayer.style.backgroundColor = transparentColor;
    })
})


//Zoom In and Out
let zoomin = document.querySelector(".zoom-in");
let zoomout = document.querySelector(".zoom-out")
zoomin.addEventListener("click", function () {
    let videocurrscale = video.style.transform.split("(")[1].split(")")[0];
    if (videocurrscale > maxzoom) {
        return;
    } else {
        currzoom = Number(videocurrscale) + 0.1;
        video.style.transform = `scale(${currzoom})`;
    }
})
zoomout.addEventListener("click", function () {

    if (currzoom > minzoom) {
        currzoom -= 0.1;
        video.style.transform = `scale(${currzoom})`;
    }
})

