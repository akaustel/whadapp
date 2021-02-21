import { Component, OnInit, ViewChild } from '@angular/core';
import { ReasonService } from './reason.service';
import { NgxStackViewComponent } from 'ngx-stack-view';
import { Store } from '@ngrx/store';
import { setState, State } from 'src/reducers/app.actions';
import { combineLatest, Observable } from 'rxjs';
import { WishRpcService } from './wish/wish-rpc.service';
import { FormControl, Validators } from '@angular/forms';
import { WishState } from 'src/reducers/wish.reducer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild(NgxStackViewComponent, { static: false }) stack: NgxStackViewComponent;

  title = 'Chat';
  depth = 0;

  state: Observable<State>;

  constructor(
    public reason: ReasonService,
    private store: Store<{ state: State, wish: WishState }>,
    public wish: WishRpcService,
  ) {
    this.state = store.select('state');

    this.state.subscribe({
      next: (state) => {
        if (!['init', 'setup', 'ready'].includes(state)) {
          this.store.dispatch(setState({ state: 'init' }));
          return;
        }
      }
    });

    const ready = new Observable(observer => {
      if (wish.readyState) {
        observer.next(true);
        observer.complete();
        return;
      }
      wish.readyCb.push(() => { observer.next(true); observer.complete(); });
    });

    combineLatest([this.state, this.store.select(state => state.wish.identity), ready]).subscribe({
      next: ([state, identity, isReady]) => {
        if (['init', 'setup'].includes(state) && identity) {
          this.store.dispatch(setState({ state: 'ready' }));
        }
        if (['init', 'ready'].includes(state) && !identity) {
          this.store.dispatch(setState({ state: 'setup' }));
        }
      }
    });
  }

  ngOnInit() {}
}
