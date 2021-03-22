import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReasonService } from '../reason.service';

const defaultMessage = '';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
  message = new FormControl(defaultMessage);
  attachment: string;

  constructor(
    public reason: ReasonService
  ) { }

  send() {
    const message = String(this.message.value).trim();

    if (!message) {
      return;
    }

    this.reason.broadcast(message, this.attachment);
    this.message.reset(defaultMessage);
  }

  setAttachment(hash: string) {
    this.attachment = hash;
  }
}
