export const handler = async (event: any) => {
  console.log("Processing payment for:", event.orderId);
  // Mock payment
  return { ...event, payment: "success" };
};
