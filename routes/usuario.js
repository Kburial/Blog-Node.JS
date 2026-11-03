import express from "express";
import Usuarios from "../models/Usuario.js";
import bcrypt from "bcryptjs";
import passport from "passport";
import LocalStrategy from "passport-local";

const router = express.Router();

router.get("/registro", (req, res) => {
    res.render("usuarios/registro");
});

router.post("/registro", (req, res) => {
    var erros = [];

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome inválido" });
    }

    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({ texto: "Email inválido" });
    }

    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ texto: "Senha inválida" });
    }

    if (req.body.senha != req.body.senha2) {
        erros.push({ texto: "As senhas não coincidem" });
    }

    if (req.body.senha && req.body.senha.length < 4) {
        erros.push({ texto: "Senha muito curta" });
    }

    if (erros.length > 0) {
        res.render("usuarios/registro", { erros: erros });
        return;
    }

    Usuarios.findOne({ email: req.body.email })
        .lean()
        .then((usuario) => {

            if (usuario) {
                req.flash(
                    "error_msg",
                    "Já existe uma conta com este e-mail no nosso sistema de usuários"
                );

                res.redirect("/usuarios/registro");

            } else {

                const novoUsuario = new Usuarios({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha
                });

                bcrypt.genSalt(10, (erro, salt) => {

                    if (erro) {
                        req.flash(
                            "error_msg",
                            "Houve um erro durante o salvamento do usuário"
                        );
                        return res.redirect("/");
                    }

                    bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {

                        if (erro) {
                            req.flash(
                                "error_msg",
                                "Houve um erro durante o salvamento do usuário"
                            );
                            return res.redirect("/");
                        }

                        novoUsuario.senha = hash;

                        novoUsuario.save()
                            .then(() => {
                                req.flash(
                                    "success_msg",
                                    "Usuário criado com sucesso"
                                );

                                res.redirect("/");
                            })
                            .catch((err) => {
                                req.flash(
                                    "error_msg",
                                    "Houve um erro ao criar o usuário, tente novamente"
                                );

                                res.redirect("/usuarios/registro");
                            });
                    });
                });
            }

        })
        .catch((err) => {
            req.flash("error_msg", "Houve um erro interno");
            res.redirect("/");
        });
});

router.get("/login", (req, res) => {
    res.render("usuarios/login");
})

router.post("/login", (req, res, next) => {

    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/usuarios/login",
        failureFlash: true
    })(req, res, next);

})


router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash("success_msg", "Deslogado com sucesso");
        res.redirect("/");
    });
});


export default router;