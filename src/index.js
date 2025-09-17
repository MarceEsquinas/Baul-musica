import express from "express";
const app=express();//funcion
app.get("/",(req,res)=>{
    res.send("hola mundo desde el baúl de la música")
}) 
app.listen(3000) 