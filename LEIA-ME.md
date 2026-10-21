# Motion Controller

Abra `Iniciar.cmd`. O painel aparece em http://127.0.0.1:3001.

1. Conecte PC e celular ao mesmo roteador (PC por cabo funciona).
2. Leia o QR Code do painel com a câmera normal do celular. O link já faz o pareamento.
3. O certificado HTTPS foi gerado neste PC. No aviso do navegador, confira o IP do painel e use Avançado / Continuar para esse endereço local. Não instale certificados de terceiros. Se o navegador não permitir sensores/câmera mesmo após continuar, será necessário confiar no certificado local no aparelho ou usar uma conexão HTTPS confiável.
4. Escolha no celular **Celular na mão** ou **Corpo inteiro**. Toque em Iniciar captura e conceda a permissão solicitada.
5. No modo câmera, apoie o celular e enquadre cabeça e pés inteiros. A calibração começa após 5 segundos e usa 30 quadros com o corpo parado. Para recalibrar, toque no botão correspondente e afaste-se.
6. Confira a prévia no PC, escolha Futebol ou Dança e ajuste as teclas do seu jogo. Toque em Ativar teclas no Windows e traga o jogo para primeiro plano. F8 pausa globalmente. Pausar no painel ou Parar captura no celular também pausa as teclas.

## Gestos

- Sensores: balanços laterais → setas; impulso vertical → cima/baixo; balanço frontal → tecla de chute; botão Ação → Enter no perfil Futebol.
- Câmera: levantar/estender uma perna → chute; passo lateral → esquerda/direita; salto → tecla de salto; agachar → baixo; dois braços acima → ação.
- Para repetir um gesto, volte à posição neutra antes de fazê-lo novamente. Intervalo mínimo aproximado: 450 ms na câmera e 350 ms nos sensores.
- Cada gesto gera um toque curto de tecla. Este aplicativo não emula controle Xbox nem substitui nativamente o Kinect. O Kinect Sports original depende de console/hardware compatível. Use jogos de PC com suporte a teclado; alguns jogos bloqueiam entradas simuladas ou exigem teclas mantidas, que esta versão não fornece.

## Rede e desempenho

A porta HTTPS 3000 atende celulares na rede. O painel e a ponte de teclado ficam apenas em 127.0.0.1:3001. O QR contém um segredo temporário: compartilhe apenas com quem vai controlar o PC. Só um celular pareia por vez. Reiniciar gera outro QR. Desconexão/ausência de quadros pausa o controle automaticamente. A câmera processa os quadros no celular usando MediaPipe; apenas pontos e gestos são enviados ao PC. Não há gravação de vídeo. Bibliotecas e modelo estão instalados localmente; não é necessária internet durante o jogo. A taxa real depende do aparelho; a câmera tenta até 30 quadros/s, sem garantia de 60 FPS.

Se o endereço não abrir no celular: confira o Wi-Fi (redes de convidados podem isolar os dispositivos), desligue VPN para esse teste e verifique se o IP selecionado no painel é o correto. Para liberar o Firewall do Windows, execute `Liberar-rede.ps1` como administrador: a regra limita a conexão à sub-rede local, TCP 3000, processo Node. Não é necessário abrir portas do roteador.

Se a ponte Windows estiver offline, feche e abra `Iniciar.cmd`. Encerre pelo botão Encerrar aplicativo no painel. Os logs ficam em `server.log`, `server-error.log` e `input-error.log`.

## Componentes

Node.js + Express + Socket.IO, Python (biblioteca padrão/Win32) e MediaPipe Pose Landmarker Lite. O modelo corporal é aproximado: iluminação, oclusão, ângulo e enquadramento influenciam os gestos. Ajustes para seu jogo e teste com celular físico ainda são necessários.
