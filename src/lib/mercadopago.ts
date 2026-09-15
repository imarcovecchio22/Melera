import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta la variable de entorno MP_ACCESS_TOKEN");
  }
  return new MercadoPagoConfig({ accessToken });
}

export function getPreferenceClient() {
  return new Preference(getClient());
}

export function getPaymentClient() {
  return new Payment(getClient());
}
