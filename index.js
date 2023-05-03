const express = require('express')
const Pool = require('pg').Pool
const dotenv = require('dotenv')
const bodyParser = require('body-parser')

const app = express()

dotenv.config()

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use((req, res, next) => {
    console.log("A data da requisição atual é", new Date())
    //res.send(`A data a requisição atual é: ${ new Date() }`)
    next()
})

app.get("/healt", (req, res) => {
    res.status(200).send("Up!")
})

app.get('/v1/servico/findAll', async (req, res) => {
    let retorno = {}

    try {
        const resposta = await pool.query('SELECT "ServicoId", "Descricao", "Tempo", "Valor" FROM dbo."Servico" ORDER BY "Descricao"')        
        let dados = resposta.rows
        let totalRegistro = resposta.rowCount

        retorno =  MensagemSucesso("Consulta realizada com sucesso!!!", totalRegistro, dados)
    } catch (error) {
        retorno = MensagemError(`Problema na consulta: ${ error }.`)
    }
    
    res.status(200).send(retorno)
})

app.get('/v1/servico/findBydId/:id', async (req, res) => {
    let retorno = {}

    try {
        const resposta = await pool.query('SELECT "ServicoId", "Descricao", "Tempo", "Valor" FROM dbo."Servico" WHERE "ServicoId" = $1 ORDER BY "Descricao";', [req.params.id])            
        let dados = resposta.rows
        let totalRegistro = resposta.rowCount

        retorno =  MensagemSucesso("Consulta realizada com sucesso!!!", totalRegistro, dados)
        console.log(resposta)
    } catch (error) {
        retorno =  MensagemError(`Problema na consulta: ${ error }.`)
    }

    res.status(200).send(retorno)
})

app.post('/v1/servico', async (req, res) => {  
    let retorno = {}
    
    let descricao = req.body.Descricao
    let tempo = req.body.Tempo
    let valor = req.body.Valor
    
    try {        
        let retornoMensagem = ValidarInserirServico(descricao, tempo, valor)

        if (retornoMensagem == "") {    
            const resposta = await pool.query('INSERT INTO dbo."Servico" ( "Descricao", "Tempo", "Valor") VALUES ($1, $2, $3);', 
                                            [descricao, tempo, valor])
            console.log(resposta)
            retorno = MensagemSucesso("Serviço inserido com sucesso!!!", 1, [])
        } else {
            retorno = MensagemError(`Problema ao inserir o serviço: ${ retornoMensagem }.`)
        }
    } catch (error) {
        retorno = MensagemError(`Problema ao inserir: ${ error }.`)
    }

    res.status(200).send(retorno)
})

app.put('/v1/servico', async (req, res) => {        
    let retorno = {}

    let servicoId = req.body.ServicoId
    let descricao = req.body.Descricao
    let tempo = req.body.Tempo
    let valor = req.body.Valor
    
    try {        
        let retornoMensagem = ValidarAlterarServico(servicoId, descricao, tempo, valor)

        if (retornoMensagem == "") { 
            const resposta = await pool.query('UPDATE dbo."Servico" SET "Descricao" = $1, "Tempo" = $2, "Valor" = $3 WHERE "ServicoId" = $4;', 
                                            [descricao, tempo, valor, servicoId])
            console.log(resposta)
            retorno = MensagemSucesso("Serviço alterado com sucesso!!!", 1, [])
        } else {
            retorno = MensagemError(`Problema ao alterar o serviço: ${ retornoMensagem }.`)
        }
    } catch (error) {
        retorno = MensagemError(`Problema ao alterar: ${ error }.`)
    }

    res.status(200).send(retorno)
})

app.delete('/v1/servico', async (req, res) => {      
    let retorno = {}  

    let servicoId = req.body.ServicoId
    
    try {        
        let retornoMensagem = ValidarExcluirServico(servicoId)

        if (retornoMensagem == "") { 
            const resposta = await pool.query('DELETE FROM dbo."Servico" WHERE "ServicoId" = $1;', 
                                            [servicoId])        
            console.log(resposta)
            retorno = MensagemSucesso("Serviço excluído com sucesso!!!", 1, [])
        } else {
            retorno = MensagemError(`Problema ao excluir o serviço: ${ retornoMensagem }.`)
        }
    } catch (error) {
        retorno = MensagemError(`Problema ao excluir: ${ error }.`)
    }

    res.status(200).send(retorno)
})


app.listen(process.env.PORT, () => {
    console.log(`A API está rodando na porta: ${ process.env.PORT }.`)
})

function ValidarInserirServico(descricao, tempo, valor) {
    let retornoMensagem = ""
 
    retornoMensagem += ValidarDescricao(descricao)
    retornoMensagem += ValidarTempo(tempo)
    retornoMensagem += ValidarValor(valor)

    return retornoMensagem;
}

function ValidarAlterarServico(servicoId, descricao, tempo, valor) {
    let retornoMensagem = ""
 
    retornoMensagem += ValidarServicoId(servicoId)
    retornoMensagem += ValidarDescricao(descricao)
    retornoMensagem += ValidarTempo(tempo)
    retornoMensagem += ValidarValor(valor)

    return retornoMensagem;
}

function ValidarExcluirServico(servicoId) {
    let retornoMensagem = ""
 
    retornoMensagem += ValidarServicoId(servicoId)
    
    return retornoMensagem;
}

function ValidarServicoId(servicoId) {
    let retornoMensagem = ""
 
    if (servicoId == undefined || servicoId == 0) {
        servicoId = 0
        retornoMensagem += "O código do serviço não foi informado!"
    }

    return retornoMensagem;
}

function ValidarDescricao(descricao) {
    let retornoMensagem = ""

    if (descricao == undefined || descricao == "") {
        descricao = "" 
        retornoMensagem += "A descrição do serviço não foi informada!"
    }

    return retornoMensagem;
}

function ValidarTempo(tempo) {
    let retornoMensagem = ""

    if (tempo == undefined) {
        tempo = "00:00" 
    }

    return retornoMensagem;
}

function ValidarValor(valor) {
    let retornoMensagem = ""

    if (valor == undefined) {
        valor = 0
    }

    return retornoMensagem;
}

function MensagemSucesso(mensagem, totalRegistro, dados) {
    return MensagemGeral(200, mensagem, totalRegistro, dados)
}

function MensagemError(mensagem) {
    return  MensagemGeral(500, mensagem, 0, [])
}

function MensagemGeral(codigo, mensagem, totalRegistro, dados) {
    let retorno = { "Codigo": codigo, 
                    "Mensagem": mensagem,
                    "TotalRegistros": totalRegistro,
                    "Dados": dados}
    return retorno
}