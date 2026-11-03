import express from "express";
import Categoria from "../models/Categoria.js";
import Postagem from "../models/Postagem.js";
import { eAdmin } from "../helpers/eAdmin.js";



const router = express.Router();


// Página inicial do admin
router.get("/", eAdmin, (req, res) => {
    res.render("admin/index");
});


// Página de posts
router.get("/posts", (req, res) => {
    res.send("Página de posts");
});


// Listar categorias
router.get("/categorias", (req, res) => {

    Categoria.find()
        .lean()
        .sort({ date: "desc" })
        .then((categorias) => {

            res.render("admin/categorias", {
                categorias: categorias
            });

        })
        .catch((err) => {

            req.flash("error_msg", "Erro ao listar categorias");
            res.redirect("/admin");

        });

});


// Página para adicionar categoria
router.get("/categorias/add", (req, res) => {
    res.render("admin/addcategorias");
});


// Criar nova categoria
router.post("/categorias/nova", (req, res) => {

    const erros = [];


    // Verificar nome
    if (!req.body.nome || !req.body.nome.trim()) {
        erros.push({
            texto: "Nome inválido"
        });
    }


    // Verificar slug
    if (!req.body.slug || !req.body.slug.trim()) {
        erros.push({
            texto: "Slug inválido"
        });
    }


    // Verificar tamanho do nome
    if (req.body.nome && req.body.nome.trim().length < 2) {
        erros.push({
            texto: "Nome da categoria é muito pequeno"
        });
    }


    // Se houver erros
    if (erros.length > 0) {

        res.render("admin/addcategorias", {
            erros: erros
        });

        return;
    }


    // Criar objeto da categoria
    const novaCategoria = {
        nome: req.body.nome,
        slug: req.body.slug
    };


    // Salvar categoria no MongoDB
    new Categoria(novaCategoria)
        .save()
        .then(() => {

            req.flash(
                "success_msg",
                "Categoria criada com sucesso"
            );

            res.redirect("/admin/categorias");

        })
        .catch((err) => {

            req.flash(
                "error_msg",
                "Houve um erro ao salvar a categoria, tente novamente!"
            );

            res.redirect("/admin");

        });

});


// Página para editar categoria
router.get("/categorias/edit/:id", (req, res) => {

    Categoria.findOne({
        _id: req.params.id
    })
        .then((categoria) => {

            res.render("admin/editcategorias", {
                categoria: categoria
            });

        })
        .catch((err) => {

            req.flash(
                "error_msg",
                "Esta categoria não existe"
            );

            res.redirect("/admin/categorias");

        });

});


// Salvar edição da categoria
router.post("/categorias/edit", (req, res) => {

    Categoria.findOne({
        _id: req.body.id
    })
        .then((categoria) => {

            categoria.nome = req.body.nome;
            categoria.slug = req.body.slug;


            categoria.save()
                .then(() => {

                    req.flash(
                        "success_msg",
                        "Categoria editada com sucesso!"
                    );

                    res.redirect("/admin/categorias");

                })
                .catch((err) => {

                    req.flash(
                        "error_msg",
                        "Houve um erro interno ao salvar a edição da categoria"
                    );

                    res.redirect("/admin/categorias");

                });

        })
        .catch((err) => {

            req.flash(
                "error_msg",
                "Houve um erro ao editar a categoria"
            );

            res.redirect("/admin/categorias");

        });

});


// Deletar categoria
router.post("/categorias/deletar", (req, res) => {

    Categoria.deleteOne({
        _id: req.body.id
    })
        .then(() => {

            req.flash(
                "success_msg",
                "Categoria deletada com sucesso!"
            );

            res.redirect("/admin/categorias");

        })
        .catch((err) => {

            req.flash(
                "error_msg",
                "Houve um erro ao deletar a categoria"
            );

            res.redirect("/admin/categorias");

        });

});

router.get("/postagens", (req, res) => {

    Postagem.find().lean().populate("categoria").sort({data:"desc"}).then((postagens) => {
        res.render("admin/postagens", {postagens: postagens})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as postagens")
        res.redirect("/admin")
    })

})

router.get("/postagens/add", (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagem", {categorias: categorias})
    }).catch((err) => { 
        req.flash("error_msg", "Houve um erro ao carregar o formulário")
        res.redirect("/admin")
  })
})

router.post("/postagens/nova", (req, res) => {

    var erros = []

    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria inválida, registre um categoria"})
    }

    if(erros.length > 0){
        res.render("admin/addpostagem", {erros: erros})
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }

        new Postagem(novaPostagem).save().then(() => {
            req.flash("success_msg", "Postagem criada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro durante o salvamento da postagem")
            res.redirect("/admin/postagens")
        })
    }
})

router.get("/postagens/edit/:id", (req, res) => {
    
    Postagem.findOne({_id: req.params.id}).lean().then((postagem) => {
	
        Categoria.find().lean().then((categorias) => {
            res.render("admin/editpostagens", {categorias: categorias, postagem: postagem})

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin/postagens")
        })
    
    
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário de edição")
        res.redirect("/admin/postagens")
    })    
    
})

router.post("/postagens/edit", (req, res) => {
    
    Postagem.findOne({_id: req.body.id}).then((postagem) => {

        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.flash("success_msg", "Postagem editada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) => {
            req.flash("error_msg", "Erro interno")
            res.redirect("/admin/postagens")
        })
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao salvar a edição")
        res.redirect("/admin/postagens")
    })

    router.get('/postagens/deletar/:id', (req, res) => {
    Postagem.deleteOne({_id: req.params.id}).then(()=> {
        req.flash('success_msg',`Postagem deletada com sucesso`)
        res.redirect('/admin/postagens')
    }).catch((err) => {
        req.flash('error_msg','Houve um erro ao deletar a postagem')
        console.log("Erro ao deletar: ",err)
        res.redirect('/admin/postagens')
    })
 })

})    

export default router;