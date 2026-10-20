import "server-only";

import Stripe from "stripe";

let client;

function getStripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

// Created on first use so builds don't require the secret key.
/** @type {Stripe} */
export const stripe = new Proxy(
  {},
  {
    get(_target, prop) {
      const value = getStripe()[prop];
      return typeof value === "function" ? value.bind(getStripe()) : value;
    },
  }
);
