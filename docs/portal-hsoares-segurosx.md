# Portal H Soares + SegurosX

## Objetivo
Transformar o `site-hsoares` em duas camadas claras:

1. `site público`
- captação
- páginas comerciais
- SEO
- formulários
- área de acesso

2. `portal autenticado`
- admin interno
- imobiliárias
- clientes finais

O `SegurosX` deve ser a fonte principal dos dados de seguro, apólices, propostas, documentos e status operacionais.

## Princípio arquitetural
O `site-hsoares` não deve duplicar o `SegurosX`.

O desenho correto é:

- `SegurosX` = sistema mestre
- `site-hsoares` = front institucional + portal de acesso + camada de sessão, analytics e cache leve

## Perfis de usuário

### 1. Admin interno
Uso da equipe H Soares.

Responsabilidades:
- acompanhar leads
- acompanhar tráfego e conversão
- gerenciar usuários
- acompanhar integração com SegurosX
- consultar carteira e status operacionais

### 2. Imobiliária
Uso de parceiros cadastrados.

Responsabilidades:
- acompanhar análises de Seguro Fiança
- consultar propostas e apólices da própria carteira
- visualizar documentos pendentes
- acessar integrações e links da plataforma parceira

### 3. Cliente final
Uso do segurado individual ou empresarial.

Responsabilidades:
- consultar apólices contratadas pela H Soares
- baixar documentos
- acompanhar status de propostas
- acessar assistência, sinistro e renovação

## Telas por perfil

### Admin
- dashboard executivo
- leads
- usuários
- organizações
- apólices
- propostas
- documentos
- integrações e logs
- configurações

### Imobiliária
- dashboard da imobiliária
- análises em andamento
- propostas
- apólices
- documentos
- histórico por cliente / imóvel
- atalhos da plataforma

### Cliente
- minha conta
- minhas apólices
- minhas propostas
- documentos
- renovação
- assistência e sinistro
- perfil e contatos

## Dados que o SegurosX precisa fornecer

### Identidade e vínculo
- `external_user_id`
- `external_org_id`
- tipo do usuário
- vínculo com imobiliária ou cliente
- status de acesso

### Apólices
- número da apólice
- seguradora
- produto
- status
- vigência inicial
- vigência final
- prêmio
- parcelas
- corretor / origem

### Propostas
- número da proposta
- status
- produto
- seguradora
- etapa atual
- pendências
- data de criação
- data da última atualização

### Documentos
- tipo do documento
- nome do arquivo
- URL segura ou token de download
- data de emissão
- data de expiração, quando existir

### Operação e atendimento
- status de sinistro
- status de assistência
- histórico resumido
- observações operacionais relevantes

## Endpoints mínimos esperados do SegurosX

### Autenticação
- `POST /auth/exchange`
- `POST /auth/refresh`
- `POST /auth/logout`

### Usuário e organização
- `GET /me`
- `GET /organizations/:id`
- `GET /organizations/:id/users`

### Carteira
- `GET /policies`
- `GET /policies/:id`
- `GET /proposals`
- `GET /proposals/:id`
- `GET /documents`
- `GET /documents/:id/download`

### Operação
- `GET /claims`
- `GET /assistances`

### Integração
- `GET /health`
- `GET /integration/status`

## Webhooks desejáveis do SegurosX
- proposta criada
- proposta atualizada
- apólice emitida
- apólice cancelada
- documento disponível
- pendência documental
- renovação próxima

## O que o site-hsoares pode manter localmente
- usuários locais
- sessão
- papéis e permissões
- mapeamento `local_user_id` -> `external_user_id`
- preferências
- analytics
- logs
- cache leve de leitura

Não manter localmente como dado mestre:
- apólice oficial
- proposta oficial
- documento oficial
- status operacional final

## Fases recomendadas

### Fase 1
- consolidar admin atual
- usuários internos
- base de autenticação por papéis

### Fase 2
- portal de imobiliárias
- leitura de análises, propostas e apólices
- documentos da carteira

### Fase 3
- portal de cliente final
- minhas apólices
- documentos
- renovação
- assistência e sinistro

### Fase 4
- notificações
- alertas automáticos
- autosserviço avançado

## Dependências antes de construir
O portal só deve sair do papel depois que o `SegurosX` definir:

- modelo de autenticação
- contrato de API
- estrutura de organizações
- mapeamento cliente / imobiliária / apólice
- estratégia de documentos
- política de permissões

## Decisão recomendada
Construir o portal no `site-hsoares`, mas somente como camada autenticada conectada ao `SegurosX`.

Isso evita:
- duplicidade de dados
- divergência operacional
- retrabalho
- manutenção paralela de carteira
