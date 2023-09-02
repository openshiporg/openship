import { validate as validateUUID } from "uuid";


export const idValidators = {
  uuid: validateUUID,
  cuid(value) {
    return value.startsWith("c");
  },
  autoincrement(value) {
    return /^\d+$/.test(value);
  },
};
