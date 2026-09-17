import { createClient } from "@pyapy/contracts/client";
let csrf = null;
export const setCsrf = (value) => {
  csrf = value;
};
export const api = createClient({ getCsrf: () => csrf });
