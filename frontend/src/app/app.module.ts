import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RpcService } from './rpc.service';
import { TimeagoModule } from 'ngx-timeago';
import { DebugComponent } from './debug/debug.component';
import { WishRpcService } from './wish/wish-rpc.service';
import { NgxStackViewModule } from 'ngx-stack-view';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { ChatComponent } from './chat/chat.component';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { wishReducer, WishState } from '../reducers/wish.reducer';
import { messageReducer } from 'src/reducers/message.reducer';
import { hydrationMetaReducer } from '../reducers/hydration.reducer';
import { Message } from 'src/reducers/message.actions';
import { appReducer } from 'src/reducers/app.reducers';
import { State } from 'src/reducers/app.actions';
import { A11yModule } from '@angular/cdk/a11y';
import { CreateIdentityComponent } from './create-identity/create-identity.component';
import { MatIconModule } from '@angular/material/icon';
import { ImageUploadComponent } from './image-upload/image-upload.component';
import { DragFileDirective } from './drag-file.directive';

const appRoutes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'debug', component: DebugComponent },
  { path: 'chat', component: ChatComponent },
];

export interface RootState {
  messages: Message[];
  wish: WishState;
  state: State;
}

@NgModule({
  declarations: [
    AppComponent,
    DebugComponent,
    ChatComponent,
    CreateIdentityComponent,
    ImageUploadComponent,
    DragFileDirective,
  ],
  exports: [
  ],
  imports: [
    A11yModule,
    RouterModule.forRoot(
      appRoutes,
      // { enableTracing: true } // <-- debugging purposes only
    ),
    BrowserModule,
    StoreModule.forRoot({
      state: appReducer,
      messages: messageReducer,
      wish: wishReducer,
    }, {
      runtimeChecks: {
        // strictActionImmutability: false,
        // strictStateSerializability: false,
      },
      metaReducers: [
        // hydrationMetaReducer
      ]
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: false, // Restrict extension to log-only mode (set to environment.production)
    }),
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatBadgeModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatTabsModule,
    ReactiveFormsModule,
    NgxStackViewModule,
    TimeagoModule.forRoot()
  ],
  providers: [RpcService, WishRpcService],
  entryComponents: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
