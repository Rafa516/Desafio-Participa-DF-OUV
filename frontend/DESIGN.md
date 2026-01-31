# Design System - Participa DF Ouvidoria

## Visão Geral

Este documento descreve o sistema de design adotado para o frontend do **Participa DF OUV**. A direção de arte escolhida foi o **Neumorfismo Acessível (Soft UI)**, que busca criar uma interface de usuário suave, tátil e amigável, sem comprometer a acessibilidade e a clareza.

## Princípios Fundamentais

1.  **Suavidade e Profundidade**: Uso de sombras sutis e luz para criar elementos que parecem extrudados da superfície, transmitindo uma sensação tátil e amigável.
2.  **Clareza Cognitiva**: Redução de ruído visual, focando no conteúdo e nas ações principais, essencial para acessibilidade e usabilidade em momentos de estresse (reclamações).
3.  **Inclusividade Visual**: Alto contraste adaptado, garantindo que o estilo "soft" não comprometa a legibilidade (WCAG 2.1 AA).
4.  **Humanização**: Elementos arredondados e transições suaves para tornar a experiência de ouvidoria menos burocrática e mais acolhedora.

## Paleta de Cores

| Cor              | Hex         | Uso                                    |
| ---------------- | ----------- | -------------------------------------- |
| Base             | `#F0F2F5`   | Fundo principal da aplicação           |
| Acento Primário  | `#3D5AFE`   | Ações principais, links e botões       |
| Acento Secundário| `#29DE91`   | Sucesso, validação e feedback positivo |
| Alerta           | `#FFA726`   | Avisos e notificações não-críticas    |
| Erro             | `#FF5252`   | Erros e feedback negativo              |
| Texto Principal  | `#1C1E21`   | Títulos e corpo de texto principal     |
| Texto Secundário | `#606770`   | Legendas, placeholders e textos de apoio|

## Tipografia

- **Primária (Títulos)**: **Nunito**, uma fonte arredondada, amigável e moderna.
- **Secundária (Corpo)**: **Lato**, uma fonte de alta legibilidade, neutra e funcional.

## Elementos de Interface

- **Botões "Soft"**: Botões que parecem pressionáveis, com efeito de profundidade criado por sombras internas e externas.
- **Ícones Duotone**: Ícones com duas tonalidades da mesma cor para adicionar profundidade sem complexidade.
- **Cartões Flutuantes**: Conteúdo organizado em "ilhas" ou cartões com bordas arredondadas e sombras suaves.

## Animação e Micro-interações

- **Transições Suaves**: Elementos deslizam e aparecem com `fade-in` suave (`ease-out`).
- **Feedback Tátil Visual**: Elementos reagem ao toque simulando física real (afundam levemente).
- **Skeleton Loading**: Carregamento progressivo que imita a estrutura dos cartões, melhorando a percepção de performance.
