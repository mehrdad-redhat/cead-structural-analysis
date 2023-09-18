import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {MessageService} from 'primeng/api';
import {ToastSeverity, User} from '../../../../core/models';
import {CentralService} from '../../../../core/services';
import {MSGS} from '../../../../data';
import {UserService} from '../../../user/user.service';

@Component({
             templateUrl: './profile.panel.html',
             styleUrls: ['./profile.panel.scss'],
           })
export class ProfilePanel implements OnInit, AfterViewInit {
  
  workFieldOpt: string[] = [];
  
  designExpOpt: string[] = [];
  @ViewChild('firstfocus')
  firstFocus!: ElementRef;
  user: User = new User({});
  pass= {
    oldPassword:'',
    newPassword:'',
    confirmPass:''
  };
  
  constructor(
      private _centralService: CentralService,
      private _userService: UserService,
      private messageService: MessageService,
  ) {
    this.workFieldOpt = [
      'Electrification Engineer',
      'Civil Engineer',
      'Engineering Management',
      'Construction',
      'Other',
    ];
    this.designExpOpt = [
      'Less than 5 years',
      'Less than 10 years',
      'More than 10 years',
    ];
  }
  
  ngOnInit(): void {
    this._centralService.getCurrentUserStream().subscribe(
        (user) => {
          this.user = user;
        }
    );
    
  }
  
  ngAfterViewInit() {
    this.firstFocus.nativeElement.focus();
  }

// Methods
  edit($event: Event) {
    $event.preventDefault();
    this._userService.editUser(this.user._id, this.user).subscribe(
        () => {
          this.messageService.add({
            severity: ToastSeverity.SUCCESS,
            summary: 'User Edited',
            detail: MSGS.USER.UPDATED,
          });
        },
    );
  }
  
  passChange($event: Event) {
    $event.preventDefault();
    if(this.pass.newPassword===this.pass.confirmPass){
      this._userService.passChange(this.user._id, this.pass.oldPassword,this.pass.newPassword).subscribe(
          () => {
            this.messageService.add({
              severity: ToastSeverity.SUCCESS,
              summary: 'Password Changed',
              detail: MSGS.USER.PASS_CHANGE,
            });
          },
      );
    }else{
      this.messageService.add({
                                severity: ToastSeverity.ERROR,
                                summary: 'Password Confirm',
                                detail: MSGS.AUTH.PASS_REPEAT,
                              });
    }
  }
}
