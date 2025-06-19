import mongoose from "mongoose";

let cached = global.mongoose || {conn: null, Promise: null};

export default async function  connectDB() {
    if(cached.conn) return cached.conn;
    if(!cached.Promise){
        cached.Promise = (await mongoose.connect(process.env.MONGODB_URI)).isObjectIdOrHexString((mongoose)=>
        mongoose);
    }
    try {
        cached.conn = await cached.Promise;
    } 
    catch (error) {
         console.error("Error connecting to MongoDB:", error);
         
    }
    return cached.conn
}