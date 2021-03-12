## API de E-mails

## Uso

1. Tenha instalado em sua máquina o Redis e configurado o Node.js.
2. Caso não saiba instalar o Redis, você pode colocá-lo para rodar via container com Docker rodando o comando `docker run -d -p 6379:6379 redis` ou instalá-lo seguindo este link: [Redis](https://redis.io/topics/quickstart)
3. Crie um arquivo `.env` seguindo o mesmo conteúdo do arquivo `.env.example`.
4. Preencha os dados faltantes, como MAIL_HOST e etc
5. Sugerimos que use o mailtrap.io para usar localmente e evitar que envie e-mails de teste para outros.
6. Após isso, hora de instalar as dependências, rode o comando: `npm install`
7. Rode o comando `npm run dev:server` e a primeira parte do projeto rodará.
8. Abra outro terminal e em seguida rode o comando `npm run queue`.
9. Pronto, o servidor estará esperando requisições na porta 3333 e a fila de e-mails estará rodando, aguardando e-mails para serem enviados.

## Conceitos

Este projeto pode ser um pouco diferente do que estão habituadas, ele é composto de duas partes. A primeira é o servidor de requisições, que estará esperando receber as requisições via rotas do Express. E a segunda parte é a fila de mensagens, que observa quando uma solicitação de e-mail é registrada e processa, enviando o e-mail.

Em termos técnicos, os dois processos rodarão de forma separada e isolada, isso significa que o processamento de e-mails, que é uma tarefa que demanda um tempo e pode causar um gargalo na aplicação, não influenciará na parte de rotas, que vou chamar aqui de API. Ou seja, a API será apenas para receber as requisições e adicionar a fila de e-mails, que por conseguinte será processada e os e-mails enviados.

Caso ambos projetos fossem um só, poderia ocorrer um atraso na latência da resposta, pois enviar e-mails pode levar alguns segundos, o que poderia afetar o sistema como um todo. Além disso, problemas como e-mails não enviados, falha no envio de e-mails, falha no serviço e etc poderiam ocorrer.

## Arquitetura

O projeto utiliza uma arquitetura um pouco diferente da tradicional MVC.

A pasta `resources/mail` guarda todos os templates de e-mail que serão utilizados, estes são arquivos parecidos com HTML, com a diferença que possuem um formato `.hbs` e fazem uso do conceito de uma `template engine`, com possibilidade de por exemplo, colocar variáveis dinamicamente nos arquivos. Abra um deles e veja que há indicações de duplo `{` seguindo de um nome de variável, seguindo de um fechamento `}`. Por exemplo, no arquivo `confirm_account.hbs`, há um campo `{{ name }}`, quando processado, este campo é substituido pelo nome do usuário.

Dentro da pasta `src` é onde fica todo o código da aplicação. Vamos investigá-lo em detalhes.

### @types

Como estamos fazendo o uso do TypeScript, precisamos que nossas dependências tenham seus tipos declarados e venham com uma declaração deles para facilitar nossa vida. Porém, algumas bibliotecas são feitas puramente em JavaScript e não possuem tipos no repositório `@types/{lib}` do npm. Então precisamos adicionar estes tipos manualmente, criando um arquivo `.d.ts`. O TypeScript cuida de identificar estes arquivos automaticamente e adicionar em sua base de tipos.

### config

Esta pasta fica responsável pelos arquivos de configuração.

### dtos

DTO é um acrônimo para Data Transfer Object, que nada mais é que um padrão de projeto que conceitua um objeto que carrega dados entre camadas de uma aplicação. Aqui, utilizamos ele para passar os dados do usuário dos `controllers` para os `services`.

Como estamos utilizando TypeScript, se faz necessário definirmos um objeto que define os dados do usuário.

### errors

Aqui temos uma classe que define um helper para gerenciar nossos erros, uma classe personalizada que podemos utilizar quando lancamos uma exceção (caso não esteja habituada com este conceito, pesquise por exceções javascript e controle de exceções, mais especificamente `throw new Exception`);

### http

Nesta ficam os arquivos que vocês já conhecem, os controles e as definições de rotas, além do ponto inicial do servidor.

### providers

Providers são os arquivos de terceiros, que são definições de interfaces e implementações dos terceiros (third-parties).

Vamos usar o exemplo de e-mail para entender melhor.

Quando queremos enviar um e-mail temos várias opções. Podemos usar SMTP, POP3, serviços como SendGrid, MailTrap, entre outros. Mas o que todos tem em comum é um método `send`, que recebe dados sobre o e-mail, como destinatário e assunto da mensagem, e envia o e-mail. Sendo assim, seguindo o conceito de polimorfismo, podemos definir uma interface, que chamamos de IMailProvider (note o I no início, para sabermos que é uma interface) e assim quando um terceiro for adicionado ele implementa esta interface e faz sua implementação do método `send`. As implementações estão na subpasta chamada `impl`.

Agora você deve estar se perguntando por que isso é necessário. Não é obrigatório, mas ajuda a deixar nosso software mais abstrato e a desacoplá-lo. Uma coisa interessante a se ter em mente quando estamos desenvolvendo é sempre buscar construir software com alta coesão e baixo acoplamento.

### queue

Aqui fica a parte da fila de mensagens, que será responsável por enviar os e-mails.

Dentro há o arquivo `Queue.ts` e uma pasta `jobs`. O arquivo é responsável por lidar com a fila, inicializando, adicionando e processando as requisições de e-mail. Na pasta jobs fica os tipos de e-mails que podem ser enviados.

Vamos usar como exemplo o job `ConfirmAccountMail`, que lida com o e-mail de confirmação de conta.

Dentro do arquivo `jobs/ConfirmAccountMailJob.ts` note que há dois métodos, um `key` e outro `handle`. O key é um identificador e o handle é o método que irá lidar com o envio de e-mail, chamando o provider de e-mail para enviar, passando seus dados.

Vamos analisar o método handle com detalhes:

```javascript

async handle({ data }: any) {  //definição da função
    const { user, token } = data; //no parâmetro data passamos os dados e extraimos o user e o token

    const URL =
      process.env.CONFIRM_ACCOUNT_URL ||
      'url'; //aqui definimos qual é a URL de confirmação

    const mailProvider = new SMTPProvider(); //aqui instanciamos o provider de SMTP

    //nas linhas a seguir, chamamos o método sendMail do SMTPProvider
    //passamos como parâmetro um objeto que contém o destinatário, o assunto, qual template (aquele da pasta resources) está relacionado e um objeto context, que será passado para o template para fazer a substituição
    //se tiver curiosidade, observe o arquivo confirm_account.hbs, dentro de resources/mail e veja que há duas variáveis, uma {{ name }} e outra {{ link }}, estas serão substituidas por esses valores dentro de context

    await mailProvider.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'Confirme sua conta',
      template: 'confirm_account',
      context: {
        name: user.name,
        link: `${URL}${token}`,
      },
    });
  }
}

```

Sendo assim, todo nossos Jobs terão essa cara: um identificador e um método para fazer o envio de e-mail.
Agora vamos entender o motivo disso ser necessário.

No arquivo `Queue.ts`, que é o responsável por lidar com nossa fila, temos os métodos `init`, `add`, `processQueue` e `handleFailure`. A variável `jobs` que se encontra como constante do código é responsável por referenciar todos os jobs disponíveis. A variável `queues` é um objeto que guarda cada um desses jobs e suas inicializações.

1. `init`: é o método que inicializa e prepara nossa fila.

```javascript

  init(): void { //definição da função
    jobs.forEach(({ key, handle }) => { //vamos iterar cada job que está em nosso array de jobs. Note que aqui estamos desconstruindo uma classe, obtendo nosso método key e nosso método handle
      this.queues[key] = { //aqui estamos definindo uma fila para cada job
        bee: new Bee(key, { //Bee é uma biblioteca que nos ajuda e fornece uma forma de tratar filas no Node e usa o redis como armazenamento
          activateDelayedJobs: true,
          redis: cacheConfig.redis,
        }),
        handle, //definimos como handle a função handle, que será responsável por lidar com a fila
      };
    });
  }

```

2. `add`: criamos uma solicitação de envio de e-mail, dado um job

```javascript

async add(key: string, data: any): Promise<Bee.Job<any>> { //definição da função, passamos a chave e o dado, note que essa chave tem que ser o valor key dos nossos jobs definidos e que estão presentes no array jobs
    return this.queues[key].bee //obtemos a instância bee
      .createJob(data) //criamos um job nela, isso é tratado internamente como uma mensagem que é adicionada na fila e será processada
      .retries(10) //definimos quantas tentativas iremos fazer caso o envio falhe
      .backoff('exponential', 1000) //aqui é uma estratégia de reenvio, definimos como exponencial, nesse caso o reenvio será um segundo após a primeira tentativa, a segunda tentativa será dois segundos após a primeira, a terceira tentativa será quatro segundos e assim em diante (para saber mais pesquise por Exponential Backoff)
      .save();
  }

```

Até agora eu tratei como uma única fila, mas acredito que tenha dado para perceber que para cada tipo de e-mail, uma fila é criada. Como temos um número limitado de tipos de e-mail essa abordagem não cria problema, uma vez que usamos a mesma conexão do Redis. Mas para outros casos, seria interessante rever essa abordagem.

3. `processQueue`: este método processa as filas

```javascript

 processQueue(): void { //definição da função
    jobs.forEach(job => { //para cada job que temos no nosso array de jobs
      const { bee, handle } = this.queues[job.key]; //extraimos nossa função handle e nossa instância bee

      bee
        .on('failed', this.handleFailure) //definimos uma função para tratar os eventos de falha
        .on('retrying', (job, result) => console.log(job, result)) //definimos uma função para tratar os eventos de tentativa de reenvio
        .process(handle); //começamos a processar a fila juntamente com nosso método handle
    });
  }

```

4. `handleFailure`: é apenas um método para emitir um console log das falhas de e-mail, é usado no evento failed, descrito lá em cima

### services

Serviços são objetos que lidam com regras de negócios. Nesse caso aqui, usamos para adicionar os e-mails com seus dados à fila. Cada tipo de e-mail tem um serviço referente.
