import express from "express";
import cors from "cors";
import { and, eq } from "drizzle-orm";
import {ENV} from "./config/env.js";
import {db} from "./config/db.js";
import { favoritesTable } from "./db/schema.js";

/* 创建express应用实例来定义路由，启动服务器，注册中间件 */
const app=express();
const PORT=ENV.PORT;

// CORS safety net: ensure web preflight (OPTIONS) always returns CORS headers.
// This helps when deploying to platforms like Render and developing from `http://localhost:8081`.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        req.headers["access-control-request-headers"] || "Content-Type,Authorization"
    );
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

const corsOptions = {
    origin: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
/* 告诉服务器，可以接受json格式的请求体 */
app.use(express.json());

app.get("/api/health",(req,res)=>{
    res.status(200).json({success:true});
});

// Proxy TheMealDB for web builds (avoids browser CORS restrictions)
app.use("/api/mealdb", async (req, res, next) => {
    if (req.method !== "GET") return next();
    try {
        const upstreamPath = req.path.replace(/^\//, "");
        const upstreamUrl = new URL(`https://www.themealdb.com/api/json/v1/1/${upstreamPath}`);
        for (const [key, value] of Object.entries(req.query)) {
            if (value === undefined) continue;
            upstreamUrl.searchParams.set(key, String(value));
        }

        const upstreamRes = await fetch(upstreamUrl, {
            headers: { accept: "application/json" },
        });

        const body = await upstreamRes.text();
        const headers = upstreamRes?.headers;
        const contentType =
            typeof headers?.get === "function"
                ? headers.get("content-type")
                : headers?.["content-type"] ?? headers?.["Content-Type"];
        if (!contentType && ENV.NODE_ENV !== "production") {
            console.warn("MealDB proxy: upstream response missing content-type header", {
                hasHeaders: Boolean(headers),
                headersType: typeof headers,
                hasHeadersGet: typeof headers?.get === "function",
            });
        }
        if (contentType) res.setHeader("content-type", contentType);

        res.status(upstreamRes.status).send(body);
    } catch (error) {
        console.error("MealDB proxy error:", error);
        const isProd = ENV.NODE_ENV === "production";
        res.status(502).json({
            error: "Failed to fetch MealDB",
            ...(isProd
                ? null
                : {
                      message: error?.message,
                      cause: error?.cause?.message ?? String(error?.cause ?? ""),
                  }),
        });
    }
});

app.post("/api/favorites",async(req,res)=>{
    try {
        const {userId,recipeId,title,image,cookTime,servings}=req.body;

        if(!userId||!recipeId||!title){
            return res.status(400).json({error:"Missing required fields"});
        }

        const newFavorite=await db.insert(favoritesTable).values({
            userId,
            recipeId,
            title, 
            image,
            cookTime,
            servings,
        }).returning();

        res.status(201).json(newFavorite[0]);
        
    } catch (error) {
        console.error("Error adding favorite:",error);
        res.status(500).json({error:"Something went wrong"});
    }
})

app.get("/api/favorites/:userId",async(req,res)=>{
    try {
        const {userId}=req.params;
        const userFavorites=await db.select().from(favoritesTable).where(
            eq(favoritesTable.userId,userId)
        )
        res.json(userFavorites);
        
    } catch (error) {
        console.error("Error fetching user favorites:",error);
        res.status(500).json({error:"Something went wrong"});
    }
})

app.delete("/api/favorites/:userId/:recipeId", async(req,res)=>{
    try {
        const {userId,recipeId}=req.params;
        const parsedRecipeId = Number.parseInt(recipeId, 10);

        if (!userId || Number.isNaN(parsedRecipeId)) {
            return res.status(400).json({ error: "Invalid userId or recipeId" });
        }

        await db.delete(favoritesTable).where(
            and(eq(favoritesTable.userId,userId),eq(favoritesTable.recipeId,parsedRecipeId))
        );
        res.status(200).json({message:"Favorite removed successfully"});
    } catch (error) {
        console.error("Error removing a favorite:",error);
        res.status(500).json({error:"Something went wrong"});
        
    }
})

app.listen(PORT,()=>{
    console.log("Sever is running on PORT:",PORT);
});
