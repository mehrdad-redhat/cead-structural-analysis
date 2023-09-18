import {
	AfterViewInit,
	Component,
	ElementRef,
	OnInit,
	ViewChild,
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {ToastSeverity} from '../../../../core/models';
import {MSGS} from '../../../../data';
import {UserService} from '../../user.service';

@Component({
	selector: 'c-login',
	templateUrl: './login.component.html',
	styleUrls: ['../../user.page.scss', './login.component.scss'],
})
export class LoginComponent implements OnInit, AfterViewInit {
	constructor(private _userService: UserService,
	            private router: Router,
	            private route:ActivatedRoute,
	            private messageService:MessageService) {}

	@ViewChild('firstfocus')
	firstFocus!: ElementRef;
	
	email:string;
	pass:string;

	ngOnInit(): void {
		this._userService.logout({loginPage:true});
	}

	ngAfterViewInit() {
		this.firstFocus.nativeElement.focus();
	}

// Methods
	login(event){
		event.preventDefault();
		this._userService.login(this.email,this.pass)
				.subscribe(
				()=>{
					this.messageService.add({
						severity: ToastSeverity.SUCCESS,
						summary: 'Welcome to CEAD',
						detail: MSGS.AUTH.LOGIN_SUCCESS,
					});
					const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
					this.router.navigateByUrl(returnUrl).then();
				}
		)
	}
}
