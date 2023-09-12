import { Injectable, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import AgoraRTM, { RtmChannel, RtmClient } from 'agora-rtm-sdk';
import * as uuid from 'uuid';
import * as environment from '../environment/environment';

const serverConfiguration: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }
  ]
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  localStream!: MediaStream | null;
  remoteStream!: MediaStream | null ;
  peerConnection!: RTCPeerConnection;
  client!: RtmClient;
  channel!: RtmChannel;
  token = '';
  uid = uuid.v4();
  constraints = {
    video: {
      width: { min: 1280, max: 4096 },
      height: { min: 720, max: 2160 } 
    },
    audio: true
  }
  peerConnected = false;

  private setStreamSubject: Subject<{ type: string, stream: MediaStream | null}> = new Subject();
  streamSubject$ = this.setStreamSubject.asObservable();
  
  initializeConnection = async (details: {room: string}) => {
    // Creating Signaling Client
    this.client = AgoraRTM.createInstance(environment.APP_ID);
    // Login the user
    await this.client.login({uid: this.uid, token: this.token})
    // Create a channel
    this.channel = this.client.createChannel(details.room);
    // Join the channel
    await this.channel.join();
    // When other peers join this channel    
    this.channel.on('MemberJoined', this.onMemberJoin)
    // When peer leave
    this.channel.on('MemberLeft', this.onMemberLeft);
    // When peer receive message from other peers
    this.client.on('MessageFromPeer', this.onReceiveMessage);
    // Start Media
    this.startMedia();

    window.onbeforeunload = async (ev) => {
      await this.leaveChannel();
    }
  }

  leaveChannel = async () => {
    await this.stopMedia();
    await this.channel.leave();
    await this.client.logout();
  }

  onMemberJoin = async (memberId: string) => {
    // Create an offer for p2p connection and send to the peer
    await this.createOffer(memberId);
  }

  onMemberLeft = async () => {
    // Setting peer connected at false
    this.peerConnected = false;
  }

  onReceiveMessage = async (msg: any, memberId: string) => {
    const message = JSON.parse(msg.text);
    if(message.type === 'answer') {
      this.peerConnection.setRemoteDescription(message.answer);
      this.peerConnected = true;
    }

    if(message.type === 'offer') {
      this.createAnswer(message.offer, memberId);
      this.peerConnected = true;
    }

    if(message.type === 'candidate') {
      if(this.peerConnection) {
       await this.peerConnection.addIceCandidate(message.candidate);
      }
    }

  }

  createPeerConnection= async (memberId: string) => {
    this.peerConnection = new RTCPeerConnection(serverConfiguration);
    this.remoteStream = new MediaStream();
    this.setStreamSubject.next({ type: 'remotestream', stream: this.remoteStream})

    // Send Local Track over peer connection
    this.localStream?.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track);
    })
    
    // add track from peer to remote stream
    this.peerConnection.ontrack = (ev) => {
      this.remoteStream?.addTrack(ev.track);
    }

    // Printing ice candidate on new candidate arrival
    this.peerConnection.onicecandidate = async (ev) => {
      if(ev.candidate) {
        console.log('Ice Candidate Added: ', ev.candidate);
        await this.client.sendMessageToPeer({text:JSON.stringify({'type': 'candidate', 'candidate': ev.candidate})}, memberId);
      }
    };
  }  

  createOffer = async (memberId: string) => {
    await this.createPeerConnection(memberId);
    const offer = await this.peerConnection.createOffer();
    this.peerConnection.setLocalDescription(offer);
    this.client.sendMessageToPeer({ text: JSON.stringify({ type: 'offer', 'offer': offer }) }, memberId);
  }

  createAnswer = async (offer: any, memberId: string) => {
    await this.createPeerConnection(memberId);
    await this.peerConnection.setRemoteDescription(offer);
    let answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    await this.client.sendMessageToPeer({text:JSON.stringify({'type': 'answer', 'answer': answer})}, memberId);
  }

  addAnswer = async (answer: any) => {
    if(!this.peerConnection.currentRemoteDescription) {
        this.peerConnection.setRemoteDescription(answer);
    }
  }

  startMedia = async () => {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(this.constraints);
      this.setStreamSubject.next({ type: 'localstream', stream: this.localStream });  
    } catch(error) {
      console.log(`Unable to connect to media devices: ${error}`);
    }
  }

  stopMedia = async () => {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.setStreamSubject.next({ type: 'localstream', stream: this.localStream });
    }
  }

  handleToggle = async (type: 'camera' | 'mic') => {
    if(type === 'camera' && this.localStream) {
      const videoTrack = this.localStream?.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
    } else if(type === 'mic' && this.localStream) {
      const audioTrack = this.localStream?.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
    }
  }

  get isCameraOn() {
    return !!this.localStream?.getVideoTracks()?.[0]?.enabled
  }

  get isMicOn() {
    return !!this.localStream?.getAudioTracks()?.[0]?.enabled
  }

  disconnectCall = async () => {
    await this.leaveChannel();
  }
}
