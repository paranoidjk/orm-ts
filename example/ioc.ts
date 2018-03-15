import { RegisterOptions } from 'power-di';
export { IocContext } from 'power-di';

import { getDecorators } from 'power-di/helper';
const { register } = getDecorators();
export { register };

export { lazyInject } from 'power-di/helper';
