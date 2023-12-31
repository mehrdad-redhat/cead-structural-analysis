# Cead Backend
It's the back-end side of CEAD. It will connect to an API to solve a problem about equipment and show the results through the web application to the engineer.

## Development server

Run `npm run start:dev` for a dev server. Navigate to `http://localhost:4545/v1`. The server will automatically reload if you change any of the source files.

## Production server

 1. Clone or pull the repository from gitlab

 2. Make a .env file with below template(If the project is not just cloned skip this step)
    - NODE_ENV= "development" or "production"
    - PORT= "Port you want to serve frontend"
    - JWT_KEY= "This is used to sign and verify jwt tokens replace it with your own secret it can be any string"
    - DBNAME= "Name of Mongodb database"
    - DBUSER = "Username of database admin"
    - DBPASS = "Password of database admin"
    - SKYCIV_USERNAME= "Username of Skyciv account"
    - SKYCIV_KEY="Key of Skyciv account"
    - SMTP_USER="" (for mail server)
    - SMTP_PASS="" (for mail server)

 3. If it's first time you want to run the server, or you have changes in database schema run the seed command
    - `npm run seed`,when it printed "All collection's sequence have been initialized and are ready to use." everything is good, otherwise drop these collections and rerun the command.
       - id_sequences
       - sa_structures
       - sa_projects


 4. Run `npm run server` if it's first time, otherwise run `pm2 restart 0`


# CeadFrontend
It's the front-end side of CEAD. It's a single page web application developed with Angular 13.2.6. This project was generated
with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:3535/`. The app will automatically reload if you change
any of the source files.

## Deployment

 - `git pull`
 - `npm install`
 - run `npm run build` to build the UI.
 - run `systemctl restart nginx` to restart the UI server.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also
use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
