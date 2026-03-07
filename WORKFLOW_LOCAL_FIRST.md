# Workflow Local-First (H Soares)

## Regra principal
Não publicar no Vercel durante desenvolvimento contínuo.

## Processo obrigatório
1. Implementar alterações localmente.
2. Validar localmente (layout, links, formulário e responsividade).
3. Compartilhar revisão com o cliente.
4. Publicar no Vercel **somente** após autorização explícita.

## Deploy manual (somente quando autorizado)
```bash
vercel --prod
```

## Observação de custo
Este projeto adota ciclo de testes local-first para evitar consumo desnecessário no Vercel.
