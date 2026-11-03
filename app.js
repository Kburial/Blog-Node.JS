import express from "express";
import { engine } from "express-handlebars";
import bodyParser from "body-parser";
import path from "path";
import admin from "./routes/admin.js";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import session from "express-session";
import flash from "connect-flash";
import Postagem from "./models/Postagem.js";
import Categoria from "./models/Categoria.js";
import usuarios from "./routes/usuario.js";
import passport from 'passport';
import auth from './config/auth.js'
auth(passport);




const Categorias = mongoose.model("categorias");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// Sessão
    app.use(session({
        secret: "cursodenode",
        resave: true,
        saveUninitialized: true
    }))

    app.use(passport.initialize())
    app.use(passport.session())
    app.use(flash())

    
// Midleware
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash("success_msg")
        res.locals.error_msg = req.flash("error_msg")
        res.locals.error = req.flash("error")
        res.locals.user = req.user || null;
        next()
    })    
// Body Parser
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

// Handlebars
    app.engine("handlebars", engine({ defaultLayout: "main" }));
    app.set("view engine", "handlebars");
// Mongoose
    mongoose.Promise = global.Promise; 
    mongoose.connect("mongodb://localhost/blogapp").then(() => {
        console.log("Conectado ao mongo")
    }).catch((err) => {
        console.log("Erro ao se conectar: "+err)
    })
// Public
    app.use(express.static(path.join(__dirname,"public")))

    app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Rotas
    app.get("/", (req, res) => {

    Postagem.find()
        .lean()
        .populate("categoria")
        .sort({ data: "desc" })
        .then((postagens) => {
            res.render("index", { postagens: postagens });
        })
        .catch((err) => {
            req.flash("error_msg", "Houve um erro interno");
            res.redirect("/404");
        });

});

    app.get("/postagem/:slug",(req,res)=>{
      Postagem.findOne({slug:req.params.slug}).lean().then((postagem)=>{
        if(postagem){
          res.render("postagem/index",{postagem:postagem})
        }else{
            req.flash("error_msg","Esta Postagem não existe")
            res.redirect("/")
        }
      }).catch((err)=>{
        req.flash("error_msg","Houve um error interno")
        res.redirect("/")
      })
     })

    app.get("/categorias", (req, res) => {
        Categorias.find().lean().then((categorias)=> {
         res.render("categorias/index", {categorias: categorias})
    }).catch((err)=> {
        req.flash("error_msg","Houve um erro interno")
        res.redirect("/")
    })
}) 

    app.get("/categorias/:slug", (req, res) => {  
        Categoria.findOne({ slug: req.params.slug }).lean().then((categoria) => {

            if (categoria) {
                Postagem.find({ categoria: categoria._id }).lean().then((postagens) => {
                    res.render("categorias/postagens", { postagens: postagens, categoria: categoria });
                });
                
            } else {
                req.flash("error_msg", "Esta categoria não existe");
                res.redirect("/");
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar a página desta categoria");
            res.redirect("/");
        });
    });


    app.get("/404", (req, res) => {
        res.send("Erro 404!")
    })
    
    app.get('/posts', (req, res) => {
        res.send("Lista Posts")
    })

    app.use("/admin", admin);
    app.use("/usuarios", usuarios)

// Outros
    const PORT = 8081;

app.listen(PORT, () => {
    console.log("Servidor rodando!");
});