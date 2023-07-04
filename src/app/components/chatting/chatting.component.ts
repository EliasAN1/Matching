import { Component, HostListener } from '@angular/core';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

interface ChatDict {
  loggedUser: string;
  chattingWithUser: string;
  messages: string[][];
  image: string;
  lastMsg: string;
  lastMsgByWho: string;
  lastMsgTime: string;
  totalUnreadMessages: number;
}

@Component({
  selector: 'app-chatting',
  templateUrl: './chatting.component.html',
  styleUrls: ['./chatting.component.css'],
})
export class ChattingComponent {
  chats: ChatDict[] = [];
  usersAlreadyRendered: string[] = [];
  show: Boolean = false;
  loggedUser: string = '';
  currentChat: ChatDict = {
    loggedUser: '',
    chattingWithUser: '',
    messages: [],
    image: 'https://i.imgur.com/tdi3NGa.png',
    lastMsg: '',
    lastMsgByWho: '',
    lastMsgTime: '',
    totalUnreadMessages: 0,
  };
  messageInput: string = '';
  updateCountDown: number = 10;
  isPhone: boolean = false;
  state: string = 'chats';
  lastActivity: moment.Moment = moment();
  private updateInterval: any;
  private countInterval: any;
  private loginStatusSubscription!: Subscription;

  constructor(
    private servercomm: ServercommService,
    private router: Router,
    private alertcom: CustomAlertComponent
  ) {}

  async ngOnInit() {
    this.isPhone = window.innerWidth < 768;
    if (this.isPhone) {
      console.log(this.isPhone, this.state);
    }
    this.servercomm
      .chat()
      .then((response) => {
        response = response['message'];
        if (response == 'Your session has ended please login again!') {
          this.router.navigate(['/login']);
          this.alertcom.updateAlert('danger', response, 5000);
          this.servercomm.checkLoggedInStatus();
        } else {
          response.forEach((Bigchat: any[]) => {
            let unread = 0;
            Bigchat[2].reverse().every((message: string[]) => {
              if (message[2] == Bigchat[1] && message[3] == 'false') {
                unread += 1;
                return true;
              } else {
                return false;
              }
            });
            try {
              const chat: ChatDict = {
                loggedUser: Bigchat[0],
                chattingWithUser: Bigchat[1],
                messages: Bigchat[2],
                image: Bigchat[3],
                lastMsg: Bigchat[2].at(0)[0],
                lastMsgByWho: Bigchat[2].at(0)[2],
                lastMsgTime: Bigchat[2].at(0)[1],
                totalUnreadMessages: unread,
              };

              this.chats.push(chat);
              Bigchat[1] == this.router.url.split('/chat/')[1]
                ? this.openConvesation(chat)
                : '';
            } catch {
              const chat: ChatDict = {
                loggedUser: Bigchat[0],
                chattingWithUser: Bigchat[1],
                messages: [],
                image: Bigchat[3],
                lastMsg: '',
                lastMsgByWho: '',
                lastMsgTime: '',
                totalUnreadMessages: 0,
              };
              this.chats.push(chat);
              Bigchat[1] == this.router.url.split('/chat/')[1]
                ? this.openConvesation(chat)
                : '';
            }
          });
          this.sortChats();
        }
      })
      .catch((err) => {
        this.alertcom.updateAlert('danger', 'Unknown error occured', 5000);
      });

    this.updateInterval = setInterval(() => {
      this.updatingChat();
    }, 10000);
    this.countInterval = setInterval(() => {
      this.updateCountDown -= 1;
    }, 1000);
    this.loginStatusSubscription = this.servercomm
      .getLoggedInStatusasObservable()
      .subscribe((value) => {
        this.loggedUser = value[1];
      });
  }

  ngOnDestroy() {
    if (this.loginStatusSubscription) {
      this.loginStatusSubscription.unsubscribe();
    }
    clearInterval(this.updateInterval);
    clearInterval(this.countInterval);
  }

  updatingChat() {
    this.updateCountDown = 10;
    this.servercomm.updateChat().then((response) => {
      response = response['message'];
      console.log(response);

      if (response == 'Your session has ended please login again!') {
        this.router.navigate(['/login']);
        this.alertcom.updateAlert('danger', response, 5000);
        this.servercomm.checkLoggedInStatus();
      } else if (response instanceof Array) {
        response.forEach((newChat) => {
          let unread = 0;
          newChat[2].reverse();
          newChat[2].every((message: string[]) => {
            if (message[2] == newChat[1] && message[3] == 'false') {
              unread += 1;
              return true;
            } else return false;
          });
          this.chats.every((oldChat) => {
            if (oldChat.chattingWithUser == newChat[1]) {
              oldChat.messages = newChat[2];
              oldChat.lastMsg = newChat[2].at(0)[0];
              oldChat.lastMsgByWho = newChat[2].at(0)[2];
              oldChat.lastMsgTime = newChat[2].at(0)[1];
              oldChat.totalUnreadMessages = unread;
              return false;
            } else return true;
          });
        });
        this.sortChats();
      }
    });

    // Making sure that after 10 minutes of inactivity we stop updating
    let time = moment(this.lastActivity).fromNow();
    if (time == '10 minutes ago') {
      this.alertcom.updateAlert(
        'safe',
        'We see that are not intreacting with this chat, so we stopped updating it, please refresh the page.',
        Infinity
      );
      clearInterval(this.updateInterval);
      clearInterval(this.countInterval);
    }
    //
  }

  openConvesation(chat: ChatDict) {
    if (this.isPhone) {
      this.state = 'chat';
    }
    this.navigate('/chat/' + chat.chattingWithUser);
    this.currentChat = chat;
    if (this.currentChat.totalUnreadMessages > 0) {
      this.servercomm.seen(this.currentChat.chattingWithUser).catch((error) => {
        this.alertcom.updateAlert(
          'danger',
          'Error occured trying to update the chat, please refresh.',
          5000
        );
      });
      setTimeout(() => {
        this.currentChat.totalUnreadMessages = 0;
      }, 1000);
    }
  }

  navigate(url: string) {
    this.router.navigate([url]);
  }

  @HostListener('document:keyup.enter')
  sendMsg() {
    if (this.messageInput.length == 0 || !this.currentChat.chattingWithUser) {
      return;
    }
    console.log('reached');

    const now = moment();
    this.lastActivity = now;

    const date = now.format('DD/MM/YYYY HH:mm:ss');

    this.servercomm
      .sendMsg(this.messageInput, this.currentChat.chattingWithUser)
      .then((response) => {
        response = response['message'];
        console.log(response);

        if (response == 'Your session has ended please login again!') {
          this.router.navigate(['/login']);
          this.alertcom.updateAlert('danger', response, 5000);
          this.servercomm.checkLoggedInStatus();
        } else if (response == 'Message send successfully') {
          this.chats.every((chat) => {
            if (chat.chattingWithUser == this.currentChat.chattingWithUser) {
              chat.lastMsgTime = String(date);
              chat.lastMsgByWho = chat.loggedUser;
              chat.lastMsg = this.messageInput;
              chat.messages.unshift([
                this.messageInput,
                String(date),
                this.loggedUser,
                'true',
              ]);
              return false;
            }
            return true;
          });
          this.sortChats();
          this.messageInput = '';
        } else if (response == 'You are no longer friend with this user') {
          this.alertcom.updateAlert('danger', response, 5000);
        }
      });
  }

  sortChats() {
    this.chats = this.chats.sort((a: ChatDict, b: ChatDict) => {
      const beta = moment(b.lastMsgTime, 'DD/MM/YYYY HH:mm:ss');
      const alpha = moment(a.lastMsgTime, 'DD/MM/YYYY HH:mm:ss');

      if (alpha.isValid() && beta.isValid()) {
        return beta.diff(alpha);
      }
      if (alpha.isValid()) {
        return -1; // Move invalid beta to the end
      }
      if (beta.isValid()) {
        return 1; // Move invalid alpha to the end
      }
      return 0; // Both alpha and beta are invalid, maintain the current order
    });
  }

  // Phone functionallity ------------------------------------------------------------------------------------------

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any): void {
    this.isPhone = window.innerWidth < 768;
    console.log(this.isPhone);
  }

  switchState() {
    this.state = 'chats';
    this.currentChat = {
      loggedUser: '',
      chattingWithUser: '',
      messages: [],
      image: 'https://i.imgur.com/tdi3NGa.png',
      lastMsg: '',
      lastMsgByWho: '',
      lastMsgTime: '',
      totalUnreadMessages: 0,
    };
  }
}
