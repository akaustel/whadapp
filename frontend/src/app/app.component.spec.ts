import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { MatIcon, MatIconModule } from '@angular/material';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RpcService } from './rpc.service';
import { WishRpcService } from './wish/wish-rpc.service';
import { TextSelectionService } from './services/text-selection.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
      ],
      imports: [
        RouterModule.forRoot(
          [],
          // { enableTracing: true } // <-- debugging purposes only
        ),
        BrowserModule,
        BrowserAnimationsModule,
        MatIconModule,
      ],
      providers: [RpcService, WishRpcService, TextSelectionService],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Reason'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Reason');
  });
});
