## Sistema de envio de Notificações

### requisitos:

- docker

### Como rodar:

1.
```bash
git clone git@github.com:mjrdev/notifications-async-back.git
```

2.
```bash
cd notifications-async-back
```

3. copia .env.example
```bash
cp .env.example .env
```

4.
```bash
docker compose up -d --build
```