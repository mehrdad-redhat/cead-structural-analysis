import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {ToastSeverity, User} from '../../../../core/models';
import {MSGS} from '../../../../data';
import {UserService} from '../../user.service';

@Component({
             selector: 'c-signup',
             templateUrl: './signup.component.html',
             styleUrls: ['../../user.page.scss', './signup.component.scss'],
           })
export class SignupComponent implements OnInit, AfterViewInit {
  workFieldOpt: string[] = [];
  
  designExpOpt: string[] = [];
  @ViewChild('firstfocus')
  firstFocus!: ElementRef;
  newUser: User = new User({});
  password: string;
  confirmPass: string;
  terms: boolean = false;
  
  constructor(
      private messageService: MessageService,
      private _userService: UserService,
      private router: Router,
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
  
  ngOnInit(): void {}
  
  ngAfterViewInit() {
    this.firstFocus.nativeElement.focus();
  }
  
  signup(event) {
    event.preventDefault();
    if (this.terms) {
      if (this.password === this.confirmPass) {
        this._userService.signup(this.newUser, this.password).subscribe(
            () => {
              this.messageService.add({
                                        severity: ToastSeverity.SUCCESS,
                                        summary: 'Successful Application',
                                        detail: MSGS.AUTH.SIGNUP_SUCCESS,
                                        sticky: true,
                                      });
              this.router.navigate(['user', 'login']).then();
            },
        );
      } else {
        this.messageService.add({
                                  severity: ToastSeverity.ERROR,
                                  summary: 'Password Confirm',
                                  detail: MSGS.AUTH.PASS_REPEAT,
                                });
      }
    } else {
      this.messageService.add({
                                severity: ToastSeverity.ERROR,
                                summary: 'Terms',
                                detail: MSGS.AUTH.TERMS,
                              });
    }
  }
}
