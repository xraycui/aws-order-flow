export const handler = async (event: any) => {
  console.log("Validating order:", event);
  if (!event.customer || !event.items) {
    throw new Error("Invalid order");
  }
  return { ...event, validated: true };
};
