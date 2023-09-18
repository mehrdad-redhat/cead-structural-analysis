import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {UserService} from '../../features/user/user.service';
import {ToastSeverity} from '../models';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
      private _userService: UserService,
      private messageService: MessageService,
      private router: Router,
      private route: ActivatedRoute,
  ) {}

// Methods
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
        catchError(err => {
          const error = err.error.message || 'Something wrong has happened';
          this.messageService.add({
            severity: ToastSeverity.ERROR,
            summary: 'Request Error',
            detail: error,
            sticky: true,
          });

          if (err.status === 401 && this._userService.getCurrentUserValue()) {
            // auto logout if 401 or 403 response returned from api
            this._userService.logout();
          } else if (err.status === 404) {
            this.router.navigate(['5'], {relativeTo: this.route}).then();
          }
          throw error;

        }));
  }
}
