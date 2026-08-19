export type Role = "customer" | "farmer" | "admin";
export type Product = { id:number; name:string; farmer:string; farm:string; location:string; rating:number; price:number; unit:string; organic:boolean; category:string; image:string; stock:number };
export type OrderStatus = "New" | "Accepted" | "Preparing" | "Ready" | "Completed";
export type Order = { id:string; customer:string; product:string; amount:number; status:OrderStatus; date:string };
export type Tenant = { id:string; name:string; initials:string; farmers:number; customers:number; orders:number; revenue:string; status:"Active"|"Paused" };
