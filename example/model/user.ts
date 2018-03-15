import { BaseModel } from '../../lib';

export class UserModel extends BaseModel {
  id: number;

  // @valid([
  //   { minLength: 10 },
  //   { custom: (str: string) => true, errorMsg: 'xxx' }
  // ])
  username: string;
}
