# Motion Controller — celular e câmera corporal

Controle jogos de PC usando os sensores do celular na mão ou rastreamento do corpo inteiro pela câmera do celular. Painel local, QR Code, perfis Futebol/Dança, teclas configuráveis e pausa global por F8.

## Instalar no PC de casa (Windows)

1. Instale **Node.js 22 ou superior** ([site oficial](https://nodejs.org)) e **Python 3.10 ou superior** ([site oficial](https://www.python.org/downloads/windows/)).
2. Neste repositório, clique em **Code → Download ZIP**. Extraia tudo para uma pasta no PC.
3. Abra **Instalar.cmd**. A primeira instalação precisa de internet: instala as bibliotecas e baixa/verifica o modelo corporal oficial do MediaPipe.
4. Abra **Iniciar.cmd**. O painel aparecerá em `http://127.0.0.1:3001`.
5. Conecte celular e PC ao mesmo roteador e leia o **novo QR Code do painel**. O endereço muda conforme a rede de casa; não use o endereço do PC do trabalho.
6. Confira o IP local no aviso do certificado HTTPS. No celular, escolha **sensores** ou **câmera**, toque em **Iniciar captura** e autorize a permissão.
7. Câmera: apoie o celular, enquadre cabeça e pés, afaste-se durante a contagem de 5 segundos e fique parado para calibrar. Confira o esqueleto no painel do PC.
8. Ajuste as teclas ao seu jogo, clique em **Ativar teclas no Windows** e coloque o jogo em primeiro plano. **F8 pausa**.

Se o celular não conectar, execute `Liberar-rede.ps1` como administrador para permitir TCP 3000 somente na sub-rede local. Redes de convidados podem bloquear a comunicação entre os aparelhos. Não abra portas no roteador.

## O que já existe

- Dois modos selecionáveis no celular: sensores e câmera corporal.
- Câmera: aproximação de chute, salto, passo lateral, agachamento e braços acima; retorno à posição neutra permite repetir o gesto.
- Sensores: balanços laterais/verticais e frontais; botão Ação.
- Transmissão por Socket.IO; teclas curtas no Windows; pausa automática se perder captura/conexão.
- Vídeo processado no celular. Só pontos corporais e gestos chegam ao PC; sem gravação.
- Certificado e sessão criados no computador de destino. Segredos, certificados e logs não fazem parte do repositório.

Esta versão funciona com jogos que aceitam as teclas configuradas. Não emula Kinect ou controle Xbox; não executa o Kinect Sports original de console. Gestos por câmera precisam de boa iluminação e enquadramento e ainda exigem teste/ajuste no seu aparelho. Não há garantia de 60 FPS. Alguns jogos bloqueiam teclas simuladas ou precisam de entradas mantidas, que esta versão não fornece.

## Desenvolvimento e verificação

`npm ci`, `node setup.js` e `npm start` iniciam o servidor. `Iniciar.cmd` também inicia a ponte Python com o Windows. `npm test` testa gestos sintéticos, pareamento, autorização, roteamento, pausa e recursos locais com o servidor ativo **e a ponte Python/celular desconectados**; o teste se recusa a rodar com a ponte ativa para não enviar teclas reais.

Os testes de integração e gestos sintéticos passaram no PC de desenvolvimento. Captura real no celular e compatibilidade dentro de jogos precisam de validação no dispositivo final. Veja [LEIA-ME.md](LEIA-ME.md) para detalhes de operação.
