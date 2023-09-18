export class User {
  _id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  organization?: string;
  work_field?: string;
  design_exp?: string;
  cur_api_call?: number;
  max_api_call?: number;
  notallowed_api?: boolean;
  accessToken?: string;
  
  constructor(user: {
    _id?: string
    first_name?: string
    last_name?: string
    email?: string
    organization?: string
    work_field?: string
    design_exp?: string
    cur_api_call?: number
    max_api_call?: number
    notallowed_api?: boolean
    accessToken?: string
  }) {
    this._id = user._id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.organization = user.organization;
    this.work_field = user.work_field;
    this.design_exp = user.design_exp;
    this.cur_api_call = user.cur_api_call;
    this.max_api_call = user.max_api_call;
    this.notallowed_api = user.notallowed_api;
    this.accessToken = user.accessToken;
  }
}
