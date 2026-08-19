import type { Order, Product, Tenant } from "../types";

export const products: Product[] = [
  {id:1,name:"Organic Tomatoes",farmer:"Rajesh Kumar",farm:"Green Valley Farm",location:"Chennai",rating:4.8,price:48,unit:"kg",organic:true,category:"Vegetables",stock:25,image:"https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=85"},
  {id:2,name:"Farm Fresh Spinach",farmer:"Priya Devi",farm:"Fresh Fields Farm",location:"Coimbatore",rating:4.9,price:32,unit:"bundle",organic:true,category:"Vegetables",stock:18,image:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=85"},
  {id:3,name:"Alphonso Mangoes",farmer:"Arjun Kumar",farm:"Sunrise Organics",location:"Madurai",rating:4.7,price:180,unit:"kg",organic:false,category:"Fruits",stock:40,image:"https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=85"},
  {id:4,name:"A2 Fresh Milk",farmer:"Meena Selvam",farm:"Meadow Dairy",location:"Salem",rating:4.9,price:72,unit:"litre",organic:false,category:"Dairy",stock:30,image:"https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=85"},
  {id:5,name:"Free Range Eggs",farmer:"Karthik Raja",farm:"Happy Hen Farm",location:"Chennai",rating:4.8,price:96,unit:"6 pcs",organic:true,category:"Eggs",stock:45,image:"https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=800&q=85"},
  {id:6,name:"Organic Brown Rice",farmer:"Lakshmi Mani",farm:"Kaveri Fields",location:"Tiruchirappalli",rating:4.6,price:110,unit:"kg",organic:true,category:"Grains",stock:60,image:"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85"},
];
export const orders: Order[] = [
  {id:"#FH10248",customer:"Ajay Sharma",product:"Tomatoes, Spinach",amount:342,status:"Preparing",date:"19 Aug 2026"},
  {id:"#FH10247",customer:"Nisha Patel",product:"A2 Milk × 2",amount:168,status:"Accepted",date:"19 Aug 2026"},
  {id:"#FH10241",customer:"Ravi Menon",product:"Brown Rice × 3",amount:360,status:"Ready",date:"18 Aug 2026"},
  {id:"#FH10239",customer:"Sara Khan",product:"Mangoes × 2",amount:392,status:"Completed",date:"18 Aug 2026"},
];
export const tenants: Tenant[] = [
  {id:"GREEN_VALLEY",name:"Green Valley Farmers",initials:"GV",farmers:84,customers:2860,orders:1240,revenue:"₹8.4L",status:"Active"},
  {id:"CHENNAI_ORGANIC",name:"Chennai Organic Collective",initials:"CO",farmers:62,customers:1940,orders:895,revenue:"₹6.1L",status:"Active"},
  {id:"FRESH_VILLAGE",name:"Fresh Village Farms",initials:"FV",farmers:41,customers:1180,orders:572,revenue:"₹3.8L",status:"Paused"},
];
