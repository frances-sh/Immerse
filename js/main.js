document.addEventListener('DOMContentLoaded', function() {
  // Sistema de áudio preciso
  const audioPlayers = new Map();
  let currentPlayer = null;

  // Carrega configurações
  async function loadAudioConfig(musical) {
    try {
      const response = await fetch(`audio/${musical}/config.json`);
      const config = await response.json();
      return config.audios[0];
    } catch (error) {
      console.error(`Erro ao carregar configuração para ${musical}:`, error);
      return null;
    }
  }

  // Cria player de áudio com controle preciso
  function createAudioPlayer(musical, config) {
    const audio = new Audio(`audio/${musical}/${config.nome}`);
    audio.volume = config.volume || 0.7;
    audio.preload = 'auto';
    
    // Controle de tempo preciso
    let isSeeking = false;
    audio.addEventListener('timeupdate', function() {
      if (isSeeking) return;
      
      // Verifica se atingiu o tempo final
      if (audio.currentTime >= config.tempo_fim) {
        console.log(`Parando no tempo exato: ${config.tempo_fim}s`);
        isSeeking = true;
        
        if (config.loop) {
          // Reinicia do tempo_inicio se loop estiver ativado
          audio.currentTime = config.tempo_inicio;
          audio.play().catch(e => console.error("Erro no loop:", e));
        } else {
          // Pausa se não estiver em loop
          audio.pause();
          audio.currentTime = config.tempo_inicio; // Prepara para próxima execução
          updateAudioIndicator(musical, false);
        }
        
        isSeeking = false;
      }
    });

    return audio;
  }

  // Atualiza o indicador visual
  function updateAudioIndicator(musical, isPlaying) {
    document.querySelectorAll('.musical-card').forEach(card => {
      if (card.dataset.musical === musical) {
        const indicator = card.querySelector('.audio-indicator');
        if (indicator) indicator.style.opacity = isPlaying ? '1' : '0';
      }
    });
  }

  // Controla a reprodução
  async function playAudio(musical) {
    // Pausa o áudio atual
    if (currentPlayer) {
      currentPlayer.pause();
      currentPlayer.currentTime = 0;
    }

    // Carrega configurações
    const config = await loadAudioConfig(musical);
    if (!config) return;

    // Verifica se os tempos são válidos
    if (config.tempo_fim <= config.tempo_inicio) {
      console.error(`Erro: tempo_fim (${config.tempo_fim}) deve ser maior que tempo_inicio (${config.tempo_inicio})`);
      return;
    }

    // Cria ou reutiliza o player
    if (!audioPlayers.has(musical)) {
      audioPlayers.set(musical, createAudioPlayer(musical, config));
    }

    const player = audioPlayers.get(musical);
    player.currentTime = config.tempo_inicio;
    currentPlayer = player;

    try {
      await player.play();
      console.log(`Reproduzindo de ${config.tempo_inicio}s até ${config.tempo_fim}s (loop: ${config.loop ? 'ON' : 'OFF'})`);
      updateAudioIndicator(musical, true);
    } catch (error) {
      console.error("Erro na reprodução:", error);
    }
  }

  // Configura eventos dos cards
  document.querySelectorAll('.musical-card').forEach(card => {
    card.addEventListener('mouseenter', () => playAudio(card.dataset.musical));
    card.addEventListener('mouseleave', () => {
      if (currentPlayer) {
        currentPlayer.pause();
        currentPlayer.currentTime = 0;
        updateAudioIndicator(card.dataset.musical, false);
      }
    });
  });

  // Desbloqueio de áudio para mobile
  function enableAudio() {
    const dummy = new Audio();
    dummy.play().then(() => dummy.remove());
    document.removeEventListener('click', enableAudio);
    document.removeEventListener('touchstart', enableAudio);
  }

  document.addEventListener('click', enableAudio, { once: true });
  document.addEventListener('touchstart', enableAudio, { once: true });
});