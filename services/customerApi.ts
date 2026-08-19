import { products } from "../mock-data";
export const customerApi = {
  baseUrl: "/api/customer",
  getProducts: async () => Promise.resolve(products),
  getProduct: async (id:number) => Promise.resolve(products.find((item) => item.id === id)),
  addToCart: async (productId:number) => Promise.resolve({productId, success:true}),
  createOrder: async () => Promise.resolve({orderId:"FH10248", status:"placed"}),
};
