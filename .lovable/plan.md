# Mapa vivo no Vacatio — plano em 4 fases

Estado atual verificado: o app já tem GPS (`useUserLocation`, `nativeGeofence`), abre mapas externos (`nativeMapsLauncher`) e tem a chave de navegador do Google Maps no ambiente (`VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`). O que **não** existe hoje é qualquer mapa renderizado dentro do app — nenhum arquivo usa `google.maps` / Mapbox.

## Fase 1 — Base do mapa (fundação)
- Loader único da Maps JavaScript API (`loading=async` + callback), carregado sob demanda só nas telas de mapa.
- Componente `MapaBase`: mapa com tema escuro/dourado alinhado à identidade do app, sem controles poluídos, respeitando o tema claro/escuro.
- Marcador "você" com pulso animado, seguindo o GPS em tempo real (reusa o watcher que já existe).
- Estados de erro/permissão negada e fallback (sem internet → cai no launcher externo atual).

## Fase 2 — Lembrete por local com mapa vivo
- Na tela de um lembrete (`LembretesLocal`), mostrar mapa com: seu pin, o pin do destino e o círculo do raio (100 m–2 km) desenhado de verdade.
- Distância em tempo real e ETA a pé/carro; barra de progresso "faltam X m".
- No cadastro do lembrete: escolher o ponto arrastando o pin no mapa, além da busca por endereço já existente.
- Banner de presença ("Você está no local") passa a mostrar mini-mapa.

## Fase 3 — Mapa dos locais jurídicos
- Alternância lista/mapa em `LocaisJuridicos`, com pins por categoria (fórum, cartório, OAB, delegacia…) e ícones distintos.
- Clique no pin abre card inferior com nome, distância, foto e ações (rota, ligar, detalhes).
- Reagrupamento de pins (clustering) e refiltro conforme a área visível do mapa.

## Fase 4 — Modo "A caminho"
- Tela cheia estilo 99: mapa segue o usuário, rota traçada até o destino, ETA e distância atualizando.
- Avatar personalizável no lugar do pin (escolha entre mascotes do app).
- Card inferior com etapas ("saiu", "a caminho", "chegando", "chegou") e ação rápida de abrir navegação externa para a rota passo a passo.
- Encerra sozinho ao entrar no raio, conectando com o disparo de lembrete que já existe.

## Detalhes técnicos
- Renderização com Maps JavaScript API (chave de navegador já disponível); marcadores clássicos `google.maps.Marker`, sem `mapId`.
- Cálculo de rota/ETA (Routes API) roda no backend via gateway, nunca com a chave de navegador.
- Consumo de bateria: reaproveitar o watcher único de `nativeGeofence` em vez de abrir novos watchers por tela.
- Tudo degrada com elegância offline: sem rede, mostra último ponto conhecido e o botão de mapa externo.

Ordem de execução: implementamos e validamos uma fase por vez, começando pela Fase 1.
