# Nitrate

O seu diário de cinema: registre os filmes e séries que assistiu, dê notas, escreva reviews, monte listas, traga seu histórico do Letterboxd e descubra o que assistir com quem tem o mesmo gosto. Todo mês, o Nitrate monta uma retrospectiva pronta para compartilhar.

No ar em [nitrate.com.br](https://nitrate.com.br).

Este repositório é o front-end. O back-end (Java 21 e Spring Boot) fica em [nitrate-backend](https://github.com/21lucasbarros/nitrate-backend) e o app para iOS e Android em [nitrate-mobile](https://github.com/21lucasbarros/nitrate-mobile).

## Tecnologias

- Next.js (App Router) e React, com o React Compiler
- TypeScript
- Tailwind CSS
- Motion
- React Hook Form e Zod
- Dados de filmes e séries da API do TMDB, pelo back-end

## Rodando

```bash
bun install
bun dev
```

O site abre em [http://localhost:3000](http://localhost:3000). Ele precisa do back-end rodando; configure o endereço num `.env.local`:

| Variável               | Uso                                                                  |
| ---------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | URL do back-end, ex.: `http://localhost:8080`                        |
| `NEXT_PUBLIC_SITE_URL` | opcional, endereço público do site (SEO e links); padrão `https://nitrate.com.br` |

## Deploy

O site roda numa VPS da Hostinger, num container Docker gerenciado pelo [Coolify](https://coolify.io), na mesma VPS da API ([api.nitrate.com.br](https://api.nitrate.com.br/health)).

O `Dockerfile` instala as dependências com o Bun, roda o `next build` no Node e serve com `next start` na porta `3000`. As variáveis `NEXT_PUBLIC_*` são gravadas no JavaScript durante o build, então `NEXT_PUBLIC_API_URL` entra como argumento do build: mudar o valor exige um build novo.

Para testar a imagem localmente:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 -t nitrate .
docker run -p 3000:3000 nitrate
```
