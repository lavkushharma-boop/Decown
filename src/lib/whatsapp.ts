export const GENERAL_ENQUIRY = "Hi Decown, I would like to know more about your collection.";

export const waLink = (number: string, text: string) =>
  "https://wa.me/" + number.replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
