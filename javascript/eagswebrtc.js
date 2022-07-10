"use strict";

/*

This is the backend for voice channels in eaglercraft, it links with TeaVM EaglerAdapter at runtime

Copyright 2022 Calder Young. All rights reserved.

*/

window.initializeVoiceClient = (() => {

    const READYSTATE_NONE = 0;
    const READYSTATE_ABORTED = -1;
    const READYSTATE_DEVICE_INITIALIZED = 1;

    const TASKSTATE_NONE = -1;
    const TASKSTATE_LOADING = 0;
    const TASKSTATE_COMPLETE =1;
    const TASKSTATE_FAILED = 2;

    class EaglercraftVoicePeer {

        constructor(peerId, peerConnection) {
            this.peerId = peerId;
            this.peerConnection = peerConnection;
        }

    }

    class EaglercraftVoiceClient {

        constructor() {
            this.ICEServers = [];
            this.peerList = new Map();
            this.readyState = READYSTATE_NONE;
            this.taskState = TASKSTATE_NONE;
        }

        voiceClientSupported() {
            return typeof window.RTCPeerConnection !== "undefined" && typeof navigator.mediaDevices !== "undefined" &&
                typeof navigator.mediaDevices.getUserMedia !== "undefined";
        }

        addICEServer(url) {
            this.ICEServers.push({ urls: url });
        }

        intitializeDevices() {
            this.taskState = TASKSTATE_LOADING;
            const self = this;
            navigator.mediaDevices.getUserMedia({ "audio": true }).then((stream) => {
                self.localMediaStream = stream;
                var localMediaElement = document.createElement("audio");
                localMediaElement.autoplay = true;
                localMediaElement.muted = true;
                localMediaElement.controls = false;
                localMediaElement.srcObject = stream;
                self.localMedia = localMediaElement;
                self.readyState = READYSTATE_DEVICE_INITIALIZED;
                self.taskState = TASKSTATE_COMPLETE;
            }).catch(() => {
                self.readyState = READYSTATE_ABORTED;
                self.taskState = TASKSTATE_FAILED;
            });
        }

        getTaskState() {
            return this.taskState;
        }

        getReadyState() {
            return this.readyState;
        }

        signalConnect(peerId) {
            const peerConnection = new RTCPeerConnection({ iceServers: this.ICEServers, optional: [ { DtlsSrtpKeyAgreement: true } ] });
            const peerInstance = new EaglercraftVoicePeer(peerId, peerConnection);

            peerConnection.addEventListener("icecandidate", (evt) => {
                if(evt.candidate) {
                    peerInstance.iceCandidate(evt.candidate);
                }
            });

            this.peerList.set(peerId, peerInstance);
        }

    }

    window.constructVoiceClient = () => new EaglercraftVoiceClient();
});

window.startVoiceClient = () => {
    if(typeof window.constructVoiceClient !== "function") {
        window.initializeVoiceClient();
    }
    return window.constructVoiceClient();
};