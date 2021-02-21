import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { WishRpcService } from '../wish/wish-rpc.service';

@Component({
  selector: 'app-create-identity',
  templateUrl: './create-identity.component.html',
  styleUrls: ['./create-identity.component.scss']
})
export class CreateIdentityComponent implements OnInit {
  alias = new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(32)]);

  constructor(
    public wish: WishRpcService,
  ) { }

  ngOnInit(): void {
  }

  create(alias: string) {
    console.log('Creating alias', alias);
    this.wish.request('identity.create', [alias]).subscribe();
    this.alias.reset();
  }
}
