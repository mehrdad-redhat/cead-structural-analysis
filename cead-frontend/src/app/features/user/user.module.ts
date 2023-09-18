import {HttpClientModule} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { UserService } from './user.service';
import { UserGateway } from './user.gateway';
import { AppRouting } from '../../app.routing';
import { UserPage } from './user.page';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ForgotPassComponent } from './components/forgot-pass/forgot-pass.component';

@NgModule({
	declarations: [
		SignupComponent,
		LoginComponent,
		UserPage,
		ForgotPassComponent,
	],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		AppRouting,
		HttpClientModule,
		ButtonModule,
		RippleModule,
		CheckboxModule,
		InputTextModule,
		PasswordModule,
		DropdownModule,
		RadioButtonModule,
	],
	providers: [UserService, UserGateway],
})
export class UserModule {}
