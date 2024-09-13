// function getPlaylist(key, postName) {
//   url = `${getText() + key}/archive/datas/${postName}`

//   return fetch(url, {
//     method: 'GET',
//     headers: {
//       'Accept': 'application/json',
//     },
//   }).then(response => response.json())
//     .then(response => plyerInstance(response))
// }

// const data = {
//   "sources": [
//     {
//       "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4?dl=0",
//       "label": "4k"
//     },
//     {
//       "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4?dl=0",
//       "label": "1080p"
//     },
//     {
//       "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4",
//       "label": "720p"
//     },
//     {
//       "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4",
//       "label": "480p"
//     },
//     {
//       "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4",
//       "label": "Auto",
//       "default": true
//     }
//   ],
//   "captions": [
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686529/Blood/Inside/Inside.2023.en_cdm2sg.srt",
//       "label": "English",
//       "kind": "captions",
//       "default": true
//     },
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686529/Blood/Inside/Inside.2023.km_a0mopr.srt",
//       "label": "ខ្មែរ",
//       "kind": "captions"
//     },
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.th_quqggy.srt",
//       "label": "Thai",
//       "kind": "captions"
//     },
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.kr_a7ph90.srt",
//       "label": "Korea",
//       "kind": "captions"
//     },
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.ar_ctlkw4.srt",
//       "label": "Arabic",
//       "kind": "captions"
//     },
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.id_de3dhy.srt",
//       "label": "Indonesia",
//       "kind": "captions"
//     },
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.vn_tleusl.srt",
//       "label": "Vietnamese",
//       "kind": "captions"
//     },
//     {
//       "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.ml_uzyzuw.srt",
//       "label": "Malay",
//       "kind": "captions"
//     }
//   ]
// }

function plyerInstance(data) {
  if(!data || typeof data !== 'object' ){
    return
  }
  const playerInstance = jwplayer("player").setup({ ...data });

  playerInstance.on("ready", function () {
    const buttonId = "download-video-button";
    const iconPath =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTMgMTloMTh2Mkgzdi0yem0xMC01LjgyOEwxOS4wNzEgNy4xbDEuNDE0IDEuNDE0TDEyIDE3IDMuNTE1IDguNTE1IDQuOTI5IDcuMSAxMSAxMy4xN1YyaDJ2MTEuMTcyeiIgZmlsbD0icmdiYSgyNDcsMjQ3LDI0NywxKSIvPjwvc3ZnPg==";
    const tooltipText = "Download";
    // This function is executed when the button is clicked
    function buttonClickAction() {
      const playlistItem = playerInstance.getPlaylistItem();
      const anchor = document.createElement("a");
      const fileUrl = playlistItem.file;
      anchor.setAttribute("href", fileUrl);
      const downloadName = playlistItem.file.split("/").pop();
      anchor.setAttribute("download", downloadName);
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }

    // Move the timeslider in-line with other controls
    const playerContainer = playerInstance.getContainer();
    const buttonContainer = playerContainer.querySelector(".jw-button-container");
    const spacer = buttonContainer.querySelector(".jw-spacer");
    const timeSlider = playerContainer.querySelector(".jw-slider-time");
    // Forward 10 seconds
    const rewindContainer = playerContainer.querySelector(
      ".jw-display-icon-rewind"
    );
    const forwardContainer = rewindContainer.cloneNode(true);
    const forwardDisplayButton = forwardContainer.querySelector(
      ".jw-icon-rewind"
    );
    forwardDisplayButton.style.transform = "scaleX(-1)";
    forwardDisplayButton.ariaLabel = "Forward 10 Seconds";
    const nextContainer = playerContainer.querySelector(".jw-display-icon-next"); nextContainer.parentNode.insertBefore(forwardContainer, nextContainer);
    // control bar icon
    playerContainer.querySelector(".jw-display-icon-next").style.display = "none"; // hide next button
    const rewindControlBarButton = buttonContainer.querySelector(
      ".jw-icon-rewind"
    );
    const forwardControlBarButton = rewindControlBarButton.cloneNode(true);
    forwardControlBarButton.style.transform = "scaleX(-1)";
    forwardControlBarButton.ariaLabel = "Forward 10 Seconds"; rewindControlBarButton.parentNode.insertBefore(
      forwardControlBarButton, rewindControlBarButton.nextElementSibling
    );
    // add onclick handlers
    [forwardDisplayButton, forwardControlBarButton].forEach((button) => {
      button.onclick = () => {
        playerInstance.seek(playerInstance.getPosition() + 10);
      };
    });
  });
}
