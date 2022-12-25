const socket = io("/");

const peers = {};

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    //방에 맨처음 들어갔을 때 웹캠을 통해 video를 만들어줌.

    peer.on("call", (call) => {
      call.answer(stream);
      //peer서버에 call을 통해 현재 접속한 user의 video를 보냄
      const video = document.createElement("video");
      call.on("stream", (videoStream) => {
        addVideoStream(video, videoStream);
      });
      //peer서버로 부터 stream데이터를 받아 addVideoStream를 통해서 video만듦.
      //이전부터 방에 존재한 다른 사람의 video들을 볼수있게 해주는거.
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
    //해당 방에 새로운 사람이 들어오게 되면 내 화면에 방금들어온 유저의 video를 보여줌.
  });

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (videoStream) => {
    addVideoStream(video, videoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.appendChild(video);
};

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
  //user가 방을 나간다면 peers에 있었던 사람인지 확인해 있다면 해당 call을 종료한다.
});

const peer = new Peer(undefined, {
  host: "/",
  port: 3001,
});
//peerjs는 webrtc p2p library인데, peerjs --port 3001   을 통해서 서버를 새로 열어주고
//위 처럼 peer를 새로 만들어줘서 undefined자리가 id자리인데 undefinde를 주게 되면 자동으로 id를 준다.
//그 다음은 options자리로서 아까 연결한 port인 3001과 host주소를 입력.
//peer의 id는 브라우저가 redirect될 때마다 해당 id의 연결을 끊고 새로운 id를 부여해서 연결

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  //해당 방 번호와 유저정보를 보냄
  //peer를 통해서 오는 id값을 socket의 3번째 인자로 들임.
});
