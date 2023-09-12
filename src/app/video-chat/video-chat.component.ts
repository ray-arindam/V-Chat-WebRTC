import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConnectionService } from '../connection.service';
import { Observable, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.scss']
})
export class VideoChatComponent implements OnInit, AfterViewInit{
  localVideo!: MediaStream | null;
  remoteVideo!: MediaStream | null;
  streamSubject$!: Observable<{ type: string, stream: MediaStream | null }>;

  constructor(
    public connectionService: ConnectionService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngAfterViewInit(): void {
    this.streamSubject$ = this.connectionService.streamSubject$.pipe(
      tap((data) => {
        if(data.type === 'localstream') this.localVideo = data.stream;
        if(data.type === 'remotestream') this.remoteVideo = data.stream;
      })
    )
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const room = params['room'];
      this.connectionService.initializeConnection({ room: room });
    });
  }

  toggleCamera() {
    this.connectionService.handleToggle('camera');
  }

  toggleMic() {
    this.connectionService.handleToggle('mic');
  }

  disconnect() {
    this.connectionService.disconnectCall();
    this.router.navigate(['/']);
  }

  isLocalVideoOn() {
    this.localVideo?.getVideoTracks()[0]?.enabled;
  }

  isRemoteVideoOn() {
    this.remoteVideo?.getVideoTracks()[0]?.enabled;
  }
}
