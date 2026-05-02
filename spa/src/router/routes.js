import { primeraControlador } from '../primeraControlador';
import { segundaControlador } from '../segundaControlador';

import { primera } from '../primera'
import { segunda } from '../segunda'


export const routes = [
  {
    path: "#",

  },
  {
    path: "primera",
    view: primera,
    init: primeraControlador
  },
  {
    path: "segunda",
    view: segunda,
    init: segundaControlador
  }
];